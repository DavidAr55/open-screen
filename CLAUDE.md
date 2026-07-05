# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working with Claude
- Always respond in Spanish
- No greetings or unnecessary explanations — respond directly to the request
- Never rewrite entire files; modify only the required lines or blocks
- For large tasks, show the plan first and wait for confirmation before executing
- If something is ambiguous, ask before assuming
- Prefer surgical edits over broad refactors unless explicitly requested
- After completing a task, summarize in 1-2 lines what changed and why

## Commands

```bash
pnpm dev          # Start dev mode with hot-reload (electron-vite dev)
pnpm build        # Production build
pnpm preview      # Preview production build
pnpm install      # Install deps; postinstall auto-rebuilds better-sqlite3 for Electron

# Packaging (electron-builder)
pnpm dist         # Installer for the current platform
pnpm dist:win     # NSIS installer (Windows)
pnpm dist:mac     # .dmg (macOS)
pnpm dist:linux   # .AppImage (Linux)

# Bible module tools
pnpm bible:import   # Import a .osb Bible module into the DB
pnpm bible:validate # Validate a Bible import file
pnpm bible:info     # Show info about a Bible file
```

There are no lint or test scripts.

After updating the Electron version, `better-sqlite3` must be rebuilt:
```bash
npx @electron/rebuild -f -w better-sqlite3
```

## Architecture

Open Screen is a dual-window Electron app: a **Control** window (operator UI) and a **Projection** window (fullscreen on secondary display). The two windows communicate exclusively through the main process.

### Process boundaries

| Layer | Entry point | Preload |
|---|---|---|
| Main process | `src/main/index.js` | — |
| Control renderer | `src/renderer/control/src/main.jsx` | `src/preload/control.js` |
| Projection renderer | `src/renderer/projection/src/main.jsx` | `src/preload/projection.js` |

- `control.js` preload exposes `window.api` with namespaces (`app`, `projection`, `library`, `settings`, `displays`, `backup`, `bible`, `songs`, `presentations`, `backgrounds`, `multimedia`, `search`, `fonts`, `watermark`). CRUD uses `ipcRenderer.invoke`; fire-and-forget projection events use `ipcRenderer.send`.
- `projection.js` preload is **receive-only** — it exposes `onReceive`, `onClear`, `onFreeze`, `onSlide`, `onMedia`, `onMediaControl`, `onSetBg`, `onSetFont`, `onSetFontSize`, `onSetWatermark`, and `removeAllListeners`.

### IPC handlers (`src/main/ipc/`)

One file per domain. `ipcMain.handle` for query/reply patterns; `ipcMain.on` + `windowManager.sendToProjection(channel, payload)` for one-way relay to the projection window. The relevant one-way channels are `projection:send`, `projection:clear`, `projection:freeze`, `projection:setFont`, `projection:setFontSize`, `projection:setWatermark`, `presentations:projectSlide`, `presentations:clearSlide`, `projection:setBg`, `backgrounds:setActive` (pushes the active background object to the projection window immediately when the operator changes it), and `multimedia:project`/`multimedia:clear`/`multimedia:mediaControl` (direct-to-projection media playback).

Beyond the per-domain CRUD handlers, a few are notable:
- **`backup.ipc.js`** — operates on the raw `better-sqlite3` connection (not a repository) via `db.backup()`. Import validates the source file has a `settings` table, writes a pre-import safety backup, then replaces the DB file and relaunches the app.
- **`fonts.ipc.js`** — lists installed system fonts (`font-list` package) for the projection font picker.
- **`watermark.ipc.js`** — lets the operator pick a logo image (≤5MB) and returns it as a base64 data URL.
- **`search.ipc.js`** — `search:global` is the only handler that takes the full `repos` object; it fans a single query out to Bible reference parsing (`utils/bibleReference.js`), Bible FTS5, songs FTS5, presentations, media, and library, returning grouped results in one IPC round trip.
- **`songs.ipc.js`** — also handles PPTX import: `songs:pickPptx` opens a file dialog, `songs:parsePptx` extracts per-slide text via `utils/pptxParser.js` (JSZip + fast-xml-parser, text only — no image bytes are read).
- **`displays.ipc.js`** — `displays:setActiveMonitor` calls `windowManager.moveProjectionTo(pref)` to hot-move the projection window without restarting the app.

