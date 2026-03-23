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
      ? 'SELECT * FROM media WHERE type = ? ORDER BY created_at DESC'
      : 'SELECT * FROM media ORDER BY created_at DESC'
    return type
      ? this.#db.prepare(query).all(type)
      : this.#db.prepare(query).all()
  }

  findById(id) {
    return this.#db.prepare('SELECT * FROM media WHERE id = ?').get(id) ?? null
  }

  register({ name, path, type, mime_type = null, size_bytes = null }) {
    // Si ya existe el path, actualiza el nombre y retorna
    const existing = this.#db
      .prepare('SELECT * FROM media WHERE path = ?')
      .get(path)

    if (existing) return existing

    const result = this.#db
      .prepare(`
        INSERT INTO media (name, path, type, mime_type, size_bytes)
        VALUES (?, ?, ?, ?, ?)
      `)
      .run(name, path, type, mime_type, size_bytes)

    return this.findById(result.lastInsertRowid)
  }

  delete(id) {
    const info = this.#db.prepare('DELETE FROM media WHERE id = ?').run(id)
    return info.changes > 0
  }
}
