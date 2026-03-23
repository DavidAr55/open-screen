#!/usr/bin/env node
/**
 * create-osb-module.mjs
 *
 * Genera un archivo .osb (Open Screen Bible) a partir de un archivo JSON fuente.
 *
 * Uso:
 *   node scripts/create-osb-module.mjs --source bibles-src/rv1909.json --out bibles/rv1909.osb
 *
 * Formato del JSON fuente esperado:
 * {
 *   "meta": {
 *     "id": "rv1909",
 *     "name": "Reina Valera 1909",
 *     "abbreviation": "RV1909",
 *     "language": "es",
 *     "year": "1909",
 *     "license": "public-domain",
 *     "description": "..."
 *   },
 *   "books": [
 *     {
 *       "id": 1,
 *       "name": "Génesis",
 *       "abbrev": "Gén",
 *       "testament": "OT",
 *       "chapters": [
 *         {
 *           "chapter": 1,
 *           "verses": [
 *             { "verse": 1, "text": "En el principio creó Dios..." },
 *             ...
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */

import Database from 'better-sqlite3'
import { readFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath }    from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const getArg = (flag) => {
  const i = args.indexOf(flag)
  return i !== -1 ? args[i + 1] : null
}

const sourcePath = getArg('--source')
const outPath    = getArg('--out')

if (!sourcePath || !outPath) {
  console.error('Uso: node scripts/create-osb-module.mjs --source <archivo.json> --out <archivo.osb>')
  process.exit(1)
}

// ── Leer JSON fuente ──────────────────────────────────────────────────────────
console.log(`📖 Leyendo: ${sourcePath}`)
const source = JSON.parse(readFileSync(resolve(sourcePath), 'utf8'))

const { meta, books } = source
if (!meta?.id || !meta?.name || !books?.length) {
  console.error('❌ JSON inválido: se requieren los campos meta.id, meta.name y books[]')
  process.exit(1)
}

// ── Crear directorio de salida si no existe ────────────────────────────────────
const outDir = dirname(resolve(outPath))
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

// ── Crear el .osb ─────────────────────────────────────────────────────────────
console.log(`🔨 Creando: ${outPath}`)
const db = new Database(outPath)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS meta (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS books (
    id        INTEGER PRIMARY KEY,
    name      TEXT NOT NULL,
    abbrev    TEXT NOT NULL,
    testament TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verses (
    id      INTEGER PRIMARY KEY,
    book    INTEGER NOT NULL REFERENCES books(id),
    chapter INTEGER NOT NULL,
    verse   INTEGER NOT NULL,
    text    TEXT    NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_verses_lookup ON verses(book, chapter, verse);
  CREATE INDEX IF NOT EXISTS idx_verses_text   ON verses(text);
`)

// ── Insertar meta ──────────────────────────────────────────────────────────────
const insertMeta = db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)')
const metaEntries = {
  ...meta,
  os_version: '1',
  created_at: new Date().toISOString(),
}
const insertManyMeta = db.transaction(() => {
  for (const [key, value] of Object.entries(metaEntries)) {
    insertMeta.run(key, String(value))
  }
})
insertManyMeta()

// ── Insertar libros y versículos ───────────────────────────────────────────────
const insertBook  = db.prepare('INSERT OR REPLACE INTO books (id, name, abbrev, testament) VALUES (?, ?, ?, ?)')
const insertVerse = db.prepare('INSERT OR REPLACE INTO verses (id, book, chapter, verse, text) VALUES (?, ?, ?, ?, ?)')

let totalVerses = 0

const insertAll = db.transaction(() => {
  for (const book of books) {
    insertBook.run(book.id, book.name, book.abbrev, book.testament)

    for (const chapterData of book.chapters) {
      const ch = chapterData.chapter

      for (const verseData of chapterData.verses) {
        const v = verseData.verse

        // Generar ID estilo scrollmapper: BBCCCVVV
        const verseId = (book.id * 1_000_000) + (ch * 1_000) + v

        insertVerse.run(verseId, book.id, ch, v, verseData.text)
        totalVerses++
      }
    }
  }
})

insertAll()

// ── Verificar ────────────────────────────────────────────────────────────────
const count = db.prepare('SELECT COUNT(*) as n FROM verses').get().n
db.close()

console.log(`\n✅ Módulo creado exitosamente`)
console.log(`   ID:       ${meta.id}`)
console.log(`   Nombre:   ${meta.name}`)
console.log(`   Libros:   ${books.length}`)
console.log(`   Versículos: ${count.toLocaleString()}`)
console.log(`   Archivo:  ${outPath}`)
