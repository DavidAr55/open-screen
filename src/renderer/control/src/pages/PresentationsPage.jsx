import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, Spinner } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'
import { ConfirmModal } from '@shared/components/ConfirmModal.jsx'
import { ContextMenu } from '@shared/components/ContextMenu.jsx'
// ─── pdfjs setup ──────────────────────────────────────────────────────────────
// Estrategia para Electron + Vite:
// Vite procesa el worker como módulo y genera una URL válida en el bundle.
// Usamos ?url para obtener la ruta procesada por Vite.
let pdfjsLib = null

async function getPdfjs() {
  if (pdfjsLib) return pdfjsLib
  const pdfjs = await import('pdfjs-dist')

  // Vite transforma esta importación en una URL del bundle
  // que Electron puede cargar correctamente desde el filesystem o el servidor de dev
  try {
    const workerUrl = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString()
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
  } catch {
    // Fallback: usar CDN si la URL local no funciona
    pdfjs.GlobalWorkerOptions.workerSrc =
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`
  }

  pdfjsLib = pdfjs
  return pdfjs
}

// ─── Iconos ───────────────────────────────────────────────────────────────────
const UploadIcon   = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const TrashIcon    = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const ProjectIcon  = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const SaveIcon     = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const SlideIcon    = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
const BackIcon     = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>

// ─── Renderizar una página de PDF a dataURL ───────────────────────────────────
async function renderPage(pdfDoc, pageNum, scale = 1.5) {
  const page     = await pdfDoc.getPage(pageNum)
  const viewport = page.getViewport({ scale })
  const canvas   = document.createElement('canvas')
  const ctx      = canvas.getContext('2d')
  canvas.width   = viewport.width
  canvas.height  = viewport.height
  await page.render({ canvasContext: ctx, viewport }).promise
  return canvas.toDataURL('image/jpeg', 0.85)
}

// ─── Cargar un PDF desde base64 ───────────────────────────────────────────────
async function loadPdfFromBase64(base64Data) {
  const pdfjs   = await getPdfjs()
  const binary  = atob(base64Data)
  const bytes   = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return pdfjs.getDocument({ data: bytes }).promise
}

// ─── Thumbnail card con context menu ─────────────────────────────────────────
function PresentationCard({ pres, isActive, onClick, onSelect, onDelete, onToggleFav, onSaveToLibrary, onProject }) {
  const { projectionClickMode } = useApp()
  const clickTimer = useRef(null)
  const [ctx, setCtx] = useState(null)

  const handleClick = () => {
    if (projectionClickMode === 'single') {
      onClick()
      return
    }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onClick()
    } else {
      onSelect?.()
      clickTimer.current = setTimeout(() => { clickTimer.current = null }, 220)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    setCtx({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'group relative rounded-panel border cursor-pointer transition-all overflow-hidden',
          isActive
            ? 'border-primary-500/60'
            : 'border-line-1 hover:border-primary-500/40',
        )}
      >
        {/* Thumbnail */}
        <div className="aspect-video bg-neutral-950 flex items-center justify-center relative overflow-hidden">
          {pres.thumbnail ? (
            <img src={pres.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-600">
              <SlideIcon />
              <span className="text-[10px] font-mono">PDF</span>
            </div>
          )}
          {pres.page_count > 0 && (
            <span className="absolute bottom-1 right-1.5 font-mono text-[9px] font-bold bg-black/60 text-white/80 px-1.5 py-0.5 rounded-[3px]">
              {pres.page_count} slides
            </span>
          )}
          {/* Favorito */}
          {pres.is_favorite ? (
            <span className="absolute top-1.5 left-1.5 text-warn-400">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </span>
          ) : null}
        </div>

        {/* Info */}
        <div className={cn(
          'p-2.5',
          isActive ? 'bg-primary-500/10' : 'bg-surface-1',
        )}>
          <p className={cn('text-[12px] font-semibold truncate',
            isActive ? 'text-primary-500' : 'text-ink-1')}>
            {pres.name}
          </p>
        </div>

        {/* Botones hover */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={e => { e.stopPropagation(); onToggleFav() }}
            className={cn(
              'p-1 rounded-btn bg-black/40 hover:bg-black/60 transition-all',
              pres.is_favorite ? 'text-warn-400' : 'text-white/60 hover:text-warn-400',
            )}
          >
            <svg width="11" height="11" fill={pres.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 rounded-btn bg-black/40 text-white/70 hover:bg-live-500/80 hover:text-white transition-all"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <ContextMenu
        open={!!ctx}
        x={ctx?.x ?? 0}
        y={ctx?.y ?? 0}
        title={pres.page_count > 0 ? `${pres.name} · ${pres.page_count} slides` : pres.name}
        items={[
          { icon: <ProjectIcon />, label: 'Proyectar', onClick: onProject },
          { icon: <SaveIcon />,    label: 'Guardar en biblioteca', onClick: onSaveToLibrary },
          'sep',
          {
            icon: (
              <svg width="12" height="12" fill={pres.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ),
            label: pres.is_favorite ? 'Quitar de favoritos' : 'Marcar favorito',
            onClick: onToggleFav,
          },
          'sep',
          { icon: <TrashIcon />, label: 'Eliminar', onClick: onDelete, danger: true },
        ]}
        onClose={() => setCtx(null)}
      />
    </>
  )
}

// ─── Slide grid card ──────────────────────────────────────────────────────────
function SlideCard({ dataUrl, index, isActive, isLive, onClick, onProject }) {
  const { projectionClickMode } = useApp()
  const clickTimer = useRef(null)

  const handleClick = (e) => {
    e?.stopPropagation()
    if (projectionClickMode === 'single') {
      onClick()
      onProject()
      return
    }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onClick()
      onProject()
    } else {
      onClick()
      clickTimer.current = setTimeout(() => { clickTimer.current = null }, 240)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'relative rounded-panel overflow-hidden cursor-pointer border-2 transition-all group',
        isLive   ? 'border-live-500 shadow-[0_0_12px_rgb(255_59_48/.35)]' :
        isActive ? 'border-primary-500 scale-[1.02]' :
                   'border-transparent hover:border-primary-500/50 hover:scale-[1.01]',
      )}
    >
      <div className="aspect-video bg-neutral-950 relative overflow-hidden">
        {dataUrl
          ? <img src={dataUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center"><Spinner size={16} /></div>
        }
      </div>

      {/* Slide number */}
      <div className={cn(
        'absolute top-1.5 left-2 font-mono text-[9px] font-bold',
        isLive ? 'text-live-500' : isActive ? 'text-primary-400' : 'text-white/40',
      )}>
        {index + 1}
        {isLive && <span className="ml-1 animate-blink uppercase">● Live</span>}
      </div>

      {/* Project overlay — respeta el modo de clic configurado */}
      <div
        onClick={handleClick}
        className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
      >
        <div className="bg-primary-500/90 text-white rounded-full p-2">
          <ProjectIcon />
        </div>
      </div>
    </div>
  )
}

// ─── Vista de proyección de presentación ──────────────────────────────────────
function PresentationProjector({ pres, onBack, autoProject }) {
  const { isNavNext, isNavPrev, setNextText, registerTransport, clearSignal } = useApp()
  const [slides, setSlides]     = useState([])   // array de dataURLs
  const [loading, setLoading]   = useState(true)
  const [progress, setProgress] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [liveIdx,   setLiveIdx]   = useState(-1)
  const [error, setError]         = useState(null)
  const pdfRef = useRef(null)

  // Vista previa de "lo próximo" para el panel de Escenario
  useEffect(() => {
    if (liveIdx < 0 || liveIdx + 1 >= slides.length) { setNextText(''); return }
    setNextText(`Diapositiva ${liveIdx + 2} de ${slides.length}`)
  }, [liveIdx, slides.length, setNextText])

  // Cargar y renderizar todas las páginas
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const record = await window.api?.presentations.readFile(pres.id)
        if (!record?.data) throw new Error(record?.error ?? 'No se pudo leer el archivo')
        const pdf     = await loadPdfFromBase64(record.data)
        pdfRef.current = pdf
        const total   = pdf.numPages
        const rendered = new Array(total).fill(null)
        setSlides([...rendered])

        // Renderizar en lotes para no bloquear la UI
        for (let i = 0; i < total; i++) {
          if (cancelled) return
          const dataUrl = await renderPage(pdf, i + 1, 1.8)
          rendered[i] = dataUrl
          setSlides([...rendered])
          setProgress(Math.round(((i + 1) / total) * 100))
        }

        // Actualizar page_count y thumbnail si cambiaron
        if (pres.page_count !== total || !pres.thumbnail) {
          await window.api?.presentations.update(pres.id, {
            page_count: total,
            thumbnail: rendered[0],
          })
        }
      } catch (e) {
        console.error('[Projector] Error:', e)
        setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [pres.id])

  const projectSlide = useCallback((idx) => {
    if (!slides[idx]) return
    setLiveIdx(idx)
    window.api?.presentations.projectSlide({
      dataUrl:          slides[idx],
      slideNumber:      idx + 1,
      totalSlides:      slides.length,
      presentationName: pres.name,
    })
  }, [slides, pres])

  // Deep-link: proyectar automáticamente la primera diapositiva en cuanto esté lista
  useEffect(() => {
    if (autoProject && liveIdx < 0 && slides[0]) projectSlide(0)
  }, [autoProject, slides, liveIdx, projectSlide])

  const goPrev = useCallback(() => {
    const newIdx = Math.max(0, activeIdx - 1)
    setActiveIdx(newIdx)
    if (liveIdx >= 0) projectSlide(newIdx)
  }, [activeIdx, liveIdx, projectSlide])

  const goNext = useCallback(() => {
    const newIdx = Math.min(slides.length - 1, activeIdx + 1)
    setActiveIdx(newIdx)
    if (liveIdx >= 0) projectSlide(newIdx)
  }, [activeIdx, liveIdx, slides.length, projectSlide])

  // ── Transport global (barra inferior): prev/next de diapositivas ───────────
  useEffect(() => {
    if (slides.length === 0) return
    return registerTransport({
      onPrev: goPrev,
      onNext: goNext,
      label: `${activeIdx + 1}/${slides.length}`,
    })
  }, [goPrev, goNext, activeIdx, slides.length, registerTransport])

  // La señal de limpieza global (CLEAR ALL) apaga el indicador local de en vivo
  useEffect(() => { setLiveIdx(-1) }, [clearSignal])

  // Teclado: teclas configuradas navegan y proyectan, Home=primero, End=último
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return
      if (isNavNext(e.key))                 { e.preventDefault(); goNext() }
      if (isNavPrev(e.key))                 { e.preventDefault(); goPrev() }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); projectSlide(activeIdx) }
      if (e.key === 'Home') {
        e.preventDefault()
        setActiveIdx(0)
        if (liveIdx >= 0) projectSlide(0)
      }
      if (e.key === 'End') {
        e.preventDefault()
        const last = slides.length - 1
        setActiveIdx(last)
        if (liveIdx >= 0) projectSlide(last)
      }
      if (e.key === 'Escape') { window.api?.presentations.clearSlide(); setLiveIdx(-1) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIdx, liveIdx, projectSlide, goNext, goPrev, slides, isNavNext, isNavPrev])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-live-500 font-semibold mb-2">Error al cargar la presentación</p>
          <p className="text-ink-4 text-sm">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={onBack}>Volver</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-line-1 bg-surface-1 flex-shrink-0">
        <button onClick={onBack} className="text-ink-4 hover:text-ink-1 transition-colors">
          <BackIcon />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-ink-1 truncate">{pres.name}</p>
          <p className="text-[11px] font-mono text-ink-4">
            {loading ? `Cargando… ${progress}%` : `${slides.length} slides`}
            {liveIdx >= 0 && <span className="ml-2 text-live-500 font-semibold uppercase"><span className="animate-blink">●</span> Slide {liveIdx + 1} en vivo</span>}
          </p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => { window.api?.presentations.clearSlide(); setLiveIdx(-1) }}
        >
          Limpiar pantalla
        </Button>
      </div>

      {/* Grid de slides */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && slides.every(s => !s) ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Spinner size={24} />
            <p className="text-ink-4 text-sm">Procesando slides… {progress}%</p>
          </div>
        ) : (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {slides.map((dataUrl, idx) => (
              <SlideCard
                key={idx}
                dataUrl={dataUrl}
                index={idx}
                isActive={activeIdx === idx}
                isLive={liveIdx === idx}
                onClick={() => setActiveIdx(idx)}
                onProject={() => { setActiveIdx(idx); projectSlide(idx) }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Barra de navegación */}
      <div className="flex items-center gap-2 px-5 py-3 border-t border-line-1 bg-surface-1 flex-shrink-0">
        <Button variant="outline" size="md" disabled={activeIdx <= 0} onClick={goPrev}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Anterior
        </Button>

        <Button
          variant="primary"
          size="lg"
          className="flex-1"
          disabled={!slides[activeIdx]}
          onClick={() => projectSlide(activeIdx)}
        >
          <ProjectIcon />
          Proyectar slide {activeIdx + 1}
        </Button>

        <Button variant="outline" size="md" disabled={activeIdx >= slides.length - 1} onClick={goNext}>
          Siguiente
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </Button>

        <span className="text-[11px] text-ink-4 font-mono flex-shrink-0 ml-1">
          {activeIdx + 1} / {slides.length || '?'}
        </span>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function PresentationsPage() {
  const { refreshLibrary, pendingSelection, clearPendingSelection } = useApp()
  const [presentations, setPresentations] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [importing,     setImporting]     = useState(false)
  const [activePres,    setActivePres]    = useState(null)
  const [view,          setView]          = useState('list')
  const [confirmModal,  setConfirmModal]  = useState(null) // 'list' | 'project'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await window.api?.presentations.findAll() ?? []
      setPresentations(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleImport = async () => {
    setImporting(true)
    try {
      const result = await window.api?.presentations.import()
      if (result?.error) {
        alert(result.error)
        return
      }
      if (result) {
        await load()
        setActivePres(result)
      }
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = (id) => {
    setConfirmModal({
      message: '¿Eliminar esta presentación? El archivo se eliminará de la biblioteca.',
      onConfirm: async () => {
        setConfirmModal(null)
        await window.api?.presentations.delete(id)
        if (activePres?.id === id) setActivePres(null)
        await load()
      },
    })
  }

  const handleToggleFav = async (id) => {
    const updated = await window.api?.presentations.toggleFavorite(id)
    if (updated) {
      setPresentations(prev => prev.map(p => p.id === id ? { ...p, is_favorite: updated.is_favorite } : p))
    }
  }

  const handleSaveToLibrary = async (pres) => {
    await window.api?.library.create({
      title:   pres.name,
      content: `${pres.name}${pres.page_count ? ` (${pres.page_count} slides)` : ''}`,
      type:    'presentation',
      ref:     { presId: pres.id },
    })
    refreshLibrary()
  }

  const [autoProject, setAutoProject] = useState(false)

  const handleProject = (pres, opts = {}) => {
    setActivePres(pres)
    setAutoProject(!!opts.autoProject)
    setView('project')
  }

  // ── Deep-link del buscador global: abrir en modo proyector y proyectar la 1ª diapositiva ──
  useEffect(() => {
    if (pendingSelection?.type !== 'presentation') return
    (async () => {
      const pres = await window.api?.presentations.findById(pendingSelection.payload.presId)
      if (pres) handleProject(pres, { autoProject: true })
      clearPendingSelection()
    })()
  }, [pendingSelection]) // eslint-disable-line react-hooks/exhaustive-deps

  if (view === 'project' && activePres) {
    return (
      <main className="flex-1 flex overflow-hidden">
        <PresentationProjector
          pres={activePres}
          autoProject={autoProject}
          onBack={() => { setView('list'); load() }}
        />
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden p-5 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-extrabold text-xl text-ink-1">Presentaciones</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">Sube archivos PDF para proyectarlos slide a slide</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.api?.presentations.openDir()}>
            Abrir carpeta
          </Button>
          <Button size="md" onClick={handleImport} disabled={importing}>
            {importing ? <Spinner size={14} className="text-white" /> : <UploadIcon />}
            {importing ? 'Importando…' : 'Importar PDF'}
          </Button>
        </div>
      </div>

      {/* Nota informativa */}
      <Card className="p-3 flex-shrink-0 border-warn-500/30 bg-warn-500/10">
        <p className="text-[12px] text-warn-600 dark:text-warn-400">
          <strong>💡 Tip:</strong> Exporta tu presentación de PowerPoint, Keynote o Google Slides como PDF antes de importarla.
          <span className="ml-1 opacity-80">Archivo → Exportar → PDF.</span>
        </p>
      </Card>

      {/* Grid de presentaciones */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : presentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-card bg-surface-3 text-ink-3 flex items-center justify-center">
              <SlideIcon />
            </div>
            <p className="text-ink-4 text-sm text-center">
              No hay presentaciones aún.<br/>
              Importa un PDF para empezar.
            </p>
            <Button onClick={handleImport} disabled={importing}>
              <UploadIcon /> Importar PDF
            </Button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {presentations.map(pres => (
              <PresentationCard
                key={pres.id}
                pres={pres}
                isActive={activePres?.id === pres.id}
                onClick={() => handleProject(pres)}
                onSelect={() => setActivePres(pres)}
                onDelete={() => handleDelete(pres.id)}
                onToggleFav={() => handleToggleFav(pres.id)}
                onSaveToLibrary={() => handleSaveToLibrary(pres)}
                onProject={() => handleProject(pres)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmModal}
        title="Eliminar presentación"
        message={confirmModal?.message}
        confirmLabel="Eliminar"
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </main>
  )
}