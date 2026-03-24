import Database from 'better-sqlite3'
import { app }   from 'electron'
import { join }  from 'path'
import { SCHEMA } from './schema.js'

let _db = null

/**
 * Inicializa la conexión SQLite y corre el schema si es primera vez.
 * La base de datos vive en el userData de Electron (nunca en el código).
 *
 * @returns {Database.Database}
 */
export function initDatabase() {
  if (_db) return _db

  const dbPath = join(app.getPath('userData'), 'open-screen.db')

  _db = new Database(dbPath)

  // Mejor rendimiento con WAL mode
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  // Correr migraciones
  runMigrations(_db)

  console.log(`[DB] SQLite conectado: ${dbPath}`)
  return _db
}

export function getDatabase() {
  if (!_db) throw new Error('[DB] Base de datos no inicializada. Llama initDatabase() primero.')
  return _db
}

// ── Migraciones simples basadas en user_version ────────────────────────────
function runMigrations(db) {
  const currentVersion = db.pragma('user_version', { simple: true })

  const migrations = [
    { version: 1, sql: SCHEMA.v1 },
    { version: 2, sql: SCHEMA.v2 },
    { version: 3, sql: SCHEMA.v3 },
    { version: 4, sql: SCHEMA.v4 },
    { version: 5, sql: SCHEMA.v5 },
  ]

  for (const migration of migrations) {
    if (currentVersion < migration.version) {
      if (!migration.sql || typeof migration.sql !== 'string') {
        console.warn(`[DB] Migración v${migration.version} no tiene SQL definido — se omite`)
        db.pragma(`user_version = ${migration.version}`)
        continue
      }
      console.log(`[DB] Corriendo migración v${migration.version}…`)
      try {
        db.exec(migration.sql)
        db.pragma(`user_version = ${migration.version}`)
      } catch (e) {
        console.error(`[DB] Error en migración v${migration.version}:`, e.message)
        throw e
      }
    }
  }
}