import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, SectionLabel, Spinner } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'
import { ConfirmModal } from '@shared/components/ConfirmModal.jsx'

// ─── Iconos ───────────────────────────────────────────────────────────────────
const UploadIcon  = () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const TrashIcon   = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const ProjectIcon = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const BackIcon    = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const ImageIcon   = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
const VideoIcon   = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
const PlayIcon    = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const PauseIcon   = () => <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const VolumeIcon  = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>

const TYPE_LABELS = { image: 'Imagen', gif: 'GIF', video: 'Video' }

// ─── Menú contextual ──────────────────────────────────────────────────────────
function MediaContextMenu({ x, y, item, onProject, onToggleFav, onDelete, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 50)
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handle) }
  }, [onClose])

  const style = {
    position: 'fixed',
    top:  Math.min(y, window.innerHeight - 240),
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
        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{item.name}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{TYPE_LABELS[item.type]}</p>
      </div>
      <MI icon={<ProjectIcon />} label="Proyectar" onClick={onProject} />
      <Sep />
      <MI
        icon={
          <svg width="12" height="12" fill={item.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        }
        label={item.is_favorite ? 'Quitar de favoritos' : 'Marcar favorito'}
        onClick={onToggleFav}
      />
      <Sep />
      <MI icon={<TrashIcon />} label="Eliminar" onClick={onDelete} danger />
    </div>
  )
}

// ─── Thumbnail card con context menu ─────────────────────────────────────────
function MediaCard({ item, onClick, onDelete, onToggleFav, onProject }) {
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
        className="group relative rounded-xl border border-surface-muted dark:border-dark-border hover:border-brand-300 dark:hover:border-brand-700 cursor-pointer transition-all overflow-hidden"
      >
        <div className="aspect-video bg-slate-900 flex items-center justify-center relative overflow-hidden">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <VideoIcon />
              <span className="text-[10px] font-mono uppercase">{item.type}</span>
            </div>
          )}
          <span className="absolute bottom-1 right-1.5 font-mono text-[9px] font-bold bg-black/60 text-white/80 px-1.5 py-0.5 rounded uppercase">
            {item.type}
          </span>
          {item.is_favorite ? (
            <span className="absolute top-1.5 left-1.5 text-amber-400">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </span>
          ) : null}
        </div>

        <div className="p-2.5 bg-white dark:bg-dark-surface">
          <p className="text-[12px] font-semibold truncate text-slate-800 dark:text-slate-200">
            {item.name}
          </p>
        </div>

        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={e => { e.stopPropagation(); onToggleFav() }}
            className={cn(
              'p-1 rounded-lg bg-black/40 hover:bg-black/60 transition-all',
              item.is_favorite ? 'text-amber-400' : 'text-white/60 hover:text-amber-400',
            )}
          >
            <svg width="11" height="11" fill={item.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
        <MediaContextMenu
          x={ctx.x} y={ctx.y} item={item}
          onProject={onProject}
          onToggleFav={onToggleFav}
          onDelete={onDelete}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  )
}

