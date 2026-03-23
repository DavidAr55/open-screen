import Database from 'better-sqlite3'
import { app }   from 'electron'
import { join, extname } from 'path'
import { existsSync, mkdirSync, readdirSync } from 'fs'

/**
 * BibleRepository
 *
 * Gestiona los módulos bíblicos (.osb) instalados en userData/bibles/.
 * Cada módulo es un SQLite independiente con el schema Open Screen Bible (OSB v1).
 *
 * IMPORTANTE: El repo principal de la app NO almacena texto bíblico.
 * Cada módulo es un archivo independiente que el usuario instala,
 * lo que respeta los derechos de autor de las traducciones con copyright.
 */
export class BibleRepository {
  #biblesDir
  #connections = new Map() // moduleId → Database instance

  constructor() {
    this.#biblesDir = join(app.getPath('userData'), 'bibles')
    if (!existsSync(this.#biblesDir)) {
      mkdirSync(this.#biblesDir, { recursive: true })
    }
  }

  // ── Descubrimiento de módulos instalados ───────────────────────────────

  listModules() {
    const files = readdirSync(this.#biblesDir).filter(f => extname(f) === '.osb')
    const modules = []
    for (const file of files) {
      try {
        const db   = new Database(join(this.#biblesDir, file), { readonly: true })
        const meta = this.#readMeta(db)
        db.close()
        modules.push({ ...meta, filename: file })
      } catch (e) {
        console.warn(`[Bible] No se pudo leer módulo ${file}:`, e.message)
      }
    }
    return modules
  }

  getBiblesDir() {
    return this.#biblesDir
  }

  // ── Libros y navegación ────────────────────────────────────────────────

  getBooks(moduleId) {
    return this.#db(moduleId)
      .prepare('SELECT * FROM books ORDER BY id')
      .all()
  }

  getChapterCount(moduleId, bookId) {
    const row = this.#db(moduleId)
      .prepare('SELECT MAX(chapter) as n FROM verses WHERE book = ?')
      .get(bookId)
    return row?.n ?? 0
  }

  // ── Consulta de versículos ─────────────────────────────────────────────

  getVerse(moduleId, book, chapter, verse) {
    const row = this.#db(moduleId).prepare(`
      SELECT v.*, b.name as book_name, b.abbrev as book_abbrev
      FROM verses v JOIN books b ON b.id = v.book
      WHERE v.book = ? AND v.chapter = ? AND v.verse = ?
    `).get(book, chapter, verse)
    return row ? this.#fmt(row) : null
  }

  getChapter(moduleId, book, chapter) {
    return this.#db(moduleId).prepare(`
      SELECT v.*, b.name as book_name, b.abbrev as book_abbrev
      FROM verses v JOIN books b ON b.id = v.book
      WHERE v.book = ? AND v.chapter = ?
      ORDER BY v.verse
    `).all(book, chapter).map(this.#fmt)
  }

  // ── Búsqueda ───────────────────────────────────────────────────────────

  search(moduleId, query, { limit = 50, offset = 0 } = {}) {
    const db      = this.#db(moduleId)
    const pattern = `%${query}%`
    const total   = db.prepare('SELECT COUNT(*) as n FROM verses WHERE text LIKE ?').get(pattern).n
    const results = db.prepare(`
      SELECT v.*, b.name as book_name, b.abbrev as book_abbrev
      FROM verses v JOIN books b ON b.id = v.book
      WHERE v.text LIKE ?
      ORDER BY v.id LIMIT ? OFFSET ?
    `).all(pattern, limit, offset).map(this.#fmt)
    return { total, results }
  }

  // ── Validación de módulos externos ────────────────────────────────────

  validateModule(filePath) {
    try {
      const db     = new Database(filePath, { readonly: true })
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all().map(r => r.name)
      const missing = ['meta', 'books', 'verses'].filter(t => !tables.includes(t))
      if (missing.length) return { valid: false, error: `Tablas faltantes: ${missing.join(', ')}` }
      const meta      = this.#readMeta(db)
      const verseCount = db.prepare('SELECT COUNT(*) as n FROM verses').get().n
      db.close()
      if (!meta.id || !meta.name)
        return { valid: false, error: 'Metadatos incompletos (id y name son requeridos)' }
      return { valid: true, meta, verseCount }
    } catch (e) {
      return { valid: false, error: e.message }
    }
  }

  closeAll() {
    for (const db of this.#connections.values()) db.close()
    this.#connections.clear()
  }

  // ── Privados ───────────────────────────────────────────────────────────

  #db(moduleId) {
    if (this.#connections.has(moduleId)) return this.#connections.get(moduleId)
    const files = readdirSync(this.#biblesDir).filter(f => extname(f) === '.osb')
    for (const file of files) {
      const db   = new Database(join(this.#biblesDir, file), { readonly: true })
      const meta = this.#readMeta(db)
      if (meta.id === moduleId) { this.#connections.set(moduleId, db); return db }
      db.close()
    }
    throw new Error(`[Bible] Módulo '${moduleId}' no instalado en ${this.#biblesDir}`)
  }

  #readMeta(db) {
    return Object.fromEntries(
      db.prepare('SELECT key, value FROM meta').all().map(r => [r.key, r.value])
    )
  }

  #fmt(row) {
    return {
      id:         row.id,
      book:       row.book,
      bookName:   row.book_name,
      bookAbbrev: row.book_abbrev,
      chapter:    row.chapter,
      verse:      row.verse,
      text:       row.text,
      reference:  `${row.book_name} ${row.chapter}:${row.verse}`,
    }
  }
}
