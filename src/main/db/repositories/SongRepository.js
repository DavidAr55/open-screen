/**
 * SongRepository
 *
 * CRUD para canciones con sus secciones (estrofas, coros, etc).
 * Cada canción tiene metadatos + N secciones ordenadas (song_sections).
 */
export class SongRepository {
  #db

  constructor(db) {
    this.#db = db
  }

  // ── Lectura ───────────────────────────────────────────────────────────────

  findAll({ search = null, artist = null, favorite = null, limit = 100, offset = 0 } = {}) {
    let q = 'SELECT * FROM songs WHERE 1=1'
    const params = []

    if (search) {
      q += ' AND (title LIKE ? OR artist LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }
    if (artist) {
      q += ' AND artist = ?'
      params.push(artist)
    }
    if (favorite === true) {
      q += ' AND is_favorite = 1'
    }

    q += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
    params.push(limit, offset)

    return this.#db.prepare(q).all(...params).map(this.#parse)
  }

  findById(id) {
    const song = this.#db.prepare('SELECT * FROM songs WHERE id = ?').get(id)
    if (!song) return null

    const sections = this.#db
      .prepare('SELECT * FROM song_sections WHERE song_id = ? ORDER BY order_index ASC')
      .all(id)

    return { ...this.#parse(song), sections }
  }

  getArtists() {
    return this.#db
      .prepare("SELECT DISTINCT artist FROM songs WHERE artist != '' ORDER BY artist")
      .all()
      .map(r => r.artist)
  }

  count() {
    return this.#db.prepare('SELECT COUNT(*) as n FROM songs').get().n
  }

  // ── Escritura ─────────────────────────────────────────────────────────────

  create({ title, artist = '', key_sig = '', tempo = null, copyright = '', tags = [], sections = [] }) {
    const result = this.#db
      .prepare(`INSERT INTO songs (title, artist, key_sig, tempo, copyright, tags)
                VALUES (?, ?, ?, ?, ?, ?)`)
      .run(title, artist, key_sig, tempo, copyright, JSON.stringify(tags))

    const songId = result.lastInsertRowid
    this.#saveSections(songId, sections)
    return this.findById(songId)
  }

  update(id, { title, artist, key_sig, tempo, copyright, tags, is_favorite, sections }) {
    const fields = []
    const params = []

    if (title       !== undefined) { fields.push('title = ?');       params.push(title) }
    if (artist      !== undefined) { fields.push('artist = ?');      params.push(artist) }
    if (key_sig     !== undefined) { fields.push('key_sig = ?');     params.push(key_sig) }
    if (tempo       !== undefined) { fields.push('tempo = ?');       params.push(tempo) }
    if (copyright   !== undefined) { fields.push('copyright = ?');   params.push(copyright) }
    if (tags        !== undefined) { fields.push('tags = ?');        params.push(JSON.stringify(tags)) }
    if (is_favorite !== undefined) { fields.push('is_favorite = ?'); params.push(is_favorite ? 1 : 0) }

    if (fields.length > 0) {
      fields.push("updated_at = datetime('now')")
      params.push(id)
      this.#db.prepare(`UPDATE songs SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    }

    if (sections !== undefined) {
      this.#saveSections(id, sections)
    }

    return this.findById(id)
  }

  toggleFavorite(id) {
    this.#db.prepare("UPDATE songs SET is_favorite = CASE WHEN is_favorite=1 THEN 0 ELSE 1 END, updated_at = datetime('now') WHERE id = ?").run(id)
    return this.findById(id)
  }

  delete(id) {
    return this.#db.prepare('DELETE FROM songs WHERE id = ?').run(id).changes > 0
  }

  // ── Secciones ─────────────────────────────────────────────────────────────

  #saveSections(songId, sections) {
    // Reemplazar todas las secciones de esta canción
    const deleteSections = this.#db.prepare('DELETE FROM song_sections WHERE song_id = ?')
    const insertSection  = this.#db.prepare(
      'INSERT INTO song_sections (song_id, type, label, lyrics, order_index) VALUES (?, ?, ?, ?, ?)'
    )

    this.#db.transaction(() => {
      deleteSections.run(songId)
      sections.forEach((s, i) => {
        insertSection.run(songId, s.type ?? 'verse', s.label ?? '', s.lyrics ?? '', i)
      })
    })()
  }

  // ── Parse ─────────────────────────────────────────────────────────────────

  #parse(row) {
    return {
      ...row,
      is_favorite: row.is_favorite === 1,
      tags: (() => { try { return JSON.parse(row.tags) } catch { return [] } })(),
    }
  }
}