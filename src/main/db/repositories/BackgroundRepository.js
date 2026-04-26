export class BackgroundRepository {
  #db

  constructor(db) {
    this.#db = db
  }

  findAll({ type = null, favorite = null } = {}) {
    let q = 'SELECT * FROM backgrounds WHERE 1=1'
    const params = []
    if (type)            { q += ' AND type = ?';         params.push(type) }
    if (favorite === true) { q += ' AND is_favorite = 1' }
    q += ' ORDER BY is_preset DESC, is_favorite DESC, created_at DESC'
    return this.#db.prepare(q).all(...params)
  }

  findById(id) {
    return this.#db.prepare('SELECT * FROM backgrounds WHERE id = ?').get(id) ?? null
  }

  create({ name, type, value, thumbnail = null }) {
    const result = this.#db
      .prepare('INSERT INTO backgrounds (name, type, value, thumbnail) VALUES (?, ?, ?, ?)')
      .run(name, type, value, thumbnail)
    return this.findById(result.lastInsertRowid)
  }

  update(id, { name, value, thumbnail }) {
    const fields = []; const params = []
    if (name      !== undefined) { fields.push('name = ?');      params.push(name) }
    if (value     !== undefined) { fields.push('value = ?');     params.push(value) }
    if (thumbnail !== undefined) { fields.push('thumbnail = ?'); params.push(thumbnail) }
    if (!fields.length) return this.findById(id)
    params.push(id)
    this.#db.prepare(`UPDATE backgrounds SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return this.findById(id)
  }

  toggleFavorite(id) {
    this.#db.prepare(`
      UPDATE backgrounds
      SET is_favorite = CASE WHEN is_favorite=1 THEN 0 ELSE 1 END
      WHERE id = ?
    `).run(id)
    return this.findById(id)
  }

  delete(id) {
    // No permitir borrar presets del sistema
    return this.#db
      .prepare('DELETE FROM backgrounds WHERE id = ? AND is_preset = 0')
      .run(id).changes > 0
  }
}