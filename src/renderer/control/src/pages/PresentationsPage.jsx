import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, SectionLabel, Spinner } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'
import { ConfirmModal } from '@shared/components/ConfirmModal.jsx'
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

// ─── Context menu para presentaciones ────────────────────────────────────────
function PresContextMenu({ x, y, pres, onProject, onToggleFav, onSaveToLibrary, onDelete, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 50)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle) }
  }, [onClose])

  const style = {
    position: 'fixed',
    top:  Math.min(y, window.innerHeight - 260),
    left: Math.min(x, window.innerWidth  - 220),
    zIndex: 9999,
  }

  const Sep = () => <div className="my-1 h-px bg-surface-muted dark:bg-dark-border mx-2" />

  const MI = ({ icon, label, onClick, danger }) => (
    <button onClick={() => { onClick(); onClose() }}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] font-medium transition-colors text-left',
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-slate-700 dark:text-slate-300 hover:bg-surface-soft dark:hover:bg-dark-card',
      )}>
      {icon && <span className="opacity-60 flex-shrink-0">{icon}</span>}
      {label}
    </button>
  )

  return (
    <div ref={ref} style={style}
      className="w-52 py-1.5 rounded-xl bg-white dark:bg-dark-surface border border-surface-muted dark:border-dark-border shadow-card-md">
      <div className="px-3 py-2 border-b border-surface-muted dark:border-dark-border mb-1">
        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{pres.name}</p>
        {pres.page_count > 0 && (
          <p className="text-[10px] text-slate-400 mt-0.5">{pres.page_count} slides</p>
        )}
      </div>
      <MI icon={<ProjectIcon />} label="Proyectar" onClick={onProject} />
      <MI icon={<SaveIcon />}    label="Guardar en biblioteca" onClick={onSaveToLibrary} />
      <Sep />
      <MI
        icon={
          <svg width="12" height="12" fill={pres.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        }
        label={pres.is_favorite ? 'Quitar de favoritos' : 'Marcar favorito'}
        onClick={onToggleFav}
      />
      <Sep />
      <MI icon={<TrashIcon />} label="Eliminar" onClick={onDelete} danger />
    </div>
  )
}