### Database (`src/main/db/`)

`better-sqlite3` in WAL mode, stored at `userData/open-screen.db`. Schema is managed via `user_version` pragma migrations (currently v8). Repositories are synchronous classes; each IPC handler imports the repository it needs directly.

**Exception**: `BibleRepository` opens `.osb` files (independent SQLite databases in `userData/bibles/`) as separate read-only connections, not the main DB.

Migration history at a glance:
- v1 — core tables: `settings`, `library_items`, `slides`, `media`, `presentations`
- v2 — `bible_versions`, `bible_books`, `bible_verses` + FTS5 virtual table
- v3 — `songs`, `song_sections`
- v4 — `slide_presentations` (PDF presentations)
- v5 — `is_favorite` on `slide_presentations`
- v6 — `backgrounds` table (5 preset entries seeded on creation)
- v7 — `media` extended with `thumbnail`, `is_favorite`, `updated_at` (direct-to-projection multimedia library)
- v8 — `songs_fts` (FTS5, non-`content=`, indexes `title`+`artist`+concatenated section lyrics via triggers) for the global search bar

### Media file serving

The main process starts a local HTTP server on a random port at `127.0.0.1` to serve background/multimedia files with HTTP Range support (so videos stream correctly via HTTP 206) and a permissive CORS header. Paths are normalized to `http://127.0.0.1:<port>/bg?path=...` before being sent to renderers.

### Control renderer state

No external state library. A single React Context (`AppContext` / `AppProvider`) at the root holds:
- **Navigation** — `activePage` string set from the sidebar; `navigateTo(page, selection)` (used by `GlobalSearch`) also sets `pendingSelection` (`{type, payload, ts}`, `ts` forces re-selection of the same item), which the target page consumes in a `useEffect` and clears via `clearPendingSelection`
- **Appearance** — `theme` (toggles `.dark` on `<html>`), `fontFamily` (maps via `FONT_MAP` to `document.body.style.fontFamily`), `animationSpeed` (toggles `anim-slow`/`anim-fast` classes on `<html>`)
- **Interaction** — `projectionClickMode` (`'single'`/`'double'`), rebindable keys `keyNavNext`/`keyNavPrev`/`keyProjToggle` plus `isNavNext`/`isNavPrev` helpers. A global `keydown` handler in the provider calls `toggleProjection()` when `keyProjToggle` is pressed (ignored while focused in inputs).
- **Projection settings** — `activeMonitor` (`'primary'|'secondary'|'third'`, also triggers `window.api.displays.setActiveMonitor` to hot-move the window), `projFontSize`, `projectionFontFamily` (both pushed live via `window.api.projection.setFontSize`/`setFont`), `autoHideControls` (hides `Topbar`/`Sidebar` in `App.jsx` when live + single display)
- **Watermark** — `watermark` object (`enabled`, `image` data URL, `position`, `opacity`, `margin`); `setWatermark(patch)` merges, pushes to projection via `window.api.projection.setWatermark`, and persists each field under its own `watermark_*` setting key
- **Bible preferences** — `defaultBibleModule`, `showVerseNumbers`
- **Library** — `library`, `refreshLibrary`, `createItem`, `deleteItem`, `deleteMany`
- **Live projection** — `liveText`, `isLive`, `activeBg` (`{type, value, id?, name?}`, falls back to `DEFAULT_BG` from `@shared/constants/defaultBackground.js`), `projCount`, `project`, `clearProjection`, `toggleProjection` (turns off without losing content, replays `lastPayload` to turn back on), `nextText`/`setNextText` (transient "what's coming up next" string fed by whichever page is active, read by `StagePage`)
- **Monitors** — `displays`

All appearance/interaction/projection/watermark/Bible-preference state is hydrated from persisted settings on init and written back through `window.api.settings.set` on every change. Setting keys include `theme`, `font_family`, `animation_speed`, `projection_click_mode`, `key_nav_next`, `key_nav_prev`, `key_proj_toggle`, `active_monitor`, `font_size`, `projection_font_family`, `auto_hide_controls`, `default_background_id`, `default_bible_module`, `show_verse_numbers`, `watermark_enabled`, `watermark_image`, `watermark_position`, `watermark_opacity`, `watermark_margin`.

