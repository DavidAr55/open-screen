import { ipcMain } from 'electron'
import { parseReference, matchBook } from '../utils/bibleReference.js'

/**
 * Canal IPC del buscador global — 'search:global'.
 *
 * Único handler que agrega varios dominios en una sola ida IPC:
 * referencia bíblica directa, texto bíblico, canciones (FTS5),
 * presentaciones, multimedia y biblioteca. better-sqlite3 es síncrono,
 * así que todas las consultas juntas toman pocos ms.
 *
 * A diferencia de los demás register*IPC recibe el objeto `repos`
 * completo, porque necesita 6 repositorios a la vez.
 *
 * Respuesta: { query, groups: [{ type, items: [{ id, title, subtitle, snippet, payload }] }] }
 * El eco de `query` permite al renderer descartar respuestas obsoletas.
 */
export function registerSearchIPC(repos) {
  ipcMain.handle('search:global', (_e, query, opts = {}) => {
    const limit = opts.limit ?? 5
    const q = String(query ?? '').trim()
    if (q.length < 2) return { query: q, groups: [] }

    const groups = []

    // ── Biblia: referencia directa + texto libre ─────────────────────────
    // Si no hay módulos instalados (o falla la lectura), se omite el grupo
    // bíblico sin lanzar error.
    try {
      const moduleId = repos.settings.get('default_bible_module', null)
        || repos.bible.listModules()[0]?.id
        || null

      if (moduleId) {
        // 1. Referencia directa ("Juan 3:16", "salmos 23"…) — primer grupo
        const ref = parseReference(q)
        if (ref) {
          const books = repos.bible.getBooks(moduleId)
          const book  = matchBook(ref.bookText, books)
          if (book) {
            const items = []
            if (ref.verse) {
              const v = repos.bible.getVerse(moduleId, book.id, ref.chapter, ref.verse)
              if (v) {
                items.push({
                  id:       v.id,
                  title:    v.reference,
                  subtitle: book.name,
                  snippet:  v.text,
                  payload:  { moduleId, bookId: book.id, chapter: ref.chapter, verse: ref.verse, text: v.text },
                })
              }
            } else {
              // Solo libro + capítulo → abrir el capítulo completo
              const verses = repos.bible.getChapter(moduleId, book.id, ref.chapter)
              if (verses.length) {
                items.push({
                  id:       `${book.id}-${ref.chapter}`,
                  title:    `${book.name} ${ref.chapter}`,
                  subtitle: `${verses.length} versículos`,
                  snippet:  verses[0].text,
                  payload:  { moduleId, bookId: book.id, chapter: ref.chapter, verse: null },
                })
              }
            }
            if (items.length) groups.push({ type: 'verseRef', items })
          }
        }

        // 2. Texto libre en versículos
        const { results } = repos.bible.search(moduleId, q, { limit })
        if (results.length) {
          groups.push({
            type: 'verse',
            items: results.map(v => ({
              id:       v.id,
              title:    v.reference,
              subtitle: v.bookName,
              snippet:  v.text,
              payload:  { moduleId, bookId: v.book, chapter: v.chapter, verse: v.verse, text: v.text },
            })),
          })
        }
      }
    } catch (e) {
      console.warn('[Search] Grupo bíblico omitido:', e.message)
    }

    // ── Canciones (FTS5: título, artista y letra) ────────────────────────
    const songs = repos.songs.searchGlobal(q, { limit })
    if (songs.length) {
      groups.push({
        type: 'song',
        items: songs.map(s => ({
          id:       s.id,
          title:    s.title,
          subtitle: s.artist || '',
          snippet:  s.snippet || '',
          payload:  { songId: s.id },
        })),
      })
    }

    // ── Presentaciones (PDF) ─────────────────────────────────────────────
    const pres = repos.presentations.searchByName(q, { limit })
    if (pres.length) {
      groups.push({
        type: 'presentation',
        items: pres.map(p => ({
          id:       p.id,
          title:    p.name,
          subtitle: p.page_count ? `${p.page_count} slides` : '',
          snippet:  '',
          payload:  { presId: p.id },
        })),
      })
    }

    // ── Multimedia ───────────────────────────────────────────────────────
    const media = repos.media.searchByName(q, { limit })
    if (media.length) {
      groups.push({
        type: 'media',
        items: media.map(m => ({
          id:       m.id,
          title:    m.name,
          subtitle: m.type,
          snippet:  '',
          payload:  { mediaId: m.id, mediaType: m.type },
        })),
      })
    }

    // ── Biblioteca ───────────────────────────────────────────────────────
    const lib = repos.library.findAll({ search: q, limit })
    if (lib.length) {
      groups.push({
        type: 'library',
        items: lib.map(i => ({
          id:       i.id,
          title:    i.title,
          subtitle: i.type,
          snippet:  (i.content ?? '').replace(/\n/g, ' ').slice(0, 80),
          payload:  { itemId: i.id, content: i.content },
        })),
      })
    }

    return { query: q, groups }
  })
}