// ─── Reproductor de video (vista del operador) ────────────────────────────────
function VideoPlayer({ item, isLive, onBack, onProject, onClear }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  const sendControl = useCallback((action, value) => {
    if (!isLive) return
    window.api?.multimedia.mediaControl({ action, value })
  }, [isLive])

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) { v.play(); sendControl('play') }
    else          { v.pause(); sendControl('pause') }
  }

  const handleSeek = (e) => {
    const value = Number(e.target.value)
    if (videoRef.current) videoRef.current.currentTime = value
    sendControl('seek', value)
  }

  const handleVolume = (e) => {
    const value = Number(e.target.value)
    setVolume(value)
    if (videoRef.current) videoRef.current.volume = value
    sendControl('volume', value)
  }

  const fmt = (s) => {
    if (!Number.isFinite(s)) return '0:00'
    const m = Math.floor(s / 60), sec = Math.floor(s % 60)
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-surface-muted dark:border-dark-border flex-shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <BackIcon />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-slate-900 dark:text-white truncate">{item.name}</p>
          {isLive && <span className="text-[11px] text-green-500 font-semibold">● En vivo</span>}
        </div>
        <button
          onClick={onClear}
          className="text-[12px] font-semibold text-red-400 hover:text-red-600 border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg transition-all"
        >
          Limpiar pantalla
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-950">
        <video
          ref={videoRef}
          src={item.path}
          className="max-w-full max-h-full rounded-lg"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={e => setCurrent(e.target.currentTime)}
          onLoadedMetadata={e => { setDuration(e.target.duration); e.target.volume = volume }}
        />
      </div>

      <div className="flex flex-col gap-2 px-5 py-3 border-t border-surface-muted dark:border-dark-border flex-shrink-0">
        <input
          type="range" min={0} max={duration || 0} step={0.1} value={current}
          onChange={handleSeek}
          className="w-full accent-brand-600"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white transition-all"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <span className="text-[11px] text-slate-400 font-mono">{fmt(current)} / {fmt(duration)}</span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400"><VolumeIcon /></span>
            <input type="range" min={0} max={1} step={0.05} value={volume} onChange={handleVolume} className="w-20 accent-brand-600" />
          </div>

          <Button className="ml-auto" onClick={onProject} disabled={isLive}>
            <ProjectIcon /> {isLive ? 'Proyectando' : 'Proyectar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function MultimediaPage() {
  const { pendingSelection, clearPendingSelection } = useApp()
  const [items,        setItems]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [importing,    setImporting]    = useState(false)
  const [activeItem,   setActiveItem]   = useState(null)
  const [liveId,       setLiveId]       = useState(null)
  const [confirmModal, setConfirmModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const list = await window.api?.multimedia.findAll() ?? []
      setItems(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleImport = async () => {
    setImporting(true)
    try {
      const result = await window.api?.multimedia.import()
      if (result?.error) { alert(result.error); return }
      if (result) await load()
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = (id) => {
    setConfirmModal({
      message: '¿Eliminar este archivo? Se eliminará de la biblioteca.',
      onConfirm: async () => {
        setConfirmModal(null)
        await window.api?.multimedia.delete(id)
        if (activeItem?.id === id) { setActiveItem(null); if (liveId === id) setLiveId(null) }
        await load()
      },
    })
  }

  const handleToggleFav = async (id) => {
    const updated = await window.api?.multimedia.toggleFavorite(id)
    if (updated) setItems(prev => prev.map(m => m.id === id ? { ...m, is_favorite: updated.is_favorite } : m))
  }

  const doProject = (item) => {
    window.api?.multimedia.project({ id: item.id, type: item.type, url: item.path, name: item.name })
    setLiveId(item.id)
  }

  const handleCardClick = (item) => {
    if (item.type === 'video') { setActiveItem(item); return }
    doProject(item)
  }

  // ── Deep-link del buscador global ──────────────────────────────────────────
  // Espera a que `items` esté cargado; videos abren el reproductor,
  // imágenes/GIFs se proyectan directo (mismo comportamiento que el clic).
  useEffect(() => {
    if (pendingSelection?.type !== 'media' || loading) return
    const item = items.find(i => i.id === pendingSelection.payload.mediaId)
    if (item) handleCardClick(item)
    clearPendingSelection()
  }, [pendingSelection, items, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    window.api?.multimedia.clear()
    setLiveId(null)
  }

  if (activeItem) {
    return (
      <main className="flex-1 flex overflow-hidden">
        <VideoPlayer
          item={activeItem}
          isLive={liveId === activeItem.id}
          onBack={() => setActiveItem(null)}
          onProject={() => doProject(activeItem)}
          onClear={handleClear}
        />
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden p-5 gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-extrabold text-xl text-slate-900 dark:text-white">Multimedia</h2>
          <p className="text-[12px] text-slate-400 mt-0.5">Sube imágenes, GIFs y videos para proyectarlos al instante</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => window.api?.multimedia.openDir()}>
            Abrir carpeta
          </Button>
          <Button size="md" onClick={handleImport} disabled={importing}>
            {importing ? <Spinner size={14} className="text-white" /> : <UploadIcon />}
            {importing ? 'Importando…' : 'Importar archivo'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={24} /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-surface-soft dark:bg-dark-card flex items-center justify-center">
              <ImageIcon />
            </div>
            <p className="text-slate-400 text-sm text-center">
              No hay archivos multimedia aún.<br/>
              Importa una imagen, GIF o video para empezar.
            </p>
            <Button onClick={handleImport} disabled={importing}>
              <UploadIcon /> Importar archivo
            </Button>
          </div>
        ) : (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
            {items.map(item => (
              <MediaCard
                key={item.id}
                item={item}
                onClick={() => handleCardClick(item)}
                onDelete={() => handleDelete(item.id)}
                onToggleFav={() => handleToggleFav(item.id)}
                onProject={() => (item.type === 'video' ? setActiveItem(item) : doProject(item))}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmModal}
        title="Eliminar archivo"
        message={confirmModal?.message}
        confirmLabel="Eliminar"
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </main>
  )
}