### Control renderer pages

- **ControlPage** — free-text `SlideEditor` + `QuickGrid` of saved library items
- **ScripturePage** — Bible browser with navigate (book/chapter/verse) and search (FTS5 debounced) modes
- **SongsPage** — Song CRUD with section editor (drag-to-reorder), detail view, step-through `SongProjector` mode, and PPTX import (`components/songs/PptxImportView.jsx`) via `window.api.songs.pickPptx`/`parsePptx`
- **PresentationsPage** — PDF import via Electron dialog; pages rendered client-side with `pdfjs-dist` in batches; projected as base64 dataURL images
- **MultimediaPage** — imports images/GIFs/videos (copied into `userData/multimedia/`), lists/favorites/deletes them, and projects them directly (bypassing the text/background layer) via `window.api.multimedia.project`/`clear`/`mediaControl`
- **StagePage** — read-only presenter monitor: clock, `liveText`, and `nextText` ("what's coming up"); no controls, meant for a confidence screen
- **SettingsPage** — Grouped sections: Appearance (theme, font, animation speed), Interaction (click-to-project mode, key-binding capture for navigate/toggle keys), Projection (monitor picker, default background, font/font-size, watermark), Bible preferences (default module, verse numbers), Database (backup export/import), General (language, updates, start-on-login), About. Appearance/Interaction/Projection/Watermark/Bible settings are live (wired through `AppContext`); a few remaining toggles are persisted but not yet acted on.

### Global search (`components/layout/GlobalSearch.jsx`)

Debounced calls to `window.api.search.global(query)` render grouped results (styled per `@shared/constants/searchTypes.js` — colors/labels keyed by result `type`, aligned with `Sidebar.jsx`'s `TYPE_BADGES`). Selecting a result calls `navigateTo(page, {type, payload})` to jump to the owning page and deep-link the specific item.

### Projection renderer (`src/renderer/projection/src/App.jsx`)

Renders stacked layers, front to back:
1. **Background** — solid color, CSS gradient, image, GIF, or looping muted video (suppressed while `media` or a slide is showing)
2. **Multimedia** — image/GIF/video pushed directly from `MultimediaPage`, `object-fit: contain`; video playback is remote-controlled via `onMediaControl` (play/pause/seek/volume/muted)
3. **Text** — font size via `resolveFontSize` (`@shared/utils/font.js`, respects the operator's font-size mode) and font family via `buildFontFamily`/`onSetFont`, CSS fade+translateY transition (220ms). A `\n\n—` separator splits main text from a smaller subtext line (used for Bible references and song attribution).
4. **Slide image** — base64 dataURL for PDF presentations, `object-fit: contain`
5. **Watermark** — optional logo image, corner-positioned via `watermarkCornerStyle` (`@shared/constants/watermark.js`), non-interactive overlay

### Shared UI (`src/renderer/shared/`)

Design system in `components/ui/index.jsx`: `Button` (primary/secondary/danger/ghost), `Card`, `Badge`, `LiveBadge`, `Input`, `Textarea`, `Select`, `Spinner`, `SectionLabel`, `Divider`. Path alias `@shared` is configured in `electron.vite.config.mjs`.

`utils/font.js` (`buildFontFamily`, `resolveFontSize`/`calcAutoFontSize`) and `constants/` (`defaultBackground.js`, `watermark.js`, `searchTypes.js`) are consumed by both the control and projection renderers so font sizing, the fallback background, and watermark/search styling stay in sync across windows.

### Multi-monitor projection (`WindowManager`)

`#pickDisplay(pref)` resolves the `'primary'|'secondary'|'third'` preference (persisted as `active_monitor`) to an actual `Display`, falling back to the primary if the preferred one isn't connected. `moveProjectionTo(pref)` re-applies this at runtime (called from `displays:setActiveMonitor`) without recreating the window.

### Bible module format (OSB)

`.osb` files are standalone SQLite databases. Schema: `meta` (key/value), `books` (id, name, abbrev, testament), `verses` (BBCCCVVV-compatible ID + text). The `scripts/create-osb-module.mjs` script generates them from a JSON source. See `docs/BIBLE_STANDARD.md` for the full spec.
