import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { SEARCH_TYPES } from '@shared/constants/searchTypes.js'
import { normalizeText } from '@shared/utils/normalize.js'
import { cn } from '@shared/utils/cn.js'

// ─── Iconos ───────────────────────────────────────────────────────────────────
const SearchIcon  = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const ProjectIcon = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>

/**
 * Divide `text` en fragmentos marcando las coincidencias de `query`
 * con comparación normalizada (sin mayúsculas ni tildes). Mapea los
 * índices normalizados de vuelta al texto original para no perder tildes.
 */
function highlightParts(text, query) {
  const nq = normalizeText(String(query ?? '').trim())
  if (!nq || !text) return [{ text: String(text ?? ''), mark: false }]

  const chars = [...String(text)]
  let norm = ''
  const map = [] // índice en norm → índice en chars
  chars.forEach((ch, i) => {
    const n = normalizeText(ch)
    for (let k = 0; k < n.length; k++) { map.push(i); norm += n[k] }
  })

  const parts = []
  let cursor = 0
  let from = 0
  while (true) {
    const hit = norm.indexOf(nq, from)
    if (hit === -1) break
    const start = map[hit]
    const end   = map[hit + nq.length - 1] + 1
    if (start > cursor) parts.push({ text: chars.slice(cursor, start).join(''), mark: false })
    parts.push({ text: chars.slice(start, end).join(''), mark: true })
    cursor = end
    from = hit + nq.length
  }
  if (cursor < chars.length) parts.push({ text: chars.slice(cursor).join(''), mark: false })
  return parts.length ? parts : [{ text: String(text), mark: false }]
}

