/**
 * Esquema de Open Screen — versionado por migraciones.
 *
 * Reglas:
 * - Nunca modifiques una versión ya publicada.
 * - Para cambios nuevos, agrega una versión siguiente (v2, v3…).
 * - Los comentarios explican la intención de cada tabla.
 */
export const SCHEMA = {

  // ────────────────────────────────────────────────────────────────
  //  v1 — Estructura inicial
  // ────────────────────────────────────────────────────────────────
  v1: `
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES
      ('theme',           'light'),
      ('projection_bg',   'dark'),
      ('font_size',       'auto'),
      ('active_monitor',  'secondary');

    CREATE TABLE IF NOT EXISTS library_items (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      title      TEXT    NOT NULL,
      content    TEXT    NOT NULL,
      type       TEXT    NOT NULL DEFAULT 'text',
      tags       TEXT    NOT NULL DEFAULT '[]',
      created_at TEXT    DEFAULT (datetime('now')),
      updated_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS slides (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      library_item_id INTEGER REFERENCES library_items(id) ON DELETE CASCADE,
      content         TEXT    NOT NULL,
      bg_type         TEXT    NOT NULL DEFAULT 'dark',
      bg_value        TEXT,
      font_size       INTEGER,
      text_color      TEXT    DEFAULT '#ffffff',
      order_index     INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS media (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      path       TEXT    NOT NULL UNIQUE,
      type       TEXT    NOT NULL,
      mime_type  TEXT,
      size_bytes INTEGER,
      created_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS presentations (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      description TEXT,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS presentation_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      presentation_id INTEGER NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
      library_item_id INTEGER NOT NULL REFERENCES library_items(id) ON DELETE CASCADE,
      order_index     INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_library_items_type    ON library_items(type);
    CREATE INDEX IF NOT EXISTS idx_library_items_updated ON library_items(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_slides_item           ON slides(library_item_id);
    CREATE INDEX IF NOT EXISTS idx_pres_items_pres       ON presentation_items(presentation_id);
  `,

  // ────────────────────────────────────────────────────────────────
  //  v2 — Módulo Biblia (OSBF — Open Screen Bible Format v1.0)
  // ────────────────────────────────────────────────────────────────
  v2: `
    CREATE TABLE IF NOT EXISTS bible_versions (
      id            TEXT    PRIMARY KEY,
      name          TEXT    NOT NULL,
      abbreviation  TEXT    NOT NULL,
      language      TEXT    NOT NULL,
      direction     TEXT    NOT NULL DEFAULT 'ltr',
      license       TEXT    NOT NULL,
      copyright     TEXT,
      description   TEXT,
      publisher     TEXT,
      year          INTEGER,
      testament     TEXT    NOT NULL DEFAULT 'both',
      canonical     INTEGER NOT NULL DEFAULT 1,
      deuterocanon  INTEGER NOT NULL DEFAULT 0,
      is_default    INTEGER NOT NULL DEFAULT 0,
      osbf_version  TEXT    NOT NULL DEFAULT '1.0',
      installed_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bible_books (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id  TEXT    NOT NULL REFERENCES bible_versions(id) ON DELETE CASCADE,
      book_number INTEGER NOT NULL,
      usfm        TEXT    NOT NULL,
      name        TEXT    NOT NULL,
      short_name  TEXT    NOT NULL,
      testament   TEXT    NOT NULL,
      UNIQUE(version_id, book_number)
    );

    CREATE TABLE IF NOT EXISTS bible_verses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id  TEXT    NOT NULL REFERENCES bible_versions(id) ON DELETE CASCADE,
      book_number INTEGER NOT NULL,
      chapter     INTEGER NOT NULL,
      verse       INTEGER NOT NULL,
      text        TEXT    NOT NULL,
      heading     TEXT,
      note        TEXT,
      UNIQUE(version_id, book_number, chapter, verse)
    );

    CREATE INDEX IF NOT EXISTS idx_bv_ref    ON bible_verses(version_id, book_number, chapter, verse);
    CREATE INDEX IF NOT EXISTS idx_bv_search ON bible_verses(version_id, text);
    CREATE INDEX IF NOT EXISTS idx_bb_usfm   ON bible_books(version_id, usfm);

    CREATE VIRTUAL TABLE IF NOT EXISTS bible_verses_fts
      USING fts5(
        text,
        version_id  UNINDEXED,
        book_number UNINDEXED,
        chapter     UNINDEXED,
        verse       UNINDEXED,
        content='bible_verses',
        content_rowid='id'
      );

    CREATE TRIGGER IF NOT EXISTS bible_verses_fts_ins
      AFTER INSERT ON bible_verses BEGIN
        INSERT INTO bible_verses_fts(rowid, text, version_id, book_number, chapter, verse)
        VALUES (new.id, new.text, new.version_id, new.book_number, new.chapter, new.verse);
      END;

    CREATE TRIGGER IF NOT EXISTS bible_verses_fts_del
      AFTER DELETE ON bible_verses BEGIN
        INSERT INTO bible_verses_fts(bible_verses_fts, rowid, text, version_id, book_number, chapter, verse)
        VALUES ('delete', old.id, old.text, old.version_id, old.book_number, old.chapter, old.verse);
      END;
  `,

  // ────────────────────────────────────────────────────────────────
  //  v3 — Módulo de Canciones
  // ────────────────────────────────────────────────────────────────
  v3: `
    CREATE TABLE IF NOT EXISTS songs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      artist      TEXT    NOT NULL DEFAULT '',
      key_sig     TEXT    NOT NULL DEFAULT '',
      tempo       INTEGER,
      copyright   TEXT    NOT NULL DEFAULT '',
      tags        TEXT    NOT NULL DEFAULT '[]',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT    DEFAULT (datetime('now')),
      updated_at  TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS song_sections (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      song_id     INTEGER NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
      type        TEXT    NOT NULL DEFAULT 'verse',
      label       TEXT    NOT NULL DEFAULT '',
      lyrics      TEXT    NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_songs_title    ON songs(title);
    CREATE INDEX IF NOT EXISTS idx_songs_artist   ON songs(artist);
    CREATE INDEX IF NOT EXISTS idx_songs_favorite ON songs(is_favorite);
    CREATE INDEX IF NOT EXISTS idx_sections_song  ON song_sections(song_id, order_index);
  `,

  // ────────────────────────────────────────────────────────────────
  //  v4 — Presentaciones de archivo (PDF)
  // ────────────────────────────────────────────────────────────────
  v4: `
    CREATE TABLE IF NOT EXISTS slide_presentations (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      file_path    TEXT    NOT NULL UNIQUE,
      file_type    TEXT    NOT NULL DEFAULT 'pdf',
      page_count   INTEGER NOT NULL DEFAULT 0,
      thumbnail    TEXT,
      created_at   TEXT    DEFAULT (datetime('now')),
      updated_at   TEXT    DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sp_name ON slide_presentations(name);
  `,
  // ────────────────────────────────────────────────────────────────
  //  v5 — Favoritos en presentaciones
  // ────────────────────────────────────────────────────────────────
  v5: `
    ALTER TABLE slide_presentations ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;
  `
}