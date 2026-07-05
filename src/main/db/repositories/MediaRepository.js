import { escapeLike } from '../../utils/sqlHelpers.js'

/**
 * MediaRepository
 * Registra y consulta los archivos multimedia usados en proyecciones.
 * Solo guarda la ruta; los archivos viven en el filesystem del usuario.
 */
export class MediaRepository {
  #db

  constructor(db) {
    this.#db = db
  }

  findAll(type = null) {
    const query = type
      ? 'SELECT * FROM media WHERE type = ? ORDER BY is_favorite DESC, created_at DESC'
      : 'SELECT * FROM media ORDER BY is_favorite DESC, created_at DESC'
    return type
      ? this.#db.prepare(query).all(type)
      : this.#db.prepare(query).all()
  }

  findById(id) {
    return this.#db.prepare('SELECT * FROM media WHERE id = ?').get(id) ?? null
  }

  /** Búsqueda por nombre para el buscador global. */
  searchByName(query, { limit = 5 } = {}) {
    return this.#db.prepare(`
      SELECT * FROM media
      WHERE name LIKE ? ESCAPE '\\'
      ORDER BY is_favorite DESC, created_at DESC
      LIMIT ?
    `).all(`%${escapeLike(query)}%`, limit)
  }

  register({ name, path, type, mime_type = null, size_bytes = null, thumbnail = null }) {
    // Si ya existe el path, actualiza el nombre y retorna
    const existing = this.#db
      .prepare('SELECT * FROM media WHERE path = ?')
      .get(path)

    if (existing) return existing

    const result = this.#db
      .prepare(`
        INSERT INTO media (name, path, type, mime_type, size_bytes, thumbnail)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(name, path, type, mime_type, size_bytes, thumbnail)

    return this.findById(result.lastInsertRowid)
  }

  update(id, { name, thumbnail, is_favorite }) {
    const fields = []; const params = []
    if (name        !== undefined) { fields.push('name = ?');        params.push(name) }
    if (thumbnail   !== undefined) { fields.push('thumbnail = ?');   params.push(thumbnail) }
    if (is_favorite !== undefined) { fields.push('is_favorite = ?'); params.push(is_favorite ? 1 : 0) }
    if (!fields.length) return this.findById(id)
    fields.push("updated_at = datetime('now')")
    params.push(id)
    this.#db.prepare(`UPDATE media SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return this.findById(id)
  }

  toggleFavorite(id) {
    this.#db.prepare(`
      UPDATE media
      SET is_favorite = CASE WHEN is_favorite=1 THEN 0 ELSE 1 END,
          updated_at  = datetime('now')
      WHERE id = ?
    `).run(id)
    return this.findById(id)
  }

  delete(id) {
    const info = this.#db.prepare('DELETE FROM media WHERE id = ?').run(id)
    return info.changes > 0
  }
}
