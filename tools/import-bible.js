#!/usr/bin/env node
/**
 * Open Screen — CLI de importación OSBF
 *
 * Uso:
 *   node tools/import-bible.js validate <archivo.osbf.json>
 *   node tools/import-bible.js import   <archivo.osbf.json>
 *   node tools/import-bible.js info     <archivo.osbf.json>
 *
 * Nota: este script corre en Node.js puro (fuera de Electron).
 * La DB se importa directamente con better-sqlite3.
 */

import { readFileSync }   from 'fs'
import { resolve, join }  from 'path'
import { homedir }        from 'os'
import Database           from 'better-sqlite3'

// ── Helpers de consola ──────────────────────────────────────────────
const ok    = (msg) => console.log(`  ✅  ${msg}`)
const warn  = (msg) => console.log(`  ⚠️   ${msg}`)
const err   = (msg) => console.error(`  ❌  ${msg}`)
const info  = (msg) => console.log(`  ℹ️   ${msg}`)
const title = (msg) => console.log(`\n${'─'.repeat(50)}\n  ${msg}\n${'─'.repeat(50)}`)

// ── Ruta de la DB (igual que Electron en producción) ───────────────
function getDbPath() {
  const platform = process.platform
  if (platform === 'win32')  return join(homedir(), 'AppData', 'Roaming', 'open-screen', 'open-screen.db')
  if (platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'open-screen', 'open-screen.db')
  return join(homedir(), '.config', 'open-screen', 'open-screen.db')
}

// ── Validación OSBF ────────────────────────────────────────────────
function validateOSBF(data) {
  const errors   = []
  const warnings = []

  // Campo osbf
  if (!data.osbf) errors.push('Falta campo raíz "osbf"')

  // Meta
  if (!data.meta) {
    errors.push('Falta objeto "meta"')
  } else {
    const required = ['id', 'name', 'abbreviation', 'language', 'license', 'testament']
    for (const f of required) {
      if (!data.meta[f]) errors.push(`meta.${f} es requerido`)
    }
    if (data.meta.id && !/^[a-z0-9_-]+$/.test(data.meta.id)) {
      errors.push('meta.id debe ser minúsculas, sin espacios (ej: "rv1960")')
    }
    if (!['ltr', 'rtl'].includes(data.meta.direction)) {
      warnings.push('meta.direction no especificado, se asumirá "ltr"')
    }
  }

  // Books
  if (!data.books || !Array.isArray(data.books)) {
    errors.push('Falta array "books"')
  } else {
    if (data.books.length === 0) errors.push('"books" está vacío')

    let totalVerses = 0
    for (const book of data.books) {
      if (!book.id)   errors.push(`Un libro no tiene "id"`)
      if (!book.usfm) errors.push(`Libro ${book.id ?? '?'} no tiene "usfm"`)
      if (!book.name) errors.push(`Libro ${book.id ?? '?'} no tiene "name"`)

      if (book.id < 1 || book.id > 66) {
        warnings.push(`Libro id=${book.id} está fuera del rango canónico 1–66`)
      }

      for (const chapter of book.chapters ?? []) {
        if (!chapter.number) errors.push(`Capítulo sin "number" en libro ${book.id}`)
        for (const verse of chapter.verses ?? []) {
          if (!verse.number) errors.push(`Versículo sin "number" en ${book.usfm} ${chapter.number}`)
          if (!verse.text)   errors.push(`Versículo sin "text" en ${book.usfm} ${chapter.number}:${verse.number}`)
          totalVerses++
        }
      }
    }

    if (totalVerses === 0) errors.push('No se encontraron versículos en el archivo')
    info(`Versículos encontrados: ${totalVerses.toLocaleString()}`)
    info(`Libros encontrados: ${data.books.length}`)
  }

  return { errors, warnings }
}

// ── Comandos ───────────────────────────────────────────────────────
const [,, command, filePath] = process.argv

if (!command || !filePath) {
  console.log(`
Open Screen — CLI de importación OSBF

Uso:
  node tools/import-bible.js validate <archivo.osbf.json>
  node tools/import-bible.js import   <archivo.osbf.json>
  node tools/import-bible.js info     <archivo.osbf.json>
`)
  process.exit(0)
}

const absPath = resolve(filePath)
let data

try {
  const raw = readFileSync(absPath, 'utf-8')
  data = JSON.parse(raw)
} catch (e) {
  err(`No se pudo leer el archivo: ${e.message}`)
  process.exit(1)
}

// ── Comando: info ──────────────────────────────────────────────────
if (command === 'info') {
  title('Información del archivo OSBF')
  if (data.meta) {
    info(`ID:           ${data.meta.id ?? '—'}`)
    info(`Nombre:       ${data.meta.name ?? '—'}`)
    info(`Abreviatura:  ${data.meta.abbreviation ?? '—'}`)
    info(`Idioma:       ${data.meta.language ?? '—'}`)
    info(`Licencia:     ${data.meta.license ?? '—'}`)
    info(`Copyright:    ${data.meta.copyright ?? '—'}`)
    info(`Año:          ${data.meta.year ?? '—'}`)
    info(`OSBF versión: ${data.osbf ?? '—'}`)
    info(`Libros:       ${data.books?.length ?? 0}`)
  }
  process.exit(0)
}

// ── Comando: validate ──────────────────────────────────────────────
if (command === 'validate') {
  title(`Validando: ${filePath}`)
  const { errors, warnings } = validateOSBF(data)

  for (const w of warnings) warn(w)
  for (const e of errors)   err(e)

  if (errors.length === 0) {
    ok('Archivo OSBF válido — listo para importar')
    process.exit(0)
  } else {
    err(`${errors.length} error(es) encontrado(s)`)
    process.exit(1)
  }
}

// ── Comando: import ────────────────────────────────────────────────
if (command === 'import') {
  title(`Importando: ${data.meta?.id ?? filePath}`)

  // Validar primero
  const { errors, warnings } = validateOSBF(data)
  for (const w of warnings) warn(w)
  if (errors.length > 0) {
    for (const e of errors) err(e)
    err('Corrige los errores antes de importar.')
    process.exit(1)
  }

  const dbPath = getDbPath()
  info(`Base de datos: ${dbPath}`)

  let db
  try {
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  } catch (e) {
    err(`No se pudo abrir la base de datos: ${e.message}`)
    err('Asegúrate de que Open Screen haya corrido al menos una vez para crear la DB.')
    process.exit(1)
  }

  // Importar usando la misma lógica que BibleRepository.importOSBF
  const { BibleRepository } = await import('../src/main/db/repositories/BibleRepository.js')
  const repo = new BibleRepository(db)

  try {
    const result = repo.importOSBF(data)
    ok(`Importado: ${result.version.name}`)
    ok(`Total versículos: ${result.imported.toLocaleString()}`)
  } catch (e) {
    err(`Error durante la importación: ${e.message}`)
    process.exit(1)
  } finally {
    db.close()
  }

  process.exit(0)
}

err(`Comando desconocido: "${command}"`)
process.exit(1)
