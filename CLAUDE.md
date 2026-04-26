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
npm run dev          # Start dev mode with hot-reload (electron-vite dev)
npm run build        # Production build
npm run preview      # Preview production build
npm install          # Install deps; postinstall auto-rebuilds better-sqlite3 for Electron

# Bible module tools
npm run bible:import   # Import a .osb Bible module into the DB
npm run bible:validate # Validate a Bible import file
npm run bible:info     # Show info about a Bible file
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

- `control.js` preload exposes `window.api` with namespaces (`projection`, `library`, `settings`, `displays`, `bible`, `songs`, `presentations`, `backgrounds`). CRUD uses `ipcRenderer.invoke`; fire-and-forget projection events use `ipcRenderer.send`.
- `projection.js` preload is **receive-only** — it exposes only `onReceive`, `onClear`, `onFreeze`, `onSlide`, `onSetBg`, and `removeAllListeners`.

### IPC handlers (`src/main/ipc/`)

One file per domain. `ipcMain.handle` for query/reply patterns; `ipcMain.on` + `windowManager.sendToProjection(channel, payload)` for one-way relay to the projection window. The relevant channels are `projection:send`, `projection:clear`, `projection:freeze`, `presentations:projectSlide`, and `projection:setBg`.

### Database (`src/main/db/`)

`better-sqlite3` in WAL mode, stored at `userData/open-screen.db`. Schema is managed via `user_version` pragma migrations (currently v6). Repositories are synchronous classes; each IPC handler imports the repository it needs directly.

**Exception**: `BibleRepository` opens `.osb` files (independent SQLite databases in `userData/bibles/`) as separate read-only connections, not the main DB.

Migration history at a glance:
- v1 — core tables: `settings`, `library_items`, `slides`, `media`, `presentations`
- v2 — `bible_versions`, `bible_books`, `bible_verses` + FTS5 virtual table
- v3 — `songs`, `song_sections`
- v4 — `slide_presentations` (PDF presentations)
- v5 — `is_favorite` on `slide_presentations`
- v6 — `backgrounds` table (5 preset entries seeded on creation)

### Media file serving

The main process starts a local HTTP server on a random port at `127.0.0.1` to serve background media files with HTTP Range support (so videos stream correctly via HTTP 206). Background paths are normalized to `http://127.0.0.1:<port>/bg?path=...` before being sent to renderers.

### Control renderer state

No external state library. A single React Context (`AppContext` / `AppProvider`) at the root holds: active page, theme, library items, live projection state (`liveText`, `isLive`, `activeBg`, `projCount`), and display list. Navigation is driven by an `activePage` string set from the sidebar.

### Control renderer pages

- **ControlPage** — free-text `SlideEditor` + `QuickGrid` of saved library items
- **ScripturePage** — Bible browser with navigate (book/chapter/verse) and search (FTS5 debounced) modes
- **SongsPage** — Song CRUD with section editor (drag-to-reorder), detail view, and step-through `SongProjector` mode
- **PresentationsPage** — PDF import via Electron dialog; pages rendered client-side with `pdfjs-dist` in batches; projected as base64 dataURL images
- **SettingsPage** — Theme, monitor selection, projection background, font, animation speed, Bible preferences, DB backup

### Projection renderer (`src/renderer/projection/src/App.jsx`)

Renders three stacked layers:
1. **Background** — solid color, CSS gradient, image, GIF, or looping muted video
2. **Text** — dynamic font size (`calcFontSize` based on line count and max char width), CSS fade+translateY transition (220ms). A `\n\n—` separator splits main text from a smaller subtext line (used for Bible references and song attribution).
3. **Slide image** — base64 dataURL for PDF presentations, `object-fit: contain`

### Shared UI (`src/renderer/shared/`)

Design system in `components/ui/index.jsx`: `Button` (primary/secondary/danger/ghost), `Card`, `Badge`, `LiveBadge`, `Input`, `Textarea`, `Select`, `Spinner`, `SectionLabel`, `Divider`. Path alias `@shared` is configured in `electron.vite.config.mjs`.

### Bible module format (OSB)

`.osb` files are standalone SQLite databases. Schema: `meta` (key/value), `books` (id, name, abbrev, testament), `verses` (BBCCCVVV-compatible ID + text). The `scripts/create-osb-module.mjs` script generates them from a JSON source. See `docs/BIBLE_STANDARD.md` for the full spec.
