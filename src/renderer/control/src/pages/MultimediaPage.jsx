import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Spinner, Slider } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'
import { ConfirmModal } from '@shared/components/ConfirmModal.jsx'
import { ContextMenu } from '@shared/components/ContextMenu.jsx'

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
const SaveIcon    = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>

const TYPE_LABELS = { image: 'Imagen', gif: 'GIF', video: 'Video' }

// ─── Thumbnail card con context menu ─────────────────────────────────────────
function MediaCard({ item, isLiveItem, onClick, onDelete, onToggleFav, onProject, onSaveToLibrary }) {
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
          'group relative rounded-panel border cursor-pointer transition-all overflow-hidden',
          isLiveItem
            ? 'border-live-500 shadow-[0_0_12px_rgb(255_59_48/.35)]'
            : 'border-line-1 hover:border-primary-500/40',
        )}
      >
        <div className="aspect-video bg-neutral-950 flex items-center justify-center relative overflow-hidden">
          {item.thumbnail ? (
            <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-neutral-600">
              <VideoIcon />
              <span className="text-[10px] font-mono uppercase">{item.type}</span>
            </div>
          )}
          <span className="absolute bottom-1 right-1.5 font-mono text-[9px] font-bold bg-black/60 text-white/80 px-1.5 py-0.5 rounded-[3px] uppercase">
            {item.type}
          </span>
          {isLiveItem && (
            <span className="absolute top-1.5 right-1.5 flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-[0.5px] text-live-500 group-hover:opacity-0 transition-opacity">
              <span className="w-1.5 h-1.5 rounded-full bg-live-500 animate-blink" /> Live
            </span>
          )}
          {item.is_favorite ? (
            <span className="absolute top-1.5 left-1.5 text-warn-400">
              <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </span>
          ) : null}
        </div>

        <div className="p-2.5 bg-surface-1">
          <p className="text-[12px] font-semibold truncate text-ink-1">
            {item.name}
          </p>
        </div>

        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={e => { e.stopPropagation(); onToggleFav() }}
            className={cn(
              'p-1 rounded-btn bg-black/40 hover:bg-black/60 transition-all',
              item.is_favorite ? 'text-warn-400' : 'text-white/60 hover:text-warn-400',
            )}
          >
            <svg width="11" height="11" fill={item.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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
        title={`${item.name} · ${TYPE_LABELS[item.type]}`}
        items={[
          { icon: <ProjectIcon />, label: 'Proyectar', onClick: onProject },
          { icon: <SaveIcon />,    label: 'Guardar en biblioteca', onClick: onSaveToLibrary },
          'sep',
          {
            icon: (
              <svg width="12" height="12" fill={item.is_favorite ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            ),
            label: item.is_favorite ? 'Quitar de favoritos' : 'Marcar favorito',
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

// ─── Reproductor de video (vista del operador) ────────────────────────────────
function VideoPlayer({ item, isLive, onBack, onProject, onClear, onSaveToLibrary }) {
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
    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
      <div className="flex items-center gap-3 px-5 py-3 border-b border-line-1 bg-surface-1 flex-shrink-0">
        <button onClick={onBack} className="text-ink-4 hover:text-ink-1 transition-colors">
          <BackIcon />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-ink-1 truncate">{item.name}</p>
          {isLive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-[1px] text-live-500">
              <span className="w-1.5 h-1.5 rounded-full bg-live-500 animate-blink" /> En vivo
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={onSaveToLibrary}>
          <SaveIcon /> Guardar en biblioteca
        </Button>
        <Button variant="danger" size="sm" onClick={onClear}>
          Limpiar pantalla
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center p-6 bg-neutral-950">
        <video
          ref={videoRef}
          src={item.path}
          muted={isLive}
          className="max-w-full max-h-full rounded-lg"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={e => setCurrent(e.target.currentTime)}
          onLoadedMetadata={e => { setDuration(e.target.duration); e.target.volume = volume }}
        />
      </div>

      <div className="flex flex-col gap-2 px-5 py-3 border-t border-line-1 bg-surface-1 flex-shrink-0">
        <Slider
          min={0} max={duration || 0} step={0.1} value={current}
          onChange={handleSeek}
        />
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="p-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white transition-all"
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <span className="text-[11px] text-ink-3 font-mono tabular-nums">{fmt(current)} / {fmt(duration)}</span>

          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-ink-4"><VolumeIcon /></span>
            <Slider min={0} max={1} step={0.05} value={volume} onChange={handleVolume} className="w-20" />
          </div>

          <Button
            className="ml-auto"
            onClick={() => onProject({ startAt: videoRef.current?.currentTime ?? 0, paused: videoRef.current?.paused ?? false })}
            disabled={isLive}
          >
            <ProjectIcon /> {isLive ? 'Proyectando' : 'Proyectar'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export function MultimediaPage() {
  const { pendingSelection, clearPendingSelection, refreshLibrary, clearSignal } = useApp()
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

  const handleSaveToLibrary = async (item) => {
    await window.api?.library.create({
      title:   item.name,
      content: item.name,
      type:    'media',
      ref:     { mediaId: item.id, mediaType: item.type },
    })
    await refreshLibrary()
  }

  const doProject = (item, { startAt, paused } = {}) => {
    window.api?.multimedia.project({ id: item.id, type: item.type, url: item.path, name: item.name, startAt, paused })
    setLiveId(item.id)
  }

  const handleCardClick = (item) => {
    if (item.type === 'video') { setActiveItem(item); return }
    doProject(item)
  }

  // ── Deep-link del buscador global ──────────────────────────────────────────
  // Espera a que `items` esté cargado; se proyecta siempre el contenido real
  // (imagen/GIF/video), y los videos además abren el reproductor con controles.
  useEffect(() => {
    if (pendingSelection?.type !== 'media' || loading) return
    const item = items.find(i => i.id === pendingSelection.payload.mediaId)
    if (item) {
      doProject(item)
      if (item.type === 'video') setActiveItem(item)
    }
    clearPendingSelection()
  }, [pendingSelection, items, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClear = () => {
    window.api?.multimedia.clear()
    setLiveId(null)
  }

  // La señal de limpieza global (CLEAR ALL del transport) apaga el indicador local
  useEffect(() => { setLiveId(null) }, [clearSignal])

  if (activeItem) {
    return (
      <main className="flex-1 flex overflow-hidden min-h-0">
        <VideoPlayer
          item={activeItem}
          isLive={liveId === activeItem.id}
          onBack={() => setActiveItem(null)}
          onProject={(sync) => doProject(activeItem, sync)}
          onClear={handleClear}
          onSaveToLibrary={() => handleSaveToLibrary(activeItem)}
        />
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col overflow-hidden p-5 gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="font-extrabold text-xl text-ink-1">Multimedia</h2>
          <p className="text-[12px] text-ink-3 mt-0.5">Sube imágenes, GIFs y videos para proyectarlos al instante</p>
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
            <div className="w-16 h-16 rounded-card bg-surface-3 text-ink-3 flex items-center justify-center">
              <ImageIcon />
            </div>
            <p className="text-ink-4 text-sm text-center">
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
                isLiveItem={liveId === item.id}
                onClick={() => handleCardClick(item)}
                onDelete={() => handleDelete(item.id)}
                onToggleFav={() => handleToggleFav(item.id)}
                onProject={() => (item.type === 'video' ? setActiveItem(item) : doProject(item))}
                onSaveToLibrary={() => handleSaveToLibrary(item)}
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