// ─── Thumbnail card con context menu ─────────────────────────────────────────
function PresentationCard({ pres, isActive, onClick, onDelete, onToggleFav, onSaveToLibrary, onProject }) {
  const [ctx, setCtx] = useState(null)

  const handleContextMenu = (e) => {
    e.preventDefault()
    setCtx({ x: e.clientX, y: e.clientY })
  }

  return (
    <>
      <div
        onClick={onClick}
        onContextMenu={handleContextMenu}
        className={cn(
          'group relative rounded-xl border cursor-pointer transition-all overflow-hidden',
          isActive
            ? 'border-brand-400 dark:border-brand-600 shadow-brand'
            : 'border-surface-muted dark:border-dark-border hover:border-brand-300 dark:hover:border-brand-700',
        )}
      >
        {/* Thumbnail */}
        <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden">
          {pres.thumbnail ? (
            <img src={pres.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <SlideIcon />
              <span className="text-[10px] font-mono">PDF</span>
            </div>
          )}
          {pres.page_count > 0 && (
            <span className="absolute bottom-1 right-1.5 font-mono text-[9px] font-bold bg-black/60 text-white/80 px-1.5 py-0.5 rounded">
              {pres.page_count} slides
            </span>
          )}
          {/* Favorito */}
          {pres.is_favorite ? (
            <span className="absolute top-1.5 left-1.5 text-amber-400">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </span>
          ) : null}
        </div>

        {/* Info */}
        <div className={cn(
          'p-2.5',
          isActive ? 'bg-brand-50 dark:bg-brand-950/30' : 'bg-white dark:bg-dark-surface',
        )}>
          <p className={cn('text-[12px] font-semibold truncate',
            isActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-800 dark:text-slate-200')}>
            {pres.name}
          </p>
        </div>

        {/* Botones hover */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={e => { e.stopPropagation(); onToggleFav() }}
            className={cn(
              'p-1 rounded-lg bg-black/40 hover:bg-black/60 transition-all',
              pres.is_favorite ? 'text-amber-400' : 'text-white/60 hover:text-amber-400',
            )}
          >
            <svg width="11" height="11" fill={pres.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="p-1 rounded-lg bg-black/40 text-white/70 hover:bg-red-500/80 hover:text-white transition-all"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {ctx && (
        <PresContextMenu
          x={ctx.x} y={ctx.y} pres={pres}
          onProject={onProject}
          onToggleFav={onToggleFav}
          onSaveToLibrary={onSaveToLibrary}
          onDelete={onDelete}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  )
}

// ─── Slide grid card ──────────────────────────────────────────────────────────
function SlideCard({ dataUrl, index, isActive, isLive, onClick, onProject }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all group',
        isLive   ? 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,.4)]' :
        isActive ? 'border-brand-500 shadow-brand scale-[1.02]' :
                   'border-transparent hover:border-brand-300 dark:hover:border-brand-700 hover:scale-[1.01]',
      )}
    >
      <div className="aspect-video bg-slate-900 relative overflow-hidden">
        {dataUrl
          ? <img src={dataUrl} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
          : <div className="absolute inset-0 flex items-center justify-center"><Spinner size={16} /></div>
        }
      </div>

      {/* Slide number */}
      <div className={cn(
        'absolute top-1.5 left-2 font-mono text-[9px] font-bold',
        isLive ? 'text-green-400' : isActive ? 'text-brand-400' : 'text-white/40',
      )}>
        {index + 1}
        {isLive && <span className="ml-1 animate-blink">● LIVE</span>}
      </div>

      {/* Project overlay */}
      <div
        onClick={e => { e.stopPropagation(); onProject() }}
        className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
      >
        <div className="bg-brand-600/90 text-white rounded-full p-2">
          <ProjectIcon />
        </div>
      </div>
    </div>
  )
}

// ─── Vista de proyección de presentación ──────────────────────────────────────
function PresentationProjector({ pres, onBack }) {
  const [slides, setSlides]     = useState([])   // array de dataURLs
  const [loading, setLoading]   = useState(true)
  const [progress, setProgress] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0)
  const [liveIdx,   setLiveIdx]   = useState(-1)
  const [error, setError]         = useState(null)
  const pdfRef = useRef(null)

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

  const goPrev = () => {
    const newIdx = Math.max(0, activeIdx - 1)
    setActiveIdx(newIdx)
    if (liveIdx >= 0) projectSlide(newIdx)
  }

  const goNext = () => {
    const newIdx = Math.min(slides.length - 1, activeIdx + 1)
    setActiveIdx(newIdx)
    if (liveIdx >= 0) projectSlide(newIdx)
  }

  // Teclado: ←→ navegan y proyectan, Home=primero, End=último
  useEffect(() => {
    const handler = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goNext() }
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); goPrev() }
      if (e.key === 'Enter' || e.key === ' ')               { e.preventDefault(); projectSlide(activeIdx) }
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
  }, [activeIdx, liveIdx, projectSlide, goNext, goPrev, slides])

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-2">Error al cargar la presentación</p>
          <p className="text-slate-400 text-sm">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={onBack}>Volver</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-surface-muted dark:border-dark-border flex-shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <BackIcon />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-slate-900 dark:text-white truncate">{pres.name}</p>
          <p className="text-[11px] text-slate-400">
            {loading ? `Cargando… ${progress}%` : `${slides.length} slides`}
            {liveIdx >= 0 && <span className="ml-2 text-green-500 font-semibold">● Slide {liveIdx + 1} en vivo</span>}
          </p>
        </div>
        <button
          onClick={() => { window.api?.presentations.clearSlide(); setLiveIdx(-1) }}
          className="text-[12px] font-semibold text-red-400 hover:text-red-600 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg transition-all"
        >
          Limpiar pantalla
        </button>
      </div>

      {/* Grid de slides */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading && slides.every(s => !s) ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <Spinner size={24} />
            <p className="text-slate-400 text-sm">Procesando slides… {progress}%</p>
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
      <div className="flex items-center gap-2 px-5 py-3 border-t border-surface-muted dark:border-dark-border flex-shrink-0">
        <button
          disabled={activeIdx <= 0}
          onClick={goPrev}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all flex-shrink-0',
            activeIdx <= 0
              ? 'border-surface-muted dark:border-dark-border text-slate-300 dark:text-slate-700 cursor-not-allowed'
              : 'border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20',
          )}
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Anterior
        </button>

        <button
          disabled={!slides[activeIdx]}
          onClick={() => projectSlide(activeIdx)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold text-white bg-brand-600 hover:bg-brand-700 transition-all shadow-brand hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none"
        >
          <ProjectIcon />
          Proyectar slide {activeIdx + 1}
        </button>

        <button
          disabled={activeIdx >= slides.length - 1}
          onClick={goNext}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold border transition-all flex-shrink-0',
            activeIdx >= slides.length - 1
              ? 'border-surface-muted dark:border-dark-border text-slate-300 dark:text-slate-700 cursor-not-allowed'
              : 'border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/20',
          )}
        >
          Siguiente
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <span className="text-[11px] text-slate-400 font-mono flex-shrink-0 ml-1">
          {activeIdx + 1} / {slides.length || '?'}
        </span>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function PresentationsPage() {
  const { refreshLibrary } = useApp()
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
    })
    refreshLibrary()
  }

  const handleProject = (pres) => {
    setActivePres(pres)
    setView('project')
  }

  if (view === 'project' && activePres) {
    return (
      <main className="flex-1 flex overflow-hidden">
        <PresentationProjector
          pres={activePres}
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
          <h2 className="font-extrabold text-xl text-slate-900 dark:text-white">Presentaciones</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Sube archivos PDF para proyectarlos slide a slide</p>
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
      <Card className="p-3 flex-shrink-0 border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
        <p className="text-[12px] text-amber-700 dark:text-amber-400">
          <strong>💡 Tip:</strong> Exporta tu presentación de PowerPoint, Keynote o Google Slides como PDF antes de importarla.
          <span className="ml-1 text-amber-600 dark:text-amber-500">Archivo → Exportar → PDF.</span>
        </p>
      </Card>

      {/* Grid de presentaciones */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : presentations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-soft dark:bg-dark-card flex items-center justify-center">
              <SlideIcon />
            </div>
            <p className="text-slate-400 text-sm text-center">
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