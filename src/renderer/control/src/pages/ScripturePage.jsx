import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, Input, Select, FieldLabel, Spinner, SegmentedControl } from '@shared/components/ui/index.jsx'
import { ContextMenu } from '@shared/components/ContextMenu.jsx'
import { SlideCanvas } from '@shared/components/SlideCanvas.jsx'
import { watermarkPreviewStyle } from '@shared/constants/watermark.js'
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

// ─── Resaltador de texto ──────────────────────────────────────────────────────
function Highlight({ text, query }) {
  if (!query || !query.trim()) return <>{text}</>

  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts   = text.split(new RegExp(`(${escaped})`, 'gi'))

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="bg-warn-500/30 text-inherit rounded-[2px] px-0.5 -mx-0.5 font-bold">
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
function VerseItem({ verse, isSelected, isLiveVerse, onSelect, onProject, onSave, searchQuery }) {
  const { projectionClickMode } = useApp()
  const clickTimer  = useRef(null)
  const [ctx, setCtx] = useState(null)

  const handleClick = (e) => {
    e.preventDefault()
    if (projectionClickMode === 'single') {
      onProject(verse)
      return
    }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onProject(verse)
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        onSelect(verse)
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
          'px-2.5 py-2 rounded-btn cursor-pointer transition-all select-none',
          isSelected
            ? 'bg-primary-500/10 border border-primary-500/40'
            : 'hover:bg-surface-3 border border-transparent',
        )}
        title="Clic para seleccionar • Doble clic para proyectar • Clic derecho para más opciones"
      >
        {isLiveVerse && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-live-500 animate-blink mr-1.5 align-middle" title="En vivo" />
        )}
        <span className={cn(
          'font-mono text-[10px] font-bold mr-1.5',
          isSelected ? 'text-primary-500' : 'text-ink-4',
        )}>
          {verse.verse}
        </span>
        <span className="text-[12px] leading-relaxed text-ink-2">
          <Highlight text={verse.text} query={searchQuery} />
        </span>
      </div>

      <ContextMenu
        open={!!ctx}
        x={ctx?.x ?? 0}
        y={ctx?.y ?? 0}
        title={verse.reference}
        items={[
          { icon: <ProjectIcon />, label: 'Proyectar', onClick: () => onProject(verse) },
          { icon: <SaveIcon />,    label: 'Guardar en biblioteca', onClick: () => onSave(verse) },
          { icon: <CopyIcon />,    label: 'Copiar texto', onClick: handleCopy },
        ]}
        onClose={() => setCtx(null)}
      />
    </>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function ScripturePage() {
  const { project, activeBg, createItem, refreshLibrary, isNavNext, isNavPrev,
          defaultBibleModule, showVerseNumbers, setNextText,
          pendingSelection, clearPendingSelection,
          registerTransport, clearSignal, isLive } = useApp()

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

  // Versículo actualmente proyectado — para el punto rojo ● en la lista
  const [liveVerseId, setLiveVerseId] = useState(null)

  // Deep-link del buscador global: objetivo pendiente {bookId, chapter, verse}.
  // "Cabalga" la cadena de effects existente (módulo → libros → capítulo → versos)
  // sin duplicarla: cada effect consulta este ref para decidir qué seleccionar.
  const deepLinkRef = useRef(null)

  // ── Cargar módulos ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const mods = await window.api?.bible.listModules() ?? []
        setModules(mods)
        if (mods.length > 0) {
          const preferred = mods.find(m => m.id === defaultBibleModule)
          setModuleId((preferred ?? mods[0]).id)
        }
      } finally { setLoading(false) }
    }
    load()
  }, [])

  // ── Deep-link del buscador global (referencia o versículo) ─────────────────
  useEffect(() => {
    if (pendingSelection?.type !== 'verseRef' && pendingSelection?.type !== 'verse') return
    const { moduleId: targetModule, bookId, chapter, verse } = pendingSelection.payload
    deepLinkRef.current = { bookId, chapter, verse }
    setMode('navigate')
    if (targetModule && targetModule !== moduleId) {
      // Cambiar de módulo re-dispara la cadena completa (libros → versos)
      setModuleId(targetModule)
    } else if (books.length > 0) {
      // Mismo módulo: seleccionar libro y capítulo directamente
      const book = books.find(b => b.id === bookId)
      if (!book) { deepLinkRef.current = null; clearPendingSelection(); return }
      if (book.id === selectedBook?.id && chapter === selectedChapter) {
        // Ya estamos en ese capítulo (la cadena no se re-dispara):
        // proyectar y seleccionar el versículo sobre los versos ya cargados
        const v = verse != null ? (verses.find(x => x.verse === verse) ?? verses[0] ?? null) : (verses[0] ?? null)
        if (v) projectVerse(v)
        deepLinkRef.current = null
        clearPendingSelection()
      } else {
        setSelectedBook(book)
        setSelectedChapter(chapter)
      }
    }
  }, [pendingSelection]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Libros al cambiar módulo ────────────────────────────────────────────────
  useEffect(() => {
    if (!moduleId) return
    window.api?.bible.getBooks(moduleId).then(b => {
      setBooks(b ?? [])
      // Si hay un deep-link pendiente, seleccionar su libro objetivo en vez del primero
      const target = deepLinkRef.current
      const book = target ? b?.find(x => x.id === target.bookId) : null
      if (book) { setSelectedBook(book); setSelectedChapter(target.chapter) }
      else if (b?.length > 0) { setSelectedBook(b[0]); setSelectedChapter(1) }
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
      // Último eslabón del deep-link: proyectar y seleccionar el versículo objetivo, y limpiar
      const target = deepLinkRef.current
      if (target) {
        const v = target.verse != null ? (vs?.find(x => x.verse === target.verse) ?? vs?.[0] ?? null) : (vs?.[0] ?? null)
        if (v) projectVerse(v)
        deepLinkRef.current = null
        clearPendingSelection()
      } else {
        setSelectedVerse(vs?.[0] ?? null)
      }
    })
  }, [moduleId, selectedBook, selectedChapter]) // eslint-disable-line react-hooks/exhaustive-deps

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
    const body = showVerseNumbers ? `${verse.verse}. ${verse.text}` : verse.text
    const text = `${body}\n\n— ${verse.reference}`
    project(text)
    setSelectedVerse(verse)
    setLiveVerseId(verse.id)
  }, [project, showVerseNumbers])

  // La señal de limpieza global y el apagado quitan el punto rojo
  useEffect(() => { setLiveVerseId(null) }, [clearSignal])
  useEffect(() => { if (!isLive) setLiveVerseId(null) }, [isLive])

  // ── Guardar en biblioteca ──────────────────────────────────────────────────
  const saveVerse = useCallback(async (verse) => {
    try {
      await window.api?.library.create({
        title:   verse.reference,
        content: `${verse.text}\n\n— ${verse.reference}`,
        type:    'verse',
        ref:     { moduleId, bookId: verse.book, chapter: verse.chapter, verse: verse.verse },
      })
      await refreshLibrary()
      setSaveMsg('ok')
    } catch {
      setSaveMsg('error')
    } finally {
      clearTimeout(saveMsgTimer.current)
      saveMsgTimer.current = setTimeout(() => setSaveMsg(null), 2500)
    }
  }, [refreshLibrary, moduleId])

  // ── Actualiza la vista previa de "lo próximo" para el panel de Escenario ───
  useEffect(() => {
    const list = mode === 'navigate' ? verses : searchResults
    if (!selectedVerse || list.length === 0) { setNextText(''); return }
    const idx  = list.findIndex(v => v.id === selectedVerse.id)
    const next = list[idx + 1]
    setNextText(next ? next.reference : '')
  }, [mode, verses, searchResults, selectedVerse, setNextText])

  // ── Navegación con proyección automática ───────────────────────────────────
  const goToVerse = useCallback((verse) => {
    setSelectedVerse(verse)
    projectVerse(verse)
  }, [projectVerse])

  const goPrev = useCallback(() => {
    if (!selectedVerse) return
    const prev = verses.find(v => v.verse === selectedVerse.verse - 1)
    if (prev) goToVerse(prev)
  }, [verses, selectedVerse, goToVerse])

  const goNext = useCallback(() => {
    if (!selectedVerse) return
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

  // ── Transport global (barra inferior): prev/next de versículos ─────────────
  useEffect(() => {
    if (!selectedVerse) return
    return registerTransport({
      onPrev: mode === 'navigate' ? goPrev : goSearchPrev,
      onNext: mode === 'navigate' ? goNext : goSearchNext,
      label:  selectedVerse.reference,
    })
  }, [mode, selectedVerse, goPrev, goNext, goSearchPrev, goSearchNext, registerTransport])

  // ── Atajos de teclado ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (!selectedVerse) return
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return

      if (mode === 'navigate') {
        if (isNavNext(e.key)) { e.preventDefault(); goNext() }
        if (isNavPrev(e.key)) { e.preventDefault(); goPrev() }
        if (e.key === 'Enter') { e.preventDefault(); projectVerse(selectedVerse) }
        if (e.key === 'Home' && verses.length > 0) {
          e.preventDefault(); goToVerse(verses[0])
        }
        if (e.key === 'End' && verses.length > 0) {
          e.preventDefault(); goToVerse(verses[verses.length - 1])
        }
      }

      if (mode === 'search' && searchResults.length > 0) {
        if (isNavNext(e.key)) { e.preventDefault(); goSearchNext() }
        if (isNavPrev(e.key)) { e.preventDefault(); goSearchPrev() }
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
      searchResults, goSearchNext, goSearchPrev, isNavNext, isNavPrev])

  // ─────────────────────────────────────────────────────────────────────────────
  if (!loading && modules.length === 0) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-card bg-primary-500/10 text-primary-500 flex items-center justify-center mx-auto mb-4">
            <BookIcon />
          </div>
          <h2 className="font-bold text-lg mb-2 text-ink-1">No hay módulos instalados</h2>
          <p className="text-sm text-ink-3 mb-5">Instala un módulo bíblico (.osb) copiándolo al directorio de bibles.</p>
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
        'w-72 flex-shrink-0 flex flex-col border-r border-line-1',
        'bg-surface-1 transition-colors duration-300',
      )}>

        {/* Header */}
        <div className="p-3 border-b border-line-1">
          {modules.length > 0 && (
            <div className="mb-3">
              <FieldLabel className="mb-1.5">Versión</FieldLabel>
              <Select className="w-full text-[13px]" value={moduleId ?? ''} onChange={e => setModuleId(e.target.value)}>
                {modules.map(m => <option key={m.id} value={m.id}>{m.abbreviation} — {m.name}</option>)}
              </Select>
            </div>
          )}
          <SegmentedControl
            block
            options={MODES.map(m => ({ value: m.id, label: m.label }))}
            value={mode}
            onChange={setMode}
          />
        </div>

        {/* ── Navegar ──────────────────────────────────────────────────────── */}
        {mode === 'navigate' && (
          <div className="flex flex-col flex-1 overflow-hidden p-3 gap-2">
            <div>
              <FieldLabel className="mb-1.5">Libro</FieldLabel>
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
              <FieldLabel className="mb-1.5">Capítulo</FieldLabel>
              <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto pr-0.5">
                {chapters.map(ch => (
                  <button key={ch} onClick={() => setSelectedChapter(ch)}
                    className={cn(
                      'text-[12px] font-mono font-semibold rounded-btn py-1.5 transition-all',
                      selectedChapter === ch
                        ? 'bg-primary-500 text-white'
                        : 'bg-surface-3 text-ink-3 hover:text-primary-500 hover:bg-primary-500/10',
                    )}
                  >{ch}</button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              <FieldLabel className="mb-1.5">
                Versículos ({verses.length})
                <span className="ml-1.5 text-ink-4 font-normal normal-case tracking-normal">
                  · doble clic proyecta
                </span>
              </FieldLabel>
              <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
                {verses.map(v => (
                  <VerseItem
                    key={v.id}
                    verse={v}
                    isSelected={selectedVerse?.id === v.id}
                    isLiveVerse={liveVerseId === v.id}
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
              <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-4">
                <SearchIcon />
              </span>
              <Input className="pl-8 text-[13px]" placeholder="Buscar en la Biblia…"
                value={query} onChange={e => setQuery(e.target.value)} autoFocus />
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5">
              {searching ? (
                <div className="flex justify-center py-6"><Spinner size={18} /></div>
              ) : query && searchResults.length === 0 ? (
                <p className="text-center text-[12px] text-ink-4 py-6">Sin resultados para "{query}"</p>
              ) : (
                <>
                  {searchTotal > 0 && (
                    <p className="text-[11px] font-mono text-ink-4 pb-1">
                      {searchTotal.toLocaleString()} resultado{searchTotal !== 1 ? 's' : ''}
                      {searchTotal > 60 && ' (mostrando 60)'}
                    </p>
                  )}
                  {searchResults.map(v => (
                    <VerseItem
                      key={v.id}
                      verse={v}
                      isSelected={selectedVerse?.id === v.id}
                      isLiveVerse={liveVerseId === v.id}
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
            <div className="flex-1 min-h-0 max-h-[55vh] flex justify-center">
              <VersePreview verse={selectedVerse} activeBg={activeBg} showVerseNumbers={showVerseNumbers} />
            </div>

            {/* Referencia + texto */}
            <Card className="p-3 flex-shrink-0">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[1px] text-primary-500 mb-1">
                {selectedVerse.reference}
              </p>
              <p className="text-[13px] text-ink-2 leading-relaxed line-clamp-2">
                {selectedVerse.text}
              </p>
            </Card>

            {/* ── Barra de controles ── */}
            <div className="flex gap-2 flex-shrink-0 items-center">

              {/* Anterior */}
              <Button
                variant="outline"
                size="md"
                disabled={mode === 'navigate'
                  ? (!selectedVerse || selectedVerse.verse <= 1)
                  : searchResults.findIndex(v => v.id === selectedVerse?.id) <= 0}
                onClick={mode === 'navigate' ? goPrev : goSearchPrev}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
                Anterior
              </Button>

              {/* Proyectar */}
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => projectVerse(selectedVerse)}
              >
                <ProjectIcon />
                Proyectar
              </Button>

              {/* Siguiente */}
              <Button
                variant="outline"
                size="md"
                disabled={mode === 'navigate'
                  ? (!selectedVerse || selectedVerse.verse >= verses.length)
                  : searchResults.findIndex(v => v.id === selectedVerse?.id) >= searchResults.length - 1}
                onClick={mode === 'navigate' ? goNext : goSearchNext}
              >
                Siguiente
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </Button>

              {/* Guardar */}
              <button
                onClick={() => saveVerse(selectedVerse)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-btn text-[12px] font-semibold border transition-all flex-shrink-0',
                  saveMsg === 'ok'
                    ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                    : saveMsg === 'error'
                    ? 'border-live-500/40 text-live-500'
                    : 'border-line-2 text-ink-3 hover:text-primary-500 hover:border-primary-500/40 hover:bg-primary-500/10',
                )}
              >
                <SaveIcon />
                {saveMsg === 'ok' ? '¡Guardado!' : saveMsg === 'error' ? 'Error' : 'Guardar'}
              </button>
            </div>

            {/* Hint */}
            <p className="text-[10px] font-mono text-ink-4 text-center flex-shrink-0">
              {mode === 'navigate' && verses.length > 0 &&
                `${selectedVerse.bookName} ${selectedVerse.chapter}:${selectedVerse.verse} / ${verses.length} · `}
              {mode === 'search' && searchResults.length > 0 &&
                `Resultado ${searchResults.findIndex(v => v.id === selectedVerse?.id) + 1} / ${searchResults.length} · `}
              ← → y Enter también proyectan
            </p>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-ink-4 text-sm">
            Selecciona un versículo para previsualizarlo
          </div>
        )}
      </div>
    </main>
  )
}

// ─── Preview 16:9 ────────────────────────────────────────────────────────────
// Espejo exacto de lo que projectVerse manda a proyección (mismo formato de texto)
function VersePreview({ verse, activeBg, showVerseNumbers }) {
  const { projectionFontFamily, projFontSize, watermark } = useApp()
  const body = showVerseNumbers ? `${verse.verse}. ${verse.text}` : verse.text
  return (
    <SlideCanvas
      bg={activeBg}
      text={`${body}\n\n— ${verse.reference}`}
      fontFamily={projectionFontFamily}
      fontSizeMode={projFontSize}
      label="Preview"
      video
      className="h-full max-w-full"
    >
      {watermark?.enabled && watermark.image && (
        <img src={watermark.image} alt="" className="absolute pointer-events-none select-none"
          style={watermarkPreviewStyle(watermark)} />
      )}
    </SlideCanvas>
  )
}