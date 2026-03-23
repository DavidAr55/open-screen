#!/usr/bin/env node
/**
 * import-ebible-vpl.mjs
 *
 * Convierte spaRV1909_vpl.txt → rv1909.sql
 * Luego aplicas el SQL con: sqlite3 rv1909.osb < rv1909.sql
 *
 * Sin dependencias nativas — solo Node.js puro.
 *
 * Uso:
 *   node scripts/import-ebible-vpl.mjs --input spaRV1909_vpl.txt
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath }    from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Args ──────────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2)
const getArg   = flag => { const i = args.indexOf(flag); return i !== -1 ? args[i+1] : null }
const inputPath = getArg('--input')
const outSql   = getArg('--out') ?? 'bibles/rv1909.sql'

if (!inputPath) {
  console.error('Uso: node scripts/import-ebible-vpl.mjs --input spaRV1909_vpl.txt [--out bibles/rv1909.sql]')
  process.exit(1)
}

// ── Mapas ─────────────────────────────────────────────────────────────────────
const BOOK_MAP = {
  GEN:1,EXO:2,LEV:3,NUM:4,DEU:5,JOS:6,JDG:7,RUT:8,
  '1SA':9,'2SA':10,'1KI':11,'2KI':12,'1CH':13,'2CH':14,
  EZR:15,NEH:16,EST:17,JOB:18,PSA:19,PRO:20,ECC:21,
  SOL:22,ISA:23,JER:24,LAM:25,EZK:26,DAN:27,HOS:28,
  JOE:29,AMO:30,OBA:31,JON:32,MIC:33,NAH:34,HAB:35,
  ZEP:36,HAG:37,ZEC:38,MAL:39,
  MAT:40,MAR:41,LUK:42,JOH:43,ACT:44,ROM:45,
  '1CO':46,'2CO':47,GAL:48,EPH:49,PHI:50,COL:51,
  '1TH':52,'2TH':53,'1TI':54,'2TI':55,TIT:56,PHM:57,
  HEB:58,JAM:59,'1PE':60,'2PE':61,'1JO':62,'2JO':63,
  '3JO':64,JUD:65,REV:66,
  // aliases alternativos que puede traer eBible
  EZE:26,SOS:22,ZEK:38,ZEC2:38,EZR2:15,
}

const BOOK_NAMES = {
  1:'Génesis',2:'Éxodo',3:'Levítico',4:'Números',5:'Deuteronomio',
  6:'Josué',7:'Jueces',8:'Rut',9:'1 Samuel',10:'2 Samuel',
  11:'1 Reyes',12:'2 Reyes',13:'1 Crónicas',14:'2 Crónicas',
  15:'Esdras',16:'Nehemías',17:'Ester',18:'Job',19:'Salmos',
  20:'Proverbios',21:'Eclesiastés',22:'Cantares',23:'Isaías',
  24:'Jeremías',25:'Lamentaciones',26:'Ezequiel',27:'Daniel',
  28:'Oseas',29:'Joel',30:'Amós',31:'Abdías',32:'Jonás',
  33:'Miqueas',34:'Nahúm',35:'Habacuc',36:'Sofonías',37:'Hageo',
  38:'Zacarías',39:'Malaquías',
  40:'Mateo',41:'Marcos',42:'Lucas',43:'Juan',44:'Hechos',
  45:'Romanos',46:'1 Corintios',47:'2 Corintios',48:'Gálatas',
  49:'Efesios',50:'Filipenses',51:'Colosenses',52:'1 Tesalonicenses',
  53:'2 Tesalonicenses',54:'1 Timoteo',55:'2 Timoteo',56:'Tito',
  57:'Filemón',58:'Hebreos',59:'Santiago',60:'1 Pedro',61:'2 Pedro',
  62:'1 Juan',63:'2 Juan',64:'3 Juan',65:'Judas',66:'Apocalipsis',
}

const BOOK_ABBREV = {
  1:'Gén',2:'Éx',3:'Lev',4:'Núm',5:'Dt',6:'Jos',7:'Jue',8:'Rut',
  9:'1 S',10:'2 S',11:'1 R',12:'2 R',13:'1 Cr',14:'2 Cr',
  15:'Esd',16:'Neh',17:'Est',18:'Job',19:'Sal',20:'Pr',
  21:'Ec',22:'Cnt',23:'Is',24:'Jer',25:'Lam',26:'Ez',27:'Dn',
  28:'Os',29:'Jl',30:'Am',31:'Abd',32:'Jon',33:'Mi',34:'Nah',
  35:'Hab',36:'Sof',37:'Hag',38:'Zac',39:'Mal',
  40:'Mt',41:'Mc',42:'Lc',43:'Jn',44:'Hch',45:'Ro',
  46:'1 Co',47:'2 Co',48:'Gá',49:'Ef',50:'Fil',51:'Col',
  52:'1 Ts',53:'2 Ts',54:'1 Ti',55:'2 Ti',56:'Tit',57:'Flm',
  58:'Heb',59:'Stg',60:'1 P',61:'2 P',62:'1 Jn',63:'2 Jn',
  64:'3 Jn',65:'Jud',66:'Ap',
}

// ── Parsear VPL ───────────────────────────────────────────────────────────────
// El formato VPL puede tener variantes:
//   "GEN 1:1 Texto"          ← estándar
//   "GEN 1:1\tTexto"         ← con tab
//   " GEN 1:1 Texto"         ← con espacios al inicio
//   "1SA 23:29 Texto"        ← libro con número al inicio
const VPL_RE = /^([A-Z0-9]{2,3})\s+(\d+):(\d+)\s+([\s\S]+)$/

console.log(`📖 Leyendo: ${inputPath}`)
const raw     = readFileSync(resolve(inputPath), 'utf8')
const lines   = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

const verses   = []
const skipped  = []
const unknownBooks = new Set()

for (const line of lines) {
  // Saltar líneas que son encabezados o comentarios típicos de VPL
  if (line.startsWith('#') || line.startsWith('//')) continue

  const m = VPL_RE.exec(line)
  if (!m) {
    skipped.push(line.substring(0, 80))
    continue
  }

  const [, bookCode, chapStr, verseStr, text] = m
  const bookId = BOOK_MAP[bookCode]

  if (!bookId) {
    unknownBooks.add(bookCode)
    skipped.push(`Libro desconocido: "${bookCode}" → ${line.substring(0, 60)}`)
    continue
  }

  const ch = parseInt(chapStr)
  const v  = parseInt(verseStr)

  verses.push({
    id:      (bookId * 1_000_000) + (ch * 1_000) + v,
    book:    bookId,
    chapter: ch,
    verse:   v,
    // Escapar comillas simples para SQL
    text:    text.trim().replace(/'/g, "''"),
  })
}

// Ordenar por ID para que el SQL quede limpio
verses.sort((a, b) => a.id - b.id)

console.log(`   ✅ Versículos parseados: ${verses.length.toLocaleString()}`)

if (skipped.length > 0) {
  console.warn(`   ⚠️  Líneas omitidas:      ${skipped.length}`)
  skipped.slice(0, 8).forEach(l => console.warn(`      › ${l}`))
  if (unknownBooks.size > 0) {
    console.warn(`   ⚠️  Libros no reconocidos: ${[...unknownBooks].join(', ')}`)
    console.warn(`      (Añádelos al BOOK_MAP en el script si son deuterocanónicos)`)
  }
}

if (verses.length === 0) {
  console.error('❌ No se encontraron versículos. Verifica el formato del archivo.')
  process.exit(1)
}

// ── Generar SQL ───────────────────────────────────────────────────────────────
const presentBookIds = [...new Set(verses.map(v => v.book))].sort((a, b) => a - b)

const lines_sql = []

lines_sql.push(`-- Open Screen Bible Module — RV1909`)
lines_sql.push(`-- Generado: ${new Date().toISOString()}`)
lines_sql.push(`-- Versículos: ${verses.length.toLocaleString()}`)
lines_sql.push(`-- Fuente: https://ebible.org/details.php?id=spaRV1909`)
lines_sql.push(``)
lines_sql.push(`PRAGMA journal_mode = WAL;`)
lines_sql.push(`PRAGMA foreign_keys = ON;`)
lines_sql.push(``)
lines_sql.push(`-- Schema OSB v1`)
lines_sql.push(`CREATE TABLE IF NOT EXISTS meta (`)
lines_sql.push(`  key TEXT PRIMARY KEY, value TEXT NOT NULL`)
lines_sql.push(`);`)
lines_sql.push(`CREATE TABLE IF NOT EXISTS books (`)
lines_sql.push(`  id INTEGER PRIMARY KEY, name TEXT NOT NULL,`)
lines_sql.push(`  abbrev TEXT NOT NULL, testament TEXT NOT NULL`)
lines_sql.push(`);`)
lines_sql.push(`CREATE TABLE IF NOT EXISTS verses (`)
lines_sql.push(`  id INTEGER PRIMARY KEY,`)
lines_sql.push(`  book INTEGER NOT NULL REFERENCES books(id),`)
lines_sql.push(`  chapter INTEGER NOT NULL, verse INTEGER NOT NULL,`)
lines_sql.push(`  text TEXT NOT NULL`)
lines_sql.push(`);`)
lines_sql.push(`CREATE INDEX IF NOT EXISTS idx_verses_lookup ON verses(book, chapter, verse);`)
lines_sql.push(`CREATE INDEX IF NOT EXISTS idx_verses_text ON verses(text);`)
lines_sql.push(``)

// Meta
lines_sql.push(`-- Metadatos`)
lines_sql.push(`INSERT OR REPLACE INTO meta VALUES`)
const metaRows = [
  ['id',           'rv1909'],
  ['name',         'Reina Valera 1909'],
  ['abbreviation', 'RV1909'],
  ['language',     'es'],
  ['year',         '1909'],
  ['license',      'public-domain'],
  ['description',  'Santa Biblia — Reina Valera 1909. Dominio público.'],
  ['os_version',   '1'],
  ['created_at',   new Date().toISOString()],
  ['source',       'https://ebible.org/details.php?id=spaRV1909'],
].map(([k, v]) => `  ('${k}','${v.replace(/'/g, "''")}')`).join(',\n')
lines_sql.push(metaRows + ';')
lines_sql.push(``)

// Libros
lines_sql.push(`-- Libros`)
lines_sql.push(`INSERT OR REPLACE INTO books VALUES`)
const bookRows = presentBookIds.map(id =>
  `  (${id},'${BOOK_NAMES[id]}','${BOOK_ABBREV[id]}','${id <= 39 ? 'OT' : 'NT'}')`
).join(',\n')
lines_sql.push(bookRows + ';')
lines_sql.push(``)

// Versículos en bloques de 500 para evitar límites de SQLite
lines_sql.push(`-- Versículos (${verses.length.toLocaleString()})`)
const CHUNK = 500
for (let i = 0; i < verses.length; i += CHUNK) {
  const chunk = verses.slice(i, i + CHUNK)
  lines_sql.push(`INSERT OR REPLACE INTO verses VALUES`)
  const rows = chunk.map(v =>
    `  (${v.id},${v.book},${v.chapter},${v.verse},'${v.text}')`
  ).join(',\n')
  lines_sql.push(rows + ';')
}

// ── Escribir el archivo SQL ───────────────────────────────────────────────────
const outDir = dirname(resolve(outSql))
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

writeFileSync(resolve(outSql), lines_sql.join('\n'), 'utf8')

const sizeMB = (lines_sql.join('\n').length / 1024 / 1024).toFixed(2)

console.log(`\n✅ SQL generado: ${outSql}  (${sizeMB} MB)`)
console.log(`\n─────────────────────────────────────────────────────`)
console.log(`Siguiente paso — crear el .osb con sqlite3:`)
console.log(``)
console.log(`  sqlite3 bibles\\rv1909.osb < ${outSql}`)
console.log(``)
console.log(`Si no tienes sqlite3 instalado:`)
console.log(`  winget install sqlite.sqlite   (Windows)`)
console.log(`  brew install sqlite            (macOS)`)
console.log(`  sudo apt install sqlite3       (Linux)`)
console.log(`─────────────────────────────────────────────────────`)