function Highlight({ text, query }) {
  return (
    <>
      {highlightParts(text, query).map((p, i) =>
        p.mark ? (
          <mark key={i} className="bg-brand-100 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded px-0.5 -mx-0.5 font-bold">
            {p.text}
          </mark>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </>
  )
}

// Tipos cuyo payload trae texto proyectable directamente
const PROJECTABLE = new Set(['verse', 'verseRef', 'library'])

/**
 * Buscador global de la Topbar: typeahead sobre Escrituras, canciones,
 * presentaciones, multimedia y biblioteca vía el canal IPC 'search:global'.
 * Ctrl+K enfoca, ↑/↓ navegan (con wrap), Enter abre, Esc cierra.
 */
export function GlobalSearch() {
  const { navigateTo, project } = useApp()

  const [q,           setQ]           = useState('')
  const [groups,      setGroups]      = useState([])
  const [open,        setOpen]        = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading,     setLoading]     = useState(false)

  const rootRef  = useRef(null)
  const inputRef = useRef(null)
  const listRef  = useRef(null)
  const timerRef = useRef(null)
  const qRef     = useRef(q)
  qRef.current = q

  // Lista plana para navegación con teclado; cada ítem lleva su tipo
  const flatItems = useMemo(
    () => groups.flatMap(g => g.items.map(it => ({ ...it, _type: g.type }))),
    [groups],
  )

  // Offset del índice plano en el que empieza cada grupo
  const offsets = useMemo(() => {
    const o = []
    let acc = 0
    for (const g of groups) { o.push(acc); acc += g.items.length }
    return o
  }, [groups])

  // ── Búsqueda con debounce (200ms, mínimo 2 caracteres) ────────────────────
  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) {
      setGroups([]); setOpen(false); setLoading(false)
      return
    }
    setLoading(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      try {
        const res = await window.api?.search.global(term, { limit: 5 })
        // Descartar respuestas obsoletas: el eco `query` debe coincidir
        // con lo que hay ahora mismo en el input
        if (!res || res.query !== qRef.current.trim()) return
        setGroups(res.groups ?? [])
        setActiveIndex(0)
        setOpen(true)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(timerRef.current)
  }, [q])

  // ── Atajo global Ctrl+K → enfocar el input ─────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // ── Cierre por clic fuera (mismo patrón que los ContextMenu) ───────────────
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 50)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle) }
  }, [open])

  // Mantener visible el ítem activo al navegar con teclado
  useEffect(() => {
    if (!open) return
    listRef.current?.querySelector(`[data-idx="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open])

  // ── Selección → deep-link a la página del tipo ─────────────────────────────
  const select = useCallback((item) => {
    const meta = SEARCH_TYPES[item._type]
    if (!meta) return
    navigateTo(meta.page, { type: item._type, payload: item.payload })
    setOpen(false)
    setQ('')
    inputRef.current?.blur()
  }, [navigateTo])

  // Acción secundaria: proyectar directo sin navegar (versículos y biblioteca)
  const projectItem = useCallback((e, item) => {
    e.stopPropagation()
    const text = item._type === 'library'
      ? item.payload.content
      : `${item.payload.text}\n\n— ${item.title}`
    if (text) project(text)
    setOpen(false)
  }, [project])

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
      return
    }
    if (!open || flatItems.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => (i + 1) % flatItems.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => (i - 1 + flatItems.length) % flatItems.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = flatItems[activeIndex]
      if (item) select(item)
    }
  }

  // Posición del popover, fijo bajo el input
  const rect = rootRef.current?.getBoundingClientRect()
  const popStyle = rect
    ? {
        position: 'fixed',
        top:   rect.bottom + 6,
        left:  rect.left,
        width: rect.width,
        zIndex: 9999,
      }
    : { display: 'none' }

  return (
    <div ref={rootRef} className="relative flex-1 min-w-0 max-w-2xl">
      {/* Input con lupa y hint Ctrl+K */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => { if (q.trim().length >= 2 && groups.length) setOpen(true) }}
          placeholder="Buscar en todo…"
          className={cn(
            'w-full transition-all duration-200',
            'pl-8 pr-14 py-1.5 rounded-xl text-[13px]',
            'bg-surface-soft dark:bg-dark-card',
            'border border-surface-muted dark:border-dark-border',
            'text-slate-700 dark:text-slate-200 placeholder:text-slate-400',
            'focus:outline-none focus:border-brand-300 dark:focus:border-brand-700',
          )}
        />
        <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none font-mono text-[9px] font-bold px-1.5 py-0.5 rounded border border-surface-muted dark:border-dark-border text-slate-400 dark:text-slate-500 select-none">
          Ctrl+K
        </kbd>
      </div>

      {/* Popover de resultados */}
      {open && (
        <div
          style={popStyle}
          className="rounded-xl bg-white dark:bg-dark-surface border border-surface-muted dark:border-dark-border shadow-card-md overflow-hidden"
        >
          <div ref={listRef} className="max-h-[420px] overflow-y-auto py-1">
            {flatItems.length === 0 ? (
              <p className="px-4 py-5 text-center text-[12px] text-slate-400">
                {loading ? 'Buscando…' : 'Sin resultados'}
              </p>
            ) : groups.map((group, gi) => {
              const meta = SEARCH_TYPES[group.type]
              if (!meta) return null
              return (
                <div key={group.type}>
                  {/* Header del grupo: dot de color + label */}
                  <div className="flex items-center gap-1.5 px-3 pt-2 pb-1">
                    <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', meta.dot)} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {meta.label}
                    </span>
                  </div>

                  {group.items.map((item, ii) => {
                    const idx = offsets[gi] + ii
                    const isActive = idx === activeIndex
                    const withType = { ...item, _type: group.type }
                    return (
                      <div
                        key={`${group.type}-${item.id}`}
                        data-idx={idx}
                        onClick={() => select(withType)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          'group flex items-start gap-2 mx-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                          isActive
                            ? 'bg-brand-50 dark:bg-brand-950/30'
                            : 'hover:bg-surface-soft dark:hover:bg-dark-card',
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[12.5px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                              <Highlight text={item.title} query={q} />
                            </p>
                            {item.subtitle && (
                              <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0', meta.badge)}>
                                {item.subtitle}
                              </span>
                            )}
                          </div>
                          {item.snippet && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                              <Highlight text={item.snippet} query={q} />
                            </p>
                          )}
                        </div>

                        {/* Acción secundaria: proyectar sin navegar */}
                        {PROJECTABLE.has(group.type) && (
                          <button
                            onClick={(e) => projectItem(e, withType)}
                            title="Proyectar ahora"
                            className={cn(
                              'flex items-center gap-1 flex-shrink-0 mt-0.5 px-1.5 py-1 rounded-md text-[10px] font-semibold transition-all',
                              'text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-950/50',
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                            )}
                          >
                            <ProjectIcon /> Proyectar
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Pie con ayuda de teclado */}
          {flatItems.length > 0 && (
            <div className="flex items-center gap-3 px-3 py-1.5 border-t border-surface-muted dark:border-dark-border text-[10px] text-slate-400 dark:text-slate-600 select-none">
              <span><kbd className="font-mono font-bold">↑↓</kbd> navegar</span>
              <span><kbd className="font-mono font-bold">Enter</kbd> abrir</span>
              <span><kbd className="font-mono font-bold">Esc</kbd> cerrar</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
