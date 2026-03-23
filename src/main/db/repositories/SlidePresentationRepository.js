/**
 * SlidePresentationRepository
 * Gestiona los archivos de presentación subidos (PDF, etc.)
 * Solo almacena metadatos — los archivos viven en el filesystem.
 */
export class SlidePresentationRepository {
  #db

  constructor(db) {
    this.#db = db
  }

  findAll() {
    return this.#db
      .prepare('SELECT * FROM slide_presentations ORDER BY updated_at DESC')
      .all()
  }

  findById(id) {
    return this.#db
      .prepare('SELECT * FROM slide_presentations WHERE id = ?')
      .get(id) ?? null
  }

  create({ name, file_path, file_type = 'pdf', page_count = 0, thumbnail = null }) {
    const result = this.#db
      .prepare(`
        INSERT INTO slide_presentations (name, file_path, file_type, page_count, thumbnail)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(name, file_path, file_type, page_count, thumbnail)
    return this.findById(result.lastInsertRowid)
  }

  update(id, { name, page_count, thumbnail }) {
    const fields = []
    const params = []
    if (name        !== undefined) { fields.push('name = ?');        params.push(name) }
    if (page_count  !== undefined) { fields.push('page_count = ?');  params.push(page_count) }
    if (thumbnail   !== undefined) { fields.push('thumbnail = ?');   params.push(thumbnail) }
    if (!fields.length) return this.findById(id)
    fields.push("updated_at = datetime('now')")
    params.push(id)
    this.#db.prepare(`UPDATE slide_presentations SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return this.findById(id)
  }

  delete(id) {
    return this.#db.prepare('DELETE FROM slide_presentations WHERE id = ?').run(id).changes > 0
  }
}