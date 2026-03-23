/**
 * LibraryRepository
 * CRUD completo para la tabla `library_items`.
 * Los tags se almacenan como JSON string y se parsean al leer.
 */
export class LibraryRepository {
  #db

  constructor(db) {
    this.#db = db
  }

  // ── Lectura ───────────────────────────────────────────────────────

  findAll({ type = null, search = null, limit = 100, offset = 0 } = {}) {
    let query = 'SELECT * FROM library_items WHERE 1=1'
    const params = []

    if (type) {
      query += ' AND type = ?'
      params.push(type)
    }

    if (search) {
      query += ' AND (title LIKE ? OR content LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const rows = this.#db.prepare(query).all(...params)
    return rows.map(this.#parse)
  }

  findById(id) {
    const row = this.#db
      .prepare('SELECT * FROM library_items WHERE id = ?')
      .get(id)
    return row ? this.#parse(row) : null
  }

  count(type = null) {
    const query = type
      ? 'SELECT COUNT(*) as n FROM library_items WHERE type = ?'
      : 'SELECT COUNT(*) as n FROM library_items'
    const row = type
      ? this.#db.prepare(query).get(type)
      : this.#db.prepare(query).get()
    return row.n
  }

  // ── Escritura ─────────────────────────────────────────────────────

  create({ title, content, type = 'text', tags = [] }) {
    const result = this.#db
      .prepare(`
        INSERT INTO library_items (title, content, type, tags)
        VALUES (?, ?, ?, ?)
      `)
      .run(title, content, type, JSON.stringify(tags))

    return this.findById(result.lastInsertRowid)
  }

  update(id, { title, content, type, tags }) {
    const fields = []
    const params = []

    if (title   !== undefined) { fields.push('title = ?');            params.push(title) }
    if (content !== undefined) { fields.push('content = ?');          params.push(content) }
    if (type    !== undefined) { fields.push('type = ?');             params.push(type) }
    if (tags    !== undefined) { fields.push('tags = ?');             params.push(JSON.stringify(tags)) }

    if (fields.length === 0) return this.findById(id)

    fields.push("updated_at = datetime('now')")
    params.push(id)

    this.#db
      .prepare(`UPDATE library_items SET ${fields.join(', ')} WHERE id = ?`)
      .run(...params)

    return this.findById(id)
  }

  delete(id) {
    const info = this.#db
      .prepare('DELETE FROM library_items WHERE id = ?')
      .run(id)
    return info.changes > 0
  }

  // ── Helper interno ────────────────────────────────────────────────

  #parse(row) {
    return {
      ...row,
      tags: (() => {
        try { return JSON.parse(row.tags) } catch { return [] }
      })()
    }
  }
}
