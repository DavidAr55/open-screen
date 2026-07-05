/**
 * Parser de referencias bíblicas para el buscador global.
 *
 * Reconoce entradas como "Juan 3:16", "jn 3 16", "salmos 23", "1 co 13 4"
 * y las resuelve contra los libros del módulo instalado (getBooks).
 */

/** Normaliza para comparar: minúsculas + sin diacríticos (NFD). */
export function normalize(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

// Alias españoles comunes → nombre canónico normalizado del libro.
// Se comparan ya sin espacios ("1 co" → "1co").
const BOOK_ALIASES = {
  gn: 'genesis', gen: 'genesis',
  ex: 'exodo', exo: 'exodo',
  lv: 'levitico', lev: 'levitico',
  nm: 'numeros', num: 'numeros',
  dt: 'deuteronomio', deut: 'deuteronomio',
  jos: 'josue',
  jue: 'jueces',
  rt: 'rut',
  '1s': '1 samuel', '1sa': '1 samuel', '1sam': '1 samuel',
  '2s': '2 samuel', '2sa': '2 samuel', '2sam': '2 samuel',
  '1r': '1 reyes', '1re': '1 reyes',
  '2r': '2 reyes', '2re': '2 reyes',
  '1cr': '1 cronicas',
  '2cr': '2 cronicas',
  esd: 'esdras',
  neh: 'nehemias',
  est: 'ester',
  sal: 'salmos', salmo: 'salmos',
  pr: 'proverbios', prov: 'proverbios',
  ecl: 'eclesiastes',
  cnt: 'cantares',
  is: 'isaias', isa: 'isaias',
  jer: 'jeremias',
  lam: 'lamentaciones',
  ez: 'ezequiel', eze: 'ezequiel',
  dn: 'daniel', dan: 'daniel',
  os: 'oseas',
  jl: 'joel',
  am: 'amos',
  abd: 'abdias',
  jon: 'jonas',
  miq: 'miqueas', mi: 'miqueas',
  nah: 'nahum',
  hab: 'habacuc',
  sof: 'sofonias',
  hag: 'hageo',
  zac: 'zacarias',
  mal: 'malaquias',
  mt: 'mateo', mat: 'mateo',
  mr: 'marcos', mc: 'marcos',
  lc: 'lucas', luc: 'lucas',
  jn: 'juan',
  hch: 'hechos', hech: 'hechos',
  rm: 'romanos', ro: 'romanos', rom: 'romanos',
  '1co': '1 corintios', '1cor': '1 corintios',
  '2co': '2 corintios', '2cor': '2 corintios',
  gl: 'galatas', gal: 'galatas',
  ef: 'efesios',
  fil: 'filipenses', flp: 'filipenses',
  col: 'colosenses',
  '1ts': '1 tesalonicenses', '1tes': '1 tesalonicenses',
  '2ts': '2 tesalonicenses', '2tes': '2 tesalonicenses',
  '1ti': '1 timoteo', '1tim': '1 timoteo',
  '2ti': '2 timoteo', '2tim': '2 timoteo',
  tit: 'tito',
  flm: 'filemon',
  heb: 'hebreos',
  stg: 'santiago', sant: 'santiago',
  '1p': '1 pedro', '1pe': '1 pedro',
  '2p': '2 pedro', '2pe': '2 pedro',
  '1jn': '1 juan',
  '2jn': '2 juan',
  '3jn': '3 juan',
  jud: 'judas',
  ap: 'apocalipsis', apoc: 'apocalipsis',
}

/**
 * Intenta interpretar el query como referencia bíblica.
 * Retorna { bookText, chapter, verse, verseEnd } o null si no matchea.
 *
 * Formatos aceptados (tras normalizar):
 *   "juan 3"        → capítulo completo
 *   "juan 3:16"     → versículo
 *   "jn 3 16"       → separador con espacio
 *   "juan 3:16-18"  → rango de versículos
 *   "1 co 13 4"     → libro con número inicial
 */
export function parseReference(q) {
  const norm = normalize(q)
  // Libro (opcionalmente precedido por 1/2/3) + capítulo + verso(-rango) opcional
  const m = norm.match(/^([123]?\s?[a-z]+)\s+(\d{1,3})(?:[:\s]\s*(\d{1,3})(?:\s*-\s*(\d{1,3}))?)?$/)
  if (!m) return null
  return {
    bookText: m[1].trim(),
    chapter:  Number(m[2]),
    verse:    m[3] ? Number(m[3]) : null,
    verseEnd: m[4] ? Number(m[4]) : null,
  }
}

/**
 * Resuelve bookText contra la lista de libros del módulo (getBooks).
 * 1) Alias español exacto → prefijo sobre nombres normalizados.
 * 2) Prefijo directo sobre name/abbrev de los libros.
 * Retorna el libro encontrado o null.
 */
export function matchBook(bookText, books) {
  if (!bookText || !Array.isArray(books) || books.length === 0) return null

  const compact  = normalize(bookText).replace(/\s+/g, '')
  const canonical = BOOK_ALIASES[compact] ?? null
  // Objetivo de comparación: el nombre canónico del alias, o el texto tal cual
  const target = normalize(canonical ?? bookText)
  const targetCompact = target.replace(/\s+/g, '')

  // Prefijo sobre nombre completo o abreviatura (ambos sin espacios para
  // tolerar "1co" vs "1 corintios")
  for (const book of books) {
    const name   = normalize(book.name).replace(/\s+/g, '')
    const abbrev = normalize(book.abbrev ?? book.short_name ?? '').replace(/\s+/g, '')
    if (name.startsWith(targetCompact) || (abbrev && abbrev.startsWith(targetCompact))) {
      return book
    }
  }
  return null
}
