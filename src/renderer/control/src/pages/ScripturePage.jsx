import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, Input, Select, SectionLabel, Spinner } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'

// ─── Iconos ───────────────────────────────────────────────────────────────────
const SearchIcon  = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
const BookIcon    = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
const ProjectIcon = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const FolderIcon  = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
const SaveIcon    = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const CopyIcon    = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>

const MODES = [
  { id: 'navigate', label: 'Navegar' },
  { id: 'search',   label: 'Buscar'  },
]

const BG_STYLES = {
  dark:  'radial-gradient(ellipse at 50% 35%, #1c0a0a, #000)',
  red:   'radial-gradient(ellipse at 50% 30%, #4a0808, #1a0000)',
  black: '#000',
}

// ─── Context Menu ─────────────────────────────────────────────────────────────
function ContextMenu({ x, y, verse, onProject, onSave, onCopy, onClose }) {
  const menuRef = useRef(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    // Pequeño delay para no cerrar inmediatamente por el mismo clic derecho
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 50)
    return () => { clearTimeout(timer); document.removeEventListener('mousedown', handler) }
  }, [onClose])

  // Ajustar posición para que no se salga de la pantalla
  const style = {
    position: 'fixed',
    top:  Math.min(y, window.innerHeight - 180),
    left: Math.min(x, window.innerWidth  - 220),
    zIndex: 9999,
  }

  const ITEMS = [
    {
      label: 'Proyectar',
      icon:  <ProjectIcon />,
      color: 'text-brand-600 dark:text-brand-400',
      action: onProject,
    },
    {
      label: 'Guardar en biblioteca',
      icon:  <SaveIcon />,
      action: onSave,
    },
    {
      label: 'Copiar texto',
      icon:  <CopyIcon />,
      action: onCopy,
    },
  ]

  return (
    <div
      ref={menuRef}
      style={style}
      className={cn(
        'w-52 py-1 rounded-xl shadow-card-md',
        'bg-white dark:bg-dark-surface',
        'border border-surface-muted dark:border-dark-border',
      )}
    >
      {/* Referencia del versículo */}
      <div className="px-3 py-2 border-b border-surface-muted dark:border-dark-border">
        <p className="font-mono text-[10px] font-bold text-brand-500">{verse.reference}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{verse.text.substring(0, 50)}…</p>
      </div>

      {/* Opciones */}
      <div className="py-1">
        {ITEMS.map((item) => (
          <button
            key={item.label}
            onClick={() => { item.action(); onClose() }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium',
              'text-slate-700 dark:text-slate-300',
              'hover:bg-surface-soft dark:hover:bg-dark-card',
              'transition-colors text-left',
              item.color,
            )}
          >
            <span className="opacity-60">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Resaltador de texto ──────────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query || !query.trim()) return <>{text}</>

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts   = text.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="bg-amber-300/70 dark:bg-amber-500/40 text-inherit rounded px-0.5 -mx-0.5 font-bold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ─── Componente de versículo con todos los eventos ────────────────────────────
function VerseItem({ verse, isSelected, onSelect, onProject, onSave, searchQuery }) {
  const clickTimer  = useRef(null)
  const [ctx, setCtx] = useState(null)

  const handleClick = (e) => {
    e.preventDefault()
    // Detectar doble clic manualmente para evitar conflicto con single
    if (clickTimer.current) {
      // Doble clic → proyectar directamente
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onProject(verse)
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        onSelect(verse) // Clic simple → seleccionar
      }, 220)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    onSelect(verse)
    setCtx({ x: e.clientX, y: e.clientY })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(`${verse.text} — ${verse.reference}`)
  }

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'px-2.5 py-2 rounded-lg cursor-pointer transition-all select-none',
          isSelected
            ? 'bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-900'
            : 'hover:bg-surface-soft dark:hover:bg-dark-card border border-transparent',
        )}
        title="Clic para seleccionar • Doble clic para proyectar • Clic derecho para más opciones"
      >
        <span className={cn(
          'font-mono text-[10px] font-bold mr-1.5',
          isSelected ? 'text-brand-500' : 'text-slate-400 dark:text-slate-600',
        )}>
          {verse.verse}
        </span>
        <span className="text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">
          <Highlight text={verse.text} query={searchQuery} />
        </span>
      </div>

      {ctx && (
        <ContextMenu
          x={ctx.x}
          y={ctx.y}
          verse={verse}
          onProject={() => onProject(verse)}
          onSave={() => onSave(verse)}
          onCopy={handleCopy}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function ScripturePage() {
  const { project, liveBg, activeBg, createItem, refreshLibrary } = useApp()

  const [mode,     setMode]     = useState('navigate')
  const [modules,  setModules]  = useState([])
  const [moduleId, setModuleId] = useState(null)
  const [loading,  setLoading]  = useState(true)

  // Navegación
  const [books,           setBooks]           = useState([])
  const [selectedBook,    setSelectedBook]    = useState(null)
  const [chapterCount,    setChapterCount]    = useState(0)
  const [selectedChapter, setSelectedChapter] = useState(1)
  const [verses,          setVerses]          = useState([])
  const [selectedVerse,   setSelectedVerse]   = useState(null)

  // Búsqueda
  const [query,         setQuery]         = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching,     setSearching]     = useState(false)
  const [searchTotal,   setSearchTotal]   = useState(0)
  const searchTimer = useRef(null)

  // Feedback de guardado
  const [saveMsg, setSaveMsg] = useState(null) // 'ok' | 'error' | null
  const saveMsgTimer = useRef(null)

  // ── Cargar módulos ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const mods = await window.api?.bible.listModules() ?? []
        setModules(mods)
        if (mods.length > 0) setModuleId(mods[0].id)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  // ── Libros al cambiar módulo ────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleId) return
    window.api?.bible.getBooks(moduleId).then(b => {
      setBooks(b ?? [])
      if (b?.length > 0) { setSelectedBook(b[0]); setSelectedChapter(1) }
    })
  }, [moduleId])

  // ── Chapter count al cambiar libro ─────────────────────────────────────────
  useEffect(() => {
    if (!moduleId || !selectedBook) return
    window.api?.bible.getChapterCount(moduleId, selectedBook.id).then(n => setChapterCount(n))
  }, [moduleId, selectedBook])

  // ── Versículos al cambiar libro/capítulo ───────────────────────────────────
  useEffect(() => {
    if (!moduleId || !selectedBook) return
    window.api?.bible.getChapter(moduleId, selectedBook.id, selectedChapter).then(vs => {
      setVerses(vs ?? [])
      setSelectedVerse(vs?.[0] ?? null)
    })
  }, [moduleId, selectedBook, selectedChapter])

  // ── Búsqueda con debounce ──────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleId || !query.trim()) { setSearchResults([]); setSearchTotal(0); return }
    clearTimeout(searchTimer.current)
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const r = await window.api?.bible.search(moduleId, query.trim(), { limit: 60 })
        setSearchResults(r?.results ?? [])
        setSearchTotal(r?.total ?? 0)
      } finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(searchTimer.current)
  }, [moduleId, query])

  // ── Proyectar ──────────────────────────────────────────────────────────────
  const projectVerse = useCallback((verse) => {
    const text = `${verse.text}\n\n— ${verse.reference}`
    project(text, liveBg)
    setSelectedVerse(verse)
  }, [project, liveBg])

  // ── Guardar en biblioteca ──────────────────────────────────────────────────
  const saveVerse = useCallback(async (verse) => {
    try {
      await window.api?.library.create({
        title:   verse.reference,
        content: `${verse.text}\n\n— ${verse.reference}`,
        type:    'verse',
      })
      await refreshLibrary()
      setSaveMsg('ok')
    } catch {
      setSaveMsg('error')
    } finally {
      clearTimeout(saveMsgTimer.current)
      saveMsgTimer.current = setTimeout(() => setSaveMsg(null), 2500)
    }
  }, [refreshLibrary])

  // ── Navegación con proyección automática ───────────────────────────────────
  const goToVerse = useCallback((verse) => {
    setSelectedVerse(verse)
    projectVerse(verse)
  }, [projectVerse])

  const goPrev = useCallback(() => {
    const prev = verses.find(v => v.verse === selectedVerse.verse - 1)
    if (prev) goToVerse(prev)
  }, [verses, selectedVerse, goToVerse])

  const goNext = useCallback(() => {
    const next = verses.find(v => v.verse === selectedVerse.verse + 1)
    if (next) goToVerse(next)
  }, [verses, selectedVerse, goToVerse])

  // ── Navegación en resultados de búsqueda ───────────────────────────────────
  const goSearchPrev = useCallback(() => {
    if (!selectedVerse || searchResults.length === 0) return
    const idx = searchResults.findIndex(v => v.id === selectedVerse.id)
    const prev = searchResults[Math.max(0, idx - 1)]
    if (prev) goToVerse(prev)
  }, [searchResults, selectedVerse, goToVerse])

  const goSearchNext = useCallback(() => {
    if (!selectedVerse || searchResults.length === 0) return
    const idx = searchResults.findIndex(v => v.id === selectedVerse.id)
    const next = searchResults[Math.min(searchResults.length - 1, idx + 1)]
    if (next) goToVerse(next)
  }, [searchResults, selectedVerse, goToVerse])

  // ── Atajos de teclado ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!selectedVerse) return
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return

      if (mode === 'navigate') {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext() }
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goPrev() }
        if (e.key === 'Enter') { e.preventDefault(); projectVerse(selectedVerse) }
        if (e.key === 'Home' && verses.length > 0) {
          e.preventDefault(); goToVerse(verses[0])
        }
        if (e.key === 'End' && verses.length > 0) {
          e.preventDefault(); goToVerse(verses[verses.length - 1])
        }
      }

      if (mode === 'search' && searchResults.length > 0) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goSearchNext() }
        if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goSearchPrev() }
        if (e.key === 'Enter') { e.preventDefault(); projectVerse(selectedVerse) }
        if (e.key === 'Home') {
          e.preventDefault(); goToVerse(searchResults[0])
        }
        if (e.key === 'End') {
          e.preventDefault(); goToVerse(searchResults[searchResults.length - 1])
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedVerse, mode, goNext, goPrev, projectVerse, verses, goToVerse,
      searchResults, goSearchNext, goSearchPrev])

  // ─────────────────────────────────────────────────────────────────────────────
  if (!loading && modules.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/30 flex items-center justify-center mx-auto mb-4">
            <BookIcon />
          </div>
          <h2 className="font-bold text-lg mb-2" style={{ color: 'var(--text-1)' }}>No hay módulos instalados</h2>
          <p className="text-sm text-slate-400 mb-5">Instala un módulo bíblico (.osb) copiándolo al directorio de bibles.</p>
          <Button variant="secondary" onClick={() => window.api?.bible.openBiblesDir()}>
            <FolderIcon /> Abrir directorio de biblias
          </Button>
        </div>
      </main>
    )
  }

  const chapters = Array.from({ length: chapterCount }, (_, i) => i + 1)
  const otBooks  = books.filter(b => b.testament === 'OT')
  const ntBooks  = books.filter(b => b.testament === 'NT')
  const listToRender = mode === 'navigate' ? verses : searchResults

  return (
    <main className="flex-1 flex overflow-hidden">

      {/* ── Panel izquierdo ────────────────────────────────────────────────── */}
      <div className={cn(
        'w-72 flex-shrink-0 flex flex-col border-r',
        'border-surface-muted dark:border-dark-border',
        'bg-white dark:bg-dark-surface transition-colors duration-300',
      )}>

        {/* Header */}
        <div className="p-3 border-b border-surface-muted dark:border-dark-border">
          {modules.length > 0 && (
            <div className="mb-3">
              <SectionLabel className="mb-1.5">Versión</SectionLabel>
              <Select className="w-full text-[13px]" value={moduleId ?? ''} onChange={e => setModuleId(e.target.value)}>
                {modules.map(m => <option key={m.id} value={m.id}>{m.abbreviation} — {m.name}</option>)}
              </Select>
            </div>
          )}
          <div className="flex gap-1 p-1 rounded-lg bg-surface-soft dark:bg-dark-card">
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-[12px] font-semibold transition-all',
                  mode === m.id
                    ? 'bg-white dark:bg-dark-surface text-slate-900 dark:text-white shadow-card'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
                )}
              >{m.label}</button>
            ))}
          </div>
        </div>

        {/* ── Navegar ──────────────────────────────────────────────────────── */}
        {mode === 'navigate' && (
          <div className="flex flex-col flex-1 overflow-hidden p-3 gap-2">
            <div>
              <SectionLabel className="mb-1.5">Libro</SectionLabel>
              <Select className="w-full text-[13px]" value={selectedBook?.id ?? ''}
                onChange={e => {
                  const book = books.find(b => b.id === parseInt(e.target.value))
                  setSelectedBook(book); setSelectedChapter(1)
                }}
              >
                <optgroup label="Antiguo Testamento">
                  {otBooks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </optgroup>
                <optgroup label="Nuevo Testamento">
                  {ntBooks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </optgroup>
              </Select>
            </div>

            <div>
              <SectionLabel className="mb-1.5">Capítulo</SectionLabel>
              <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto pr-0.5">
                {chapters.map(ch => (
                  <button key={ch} onClick={() => setSelectedChapter(ch)}
                    className={cn(
                      'text-[12px] font-semibold rounded-md py-1.5 transition-all',
                      selectedChapter === ch
                        ? 'bg-brand-600 text-white shadow-brand'
                        : 'bg-surface-soft dark:bg-dark-card text-slate-500 dark:text-slate-400 hover:bg-brand-50 hover:text-brand-600',
                    )}
                  >{ch}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <SectionLabel className="mb-1.5">
                Versículos ({verses.length})
                <span className="ml-1.5 text-slate-300 dark:text-slate-700 font-normal normal-case tracking-normal">
                  · doble clic proyecta
                </span>
              </SectionLabel>
              <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                {verses.map(v => (
                  <VerseItem
                    key={v.id}
                    verse={v}
                    isSelected={selectedVerse?.id === v.id}
                    onSelect={setSelectedVerse}
                    onProject={projectVerse}
                    onSave={saveVerse}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Buscar ───────────────────────────────────────────────────────── */}
        {mode === 'search' && (
          <div className="flex flex-col flex-1 overflow-hidden p-3 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <SearchIcon />
              </span>
              <Input className="pl-8 text-[13px]" placeholder="Buscar en la Biblia…"
                value={query} onChange={e => setQuery(e.target.value)} autoFocus />
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
              {searching ? (
                <div className="flex justify-center py-6"><Spinner size={18} /></div>
              ) : query && searchResults.length === 0 ? (
                <p className="text-center text-[12px] text-slate-400 py-6">Sin resultados para "{query}"</p>
              ) : (
                <>
                  {searchTotal > 0 && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-600 pb-1">
                      {searchTotal.toLocaleString()} resultado{searchTotal !== 1 ? 's' : ''}
                      {searchTotal > 60 && ' (mostrando 60)'}
                    </p>
                  )}
                  {searchResults.map(v => (
                    <VerseItem
                      key={v.id}
                      verse={v}
                      isSelected={selectedVerse?.id === v.id}
                      onSelect={setSelectedVerse}
                      onProject={projectVerse}
                      onSave={saveVerse}
                      searchQuery={query}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Panel derecho ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3 min-h-0">
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Spinner size={24} /></div>
        ) : selectedVerse ? (
          <>
            {/* Preview — ocupa el espacio disponible, nunca más de 55vh */}
            <div className="flex-1 min-h-0 max-h-[55vh]">
              <VersePreview verse={selectedVerse} liveBg={liveBg} activeBg={activeBg} />
            </div>

            {/* Referencia + texto */}
            <Card className="p-3 flex-shrink-0">
              <p className="font-mono text-[11px] font-bold text-brand-500 mb-1">
                {selectedVerse.reference}
              </p>
              <p className="text-[13px] text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                {selectedVerse.text}
              </p>
            </Card>

            {/* ── Barra de controles ── */}
            <div className="flex gap-2 flex-shrink-0 items-center">

              {/* Anterior */}
              <button
                disabled={mode === 'navigate'
                  ? (!selectedVerse || selectedVerse.verse <= 1)
                  : searchResults.findIndex(v => v.id === selectedVerse?.id) <= 0}
                onClick={mode === 'navigate' ? goPrev : goSearchPrev}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all flex-shrink-0',
                  (mode === 'navigate'
                    ? (!selectedVerse || selectedVerse.verse <= 1)
                    : searchResults.findIndex(v => v.id === selectedVerse?.id) <= 0)
                    ? 'border-surface-muted dark:border-dark-border text-slate-300 dark:text-slate-700 cursor-not-allowed'
                    : 'border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20',
                )}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Anterior
              </button>

              {/* Proyectar */}
              <button
                onClick={() => projectVerse(selectedVerse)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-brand hover:-translate-y-px active:translate-y-0"
              >
                <ProjectIcon />
                Proyectar
              </button>

              {/* Siguiente */}
              <button
                disabled={mode === 'navigate'
                  ? (!selectedVerse || selectedVerse.verse >= verses.length)
                  : searchResults.findIndex(v => v.id === selectedVerse?.id) >= searchResults.length - 1}
                onClick={mode === 'navigate' ? goNext : goSearchNext}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all flex-shrink-0',
                  (mode === 'navigate'
                    ? (!selectedVerse || selectedVerse.verse >= verses.length)
                    : searchResults.findIndex(v => v.id === selectedVerse?.id) >= searchResults.length - 1)
                    ? 'border-surface-muted dark:border-dark-border text-slate-300 dark:text-slate-700 cursor-not-allowed'
                    : 'border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20',
                )}
              >
                Siguiente
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>

              {/* Guardar */}
              <button
                onClick={() => saveVerse(selectedVerse)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all flex-shrink-0',
                  saveMsg === 'ok'
                    ? 'border-green-300 dark:border-green-800 text-green-600 bg-green-50 dark:bg-green-950/20'
                    : saveMsg === 'error'
                    ? 'border-red-300 text-red-500'
                    : 'border-surface-muted dark:border-dark-border text-slate-500 dark:text-slate-400 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20',
                )}
              >
                <SaveIcon />
                {saveMsg === 'ok' ? '¡Guardado!' : saveMsg === 'error' ? 'Error' : 'Guardar'}
              </button>
            </div>

            {/* Hint */}
            <p className="text-[10px] text-slate-300 dark:text-slate-700 text-center flex-shrink-0">
              {mode === 'navigate' && verses.length > 0 &&
                `${selectedVerse.bookName} ${selectedVerse.chapter}:${selectedVerse.verse} / ${verses.length} · `}
              {mode === 'search' && searchResults.length > 0 &&
                `Resultado ${searchResults.findIndex(v => v.id === selectedVerse?.id) + 1} / ${searchResults.length} · `}
              ← → y Enter también proyectan
            </p>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            Selecciona un versículo para previsualizarlo
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Preview 16:9 ────────────────────────────────────────────────────────────
function VersePreview({ verse, liveBg, activeBg }) {
  const effectiveBg = activeBg ?? { type: 'gradient', value: BG_STYLES[liveBg] ?? BG_STYLES.dark }
  const isMedia = effectiveBg.type === 'image' || effectiveBg.type === 'gif' || effectiveBg.type === 'video'
  return (
    <div className="slide-canvas w-full h-full">
      {!isMedia && <div className="absolute inset-0 transition-all duration-500" style={{ background: effectiveBg.value }} />}
      {(effectiveBg.type === 'image' || effectiveBg.type === 'gif') && (
        <>
          <img src={effectiveBg.thumbnail || effectiveBg.value} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.38)' }} />
        </>
      )}
      {effectiveBg.type === 'video' && (
        <>
          <video key={effectiveBg.value} src={effectiveBg.value} loop muted autoPlay playsInline onCanPlay={e => e.target.play().catch(() => {})} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
        </>
      )}
      <span className="absolute top-2.5 left-3 font-mono text-[10px] text-white/20 tracking-wider select-none">PREVIEW</span>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-3 overflow-hidden">
        <p className="text-white font-bold text-center leading-snug whitespace-pre-wrap transition-all"
          style={{ fontSize: 'clamp(12px, 2.8vw, 28px)', textShadow: '0 2px 24px rgba(0,0,0,.8)',
            maxWidth: '100%', overflowWrap: 'break-word' }}>
          {verse.text}
        </p>
        <p className="text-white/50 font-mono font-bold text-center"
          style={{ fontSize: 'clamp(9px, 1.4vw, 14px)' }}>
          — {verse.reference}
        </p>
      </div>
    </div>
  )
}