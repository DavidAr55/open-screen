/**
 * SettingsRepository
 * Maneja la tabla `settings` — pares clave/valor para configuración global.
 */
export class SettingsRepository {
  #db

  constructor(db) {
    this.#db = db
  }

  /** Obtiene el valor de una clave. Retorna defaultValue si no existe. */
  get(key, defaultValue = null) {
    const row = this.#db
      .prepare('SELECT value FROM settings WHERE key = ?')
      .get(key)
    return row ? row.value : defaultValue
  }

  /** Establece (o actualiza) el valor de una clave. */
  set(key, value) {
    this.#db
      .prepare(`
        INSERT INTO settings (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value      = excluded.value,
          updated_at = excluded.updated_at
      `)
      .run(key, String(value))
    return { key, value }
  }

  /** Retorna todas las settings como objeto plano { key: value }. */
  getAll() {
    const rows = this.#db.prepare('SELECT key, value FROM settings').all()
    return Object.fromEntries(rows.map(r => [r.key, r.value]))
  }

  /** Actualiza múltiples settings en una sola transacción. */
  setMany(entries) {
    const setOne = this.#db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        value      = excluded.value,
        updated_at = excluded.updated_at
    `)

    const tx = this.#db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        setOne.run(key, String(value))
      }
    })

    tx(entries)
    return this.getAll()
  }
}
