import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { cn } from '@shared/utils/cn.js'
import { Spinner } from '@shared/components/ui/index.jsx'
import { ConfirmModal } from '@shared/components/ConfirmModal.jsx'

// ─── Constantes ───────────────────────────────────────────────────────────────
const TABS = [
  { id: 'all',      label: 'Todos' },
  { id: 'color',    label: 'Color' },
  { id: 'gradient', label: 'Gradiente' },
  { id: 'image',    label: 'Imagen' },
  { id: 'gif',      label: 'GIF' },
  { id: 'video',    label: 'Video' },
]

const TYPE_LABELS = { color: 'Color', gradient: 'Gradiente', image: 'Imagen', gif: 'GIF', video: 'Video' }

const GRADIENT_PRESETS = [
  { name: 'Oscuro',       value: 'radial-gradient(ellipse at 50% 35%, #1c0a0a, #000)' },
  { name: 'Rojo',         value: 'radial-gradient(ellipse at 50% 30%, #4a0808, #1a0000)' },
  { name: 'Azul oscuro',  value: 'linear-gradient(135deg, #0a0a2e 0%, #000010 100%)' },
  { name: 'Verde oscuro', value: 'linear-gradient(135deg, #0a1e0a 0%, #000800 100%)' },
  { name: 'Púrpura',      value: 'linear-gradient(135deg, #1a0a2e 0%, #080010 100%)' },
  { name: 'Amanecer',     value: 'linear-gradient(180deg, #1a0a00 0%, #3d1a00 50%, #000 100%)' },
]

// ─── Iconos ───────────────────────────────────────────────────────────────────
const StarIcon    = ({ f }) => <svg width="12" height="12" fill={f ? 'currentColor':'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const TrashIcon   = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
const UploadIcon  = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
const PlusIcon    = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
const CheckIcon   = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
const XIcon       = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

// ─── Preview miniatura de un fondo ────────────────────────────────────────────
function BgPreview({ bg, size = 'md', className }) {
  const s = size === 'sm' ? { width: 40, height: 26 } : size === 'lg' ? { width: '100%', height: 120 } : { width: 64, height: 40 }

  const inner = (() => {
    if (bg.type === 'color' || bg.type === 'gradient' || bg.type === 'preset' || bg.type === 'css') {
      return <div style={{ ...s, borderRadius: 6, background: bg.value, flexShrink: 0 }} />
    }
    if (bg.type === 'image' || bg.type === 'gif') {
      const src = bg.thumbnail || bg.value
      return (
        <div style={{ ...s, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#111' }}>
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )
    }
    if (bg.type === 'video') {
      return (
        <div style={{ ...s, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {bg.thumbnail
            ? <img src={bg.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>
          }
        </div>
      )
    }
    return <div style={{ ...s, borderRadius: 6, background: '#111', flexShrink: 0 }} />
  })()

  return <div className={className}>{inner}</div>
}

// ─── Tarjeta de fondo ─────────────────────────────────────────────────────────
function BgCard({ bg, isActive, onSelect, onFav, onDelete }) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'group relative rounded-xl border-2 cursor-pointer transition-all overflow-hidden',
        isActive
          ? 'border-brand-500 shadow-brand'
          : 'border-transparent hover:border-brand-300 dark:hover:border-brand-700',
      )}
    >
      {/* Preview */}
      <div style={{ aspectRatio: '16/9', background: '#111', position: 'relative' }}>
        {(bg.type === 'color' || bg.type === 'gradient' || bg.type === 'css') && (
          <div style={{ position: 'absolute', inset: 0, background: bg.value }} />
        )}
        {(bg.type === 'image' || bg.type === 'gif') && (
          <img src={bg.thumbnail || bg.value} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {bg.type === 'video' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {bg.thumbnail
              ? <img src={bg.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14"/><rect x="2" y="6" width="13" height="12" rx="2"/></svg>
            }
          </div>
        )}

        {/* Active check */}
        {isActive && (
          <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center">
            <CheckIcon />
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onFav() }}
            className={cn('p-1 rounded-lg bg-black/50 transition-all', bg.is_favorite ? 'text-amber-400' : 'text-white/60 hover:text-amber-400')}
          >
            <StarIcon f={bg.is_favorite} />
          </button>
          {!bg.is_preset && (
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="p-1 rounded-lg bg-black/50 text-white/60 hover:text-red-400 transition-all"
            >
              <TrashIcon />
            </button>
          )}
        </div>

        {/* Type badge */}
        <div className="absolute bottom-1 left-1.5">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-white/70">
            {TYPE_LABELS[bg.type] ?? bg.type}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Editor de color ──────────────────────────────────────────────────────────
function ColorEditor({ onSave }) {
  const [name,  setName]  = useState('')
  const [color, setColor] = useState('#1a0a0a')
  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Mi color"
          className="w-full px-3 py-2 text-[13px] rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100" />
      </div>
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color</label>
        <div className="flex gap-3 items-center">
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            className="w-12 h-12 rounded-xl cursor-pointer border-0 outline-none bg-transparent" />
          <input value={color} onChange={e => setColor(e.target.value)} placeholder="#000000"
            className="flex-1 px-3 py-2 text-[13px] font-mono rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100" />
        </div>
      </div>
      <div className="rounded-xl overflow-hidden" style={{ height: 64, background: color }} />
      <button
        disabled={!name.trim()}
        onClick={() => onSave({ name: name.trim(), type: 'color', value: color })}
        className="w-full py-2 rounded-xl text-[13px] font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 transition-all"
      >
        Guardar color
      </button>
    </div>
  )
}

// ─── Editor de gradiente ──────────────────────────────────────────────────────
function GradientEditor({ onSave }) {
  const [name,    setName]    = useState('')
  const [type,    setType]    = useState('linear-gradient')
  const [angle,   setAngle]   = useState(135)
  const [color1,  setColor1]  = useState('#1c0a0a')
  const [color2,  setColor2]  = useState('#000000')
  const [custom,  setCustom]  = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const gradientCss = useCustom
    ? custom
    : type === 'linear-gradient'
      ? `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`
      : `radial-gradient(ellipse at 50% 35%, ${color1}, ${color2})`

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Mi gradiente"
          className="w-full px-3 py-2 text-[13px] rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100" />
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-surface-soft dark:bg-dark-card">
        {['linear-gradient','radial-gradient'].map(t => (
          <button key={t} onClick={() => setType(t)}
            className={cn('flex-1 py-1 rounded-md text-[11px] font-semibold transition-all',
              type === t ? 'bg-white dark:bg-dark-surface text-slate-900 dark:text-white shadow-sm' : 'text-slate-400')}>
            {t === 'linear-gradient' ? 'Lineal' : 'Radial'}
          </button>
        ))}
      </div>

      {!useCustom && (
        <>
          {type === 'linear-gradient' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ángulo: {angle}°</label>
              <input type="range" min="0" max="360" value={angle} onChange={e => setAngle(+e.target.value)} className="w-full" />
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color 1</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color1} onChange={e => setColor1(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <input value={color1} onChange={e => setColor1(e.target.value)} className="flex-1 px-2 py-1.5 text-[12px] font-mono rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100" />
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Color 2</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={color2} onChange={e => setColor2(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                <input value={color2} onChange={e => setColor2(e.target.value)} className="flex-1 px-2 py-1.5 text-[12px] font-mono rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100" />
              </div>
            </div>
          </div>
        </>
      )}

      <button onClick={() => setUseCustom(v => !v)}
        className="text-[11px] text-brand-500 hover:text-brand-600 font-semibold">
        {useCustom ? '← Usar editor visual' : 'Usar CSS personalizado →'}
      </button>

      {useCustom && (
        <textarea value={custom} onChange={e => setCustom(e.target.value)}
          placeholder="linear-gradient(135deg, #111 0%, #000 100%)"
          rows={2}
          className="w-full px-3 py-2 text-[12px] font-mono rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100 resize-none" />
      )}

      {/* Presets */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Presets rápidos</label>
        <div className="grid grid-cols-3 gap-1.5">
          {GRADIENT_PRESETS.map(p => (
            <button key={p.name} onClick={() => { setUseCustom(false); /* parse not needed */ setCustom(p.value); setUseCustom(true); setName(p.name) }}
              className="rounded-lg overflow-hidden border-2 border-transparent hover:border-brand-400 transition-all"
              title={p.name}>
              <div style={{ height: 36, background: p.value }} />
              <div className="text-[9px] text-center py-0.5 bg-surface-soft dark:bg-dark-card text-slate-500 truncate px-1">{p.name}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ height: 64, background: gradientCss }} />

      <button
        disabled={!name.trim() || !gradientCss.trim()}
        onClick={() => onSave({ name: name.trim(), type: 'gradient', value: gradientCss })}
        className="w-full py-2 rounded-xl text-[13px] font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-40 transition-all"
      >
        Guardar gradiente
      </button>
    </div>
  )
}

// ─── File Import — paso de confirmación ──────────────────────────────────────
function FileImportStep({ onConfirm, onCancel, importing }) {
  const [pendingFile, setPendingFile] = useState(null) // { name, type, previewSrc, filePath }
  const [customName,  setCustomName]  = useState('')
  const [picking,     setPicking]     = useState(false)

  const pickFile = async () => {
    setPicking(true)
    try {
      // Pedirle al main que abra el diálogo y devuelva metadatos sin guardar aún
      const result = await window.api?.backgrounds.pickFile()
      if (!result || result.error) return
      setPendingFile(result)
      setCustomName(result.name)
    } finally {
      setPicking(false)
    }
  }

  const confirm = async () => {
    if (!pendingFile) return
    await onConfirm({ ...pendingFile, customName: customName.trim() || pendingFile.name })
    setPendingFile(null)
    setCustomName('')
  }

  const cancel = () => {
    setPendingFile(null)
    setCustomName('')
    onCancel?.()
  }

  if (pendingFile) {
    return (
      <div className="space-y-3">
        {/* Preview */}
        <div className="rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          {(pendingFile.type === 'image' || pendingFile.type === 'gif') && pendingFile.previewSrc && (
            <img src={pendingFile.previewSrc} alt="" className="w-full h-full object-contain" />
          )}
          {pendingFile.type === 'video' && (
            <div className="w-full h-full flex items-center justify-center gap-2 text-white/40">
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.894L15 14"/>
                <rect x="2" y="6" width="13" height="12" rx="2"/>
              </svg>
              <span className="text-[12px] font-semibold">{pendingFile.filename}</span>
            </div>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Nombre</label>
          <input
            value={customName}
            onChange={e => setCustomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && confirm()}
            placeholder="Nombre para identificarlo…"
            className="w-full px-3 py-2 text-[13px] rounded-lg bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border outline-none focus:border-brand-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button onClick={cancel}
            className="flex-1 py-2 rounded-xl text-[13px] font-semibold border border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-surface-soft dark:hover:bg-dark-card transition-all">
            Cancelar
          </button>
          <button onClick={confirm} disabled={importing}
            className="flex-[2] py-2 rounded-xl text-[13px] font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-all">
            {importing ? 'Guardando…' : 'Guardar fondo'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <button
        onClick={pickFile}
        disabled={picking}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-4 rounded-xl',
          'border-2 border-dashed border-surface-muted dark:border-dark-border',
          'text-[13px] font-semibold text-slate-500 dark:text-slate-400',
          'hover:border-brand-400 hover:text-brand-500 transition-all',
          'disabled:opacity-50 disabled:pointer-events-none',
        )}
      >
        {picking ? <Spinner size={16} /> : <UploadIcon />}
        {picking ? 'Abriendo…' : 'Elegir archivo'}
      </button>
      <p className="text-[10px] text-slate-400 text-center">
        JPG · PNG · WEBP · GIF · MP4 · WEBM · MOV
      </p>
    </div>
  )
}

// ─── Panel principal ──────────────────────────────────────────────────────────
const MIN_GRID_H  = 120  // px mínimos para el grid
const MIN_EDITOR_H = 80  // px mínimos para el editor
const DEFAULT_EDITOR_H = 260

export function BackgroundsPanel({ onClose }) {
  const { activeBg, setActiveBg } = useApp()
  const [backgrounds,  setBackgrounds]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [activeTab,    setActiveTab]    = useState('all')
  const [editorTab,    setEditorTab]    = useState('color')
  const [importing,    setImporting]    = useState(false)
  const [confirmDel,   setConfirmDel]   = useState(null)
  const [editingId,    setEditingId]    = useState(null)
  const [editingName,  setEditingName]  = useState('')

  // Resizable split
  const [editorH,      setEditorH]      = useState(DEFAULT_EDITOR_H)
  const dragging    = useRef(false)
  const dragStart   = useRef({ y: 0, h: 0 })
  const panelRef    = useRef(null)

  // Drag handlers — declarar primero para que onDividerMouseDown pueda referenciarlos
  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return
    const delta  = dragStart.current.y - e.clientY
    const panelH = panelRef.current?.clientHeight ?? 600
    const newH   = Math.max(MIN_EDITOR_H, Math.min(panelH - MIN_GRID_H, dragStart.current.h + delta))
    setEditorH(newH)
  }, [])

  const onMouseUp = useCallback(() => {
    dragging.current = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup',   onMouseUp)
  }, [onMouseMove])

  const onDividerMouseDown = (e) => {
    e.preventDefault()
    dragging.current  = true
    dragStart.current = { y: e.clientY, h: editorH }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup',   onMouseUp)
  }

  // Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const filters = activeTab !== 'all' ? { type: activeTab } : {}
      const list    = await window.api?.backgrounds.findAll(filters) ?? []
      setBackgrounds(list)
    } finally { setLoading(false) }
  }, [activeTab])

  useEffect(() => { load() }, [load])

  const handleSelect = (bg) => {
    setActiveBg({ type: bg.type, value: bg.value, id: bg.id, name: bg.name, thumbnail: bg.thumbnail ?? null })
  }

  const handleFav = async (id) => {
    await window.api?.backgrounds.toggleFavorite(id)
    await load()
  }

  const handleDelete = (id) => setConfirmDel(id)

  const confirmDelete = async () => {
    await window.api?.backgrounds.delete(confirmDel)
    setConfirmDel(null)
    await load()
  }

  const handleSave = async (data) => {
    await window.api?.backgrounds.create(data)
    await load()
  }

  // Importar con confirmación
  const handleImportConfirm = async ({ filePath, type, customName, previewSrc }) => {
    setImporting(true)
    try {
      const result = await window.api?.backgrounds.importConfirmed({ filePath, name: customName, type, previewSrc })
      if (result?.error) { alert(result.error); return }
      if (result) {
        await load()
        // Cambiar al tab correspondiente
        if (type === 'image') setActiveTab('image')
        else if (type === 'gif') setActiveTab('gif')
        else if (type === 'video') setActiveTab('video')
      }
    } finally {
      setImporting(false)
    }
  }

  const handleRename = async (id) => {
    const name = editingName.trim()
    if (name) await window.api?.backgrounds.update(id, { name })
    setEditingId(null)
    setEditingName('')
    await load()
  }

  const isActiveBg = (bg) => activeBg?.id === bg.id || activeBg?.value === bg.value

  // Tabs de archivo — abrir editor tab al importar
  const FILE_TABS = ['image', 'gif', 'video']
  const isFileTab = FILE_TABS.includes(activeTab)

  return (
    <>
      <div className="fixed inset-0 z-[1000] bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      <div
        ref={panelRef}
        className={cn(
          'fixed top-[54px] right-0 bottom-0 z-[1001] w-[420px]',
          'bg-white dark:bg-dark-surface',
          'border-l border-surface-muted dark:border-dark-border',
          'flex flex-col overflow-hidden shadow-2xl',
        )}
        style={{ animation: 'slideInRight 0.2s cubic-bezier(.34,1.56,.64,1)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-muted dark:border-dark-border flex-shrink-0">
          <div>
            <h2 className="font-bold text-[15px] text-slate-900 dark:text-white">Fondos de proyección</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Fondo activo: <span className="text-brand-500 font-semibold">{activeBg?.name ?? 'Oscuro (predeterminado)'}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-surface-soft dark:hover:bg-dark-card transition-all">
            <XIcon />
          </button>
        </div>

        {/* Tabs de tipo */}
        <div className="flex gap-1 px-4 py-2.5 border-b border-surface-muted dark:border-dark-border overflow-x-auto flex-shrink-0 items-center">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={cn(
                'text-[11px] font-semibold px-3 py-1 rounded-full whitespace-nowrap transition-all flex-shrink-0',
                activeTab === t.id ? 'bg-brand-600 text-white' : 'bg-surface-soft dark:bg-dark-card text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}>
              {t.label}
            </button>
          ))}
          {/* Botón rápido de importar en tabs de archivo */}
          {isFileTab && (
            <button
              onClick={() => setEditorTab('file')}
              className="ml-auto flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 text-[11px] font-bold hover:bg-brand-100 transition-all"
              title="Importar archivo"
            >
              <UploadIcon /> Importar
            </button>
          )}
        </div>

        {/* ── Grid — área flexible (scroll independiente) ── */}
        <div className="overflow-y-auto p-4" style={{ flex: '1 1 auto', minHeight: MIN_GRID_H }}>
          {loading ? (
            <div className="flex justify-center py-8"><Spinner size={20} /></div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {backgrounds.map(bg => (
                <div key={bg.id} className="flex flex-col">
                  <BgCard
                    bg={bg}
                    isActive={isActiveBg(bg)}
                    onSelect={() => handleSelect(bg)}
                    onFav={() => handleFav(bg.id)}
                    onDelete={() => handleDelete(bg.id)}
                  />
                  {editingId === bg.id ? (
                    <input
                      autoFocus
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => handleRename(bg.id)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  handleRename(bg.id)
                        if (e.key === 'Escape') { setEditingId(null); setEditingName('') }
                      }}
                      className="mt-0.5 w-full px-2 py-1 text-[11px] font-semibold rounded-lg border border-brand-400 dark:border-brand-600 bg-white dark:bg-dark-card outline-none text-slate-900 dark:text-slate-100"
                    />
                  ) : (
                    <div
                      onDoubleClick={() => { setEditingId(bg.id); setEditingName(bg.name) }}
                      title="Doble clic para renombrar"
                      className={cn(
                        'px-2 py-1 text-[11px] font-semibold truncate cursor-text -mt-px',
                        isActiveBg(bg)
                          ? 'bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                          : 'bg-white dark:bg-dark-surface text-slate-700 dark:text-slate-300 hover:bg-surface-soft dark:hover:bg-dark-card',
                      )}
                    >
                      {bg.name}
                    </div>
                  )}
                </div>
              ))}
              {backgrounds.length === 0 && (
                <div className="col-span-2 flex flex-col items-center justify-center py-8 gap-2 text-slate-400">
                  <p className="text-sm">No hay fondos en esta categoría</p>
                  {isFileTab && (
                    <button
                      onClick={() => setEditorTab('file')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 transition-all"
                    >
                      <UploadIcon /> Importar archivo
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Divider arrastrable ── */}
        <div
          onMouseDown={onDividerMouseDown}
          className="flex-shrink-0 h-[6px] flex items-center justify-center cursor-ns-resize group bg-surface-muted dark:bg-dark-border hover:bg-brand-200 dark:hover:bg-brand-900 transition-colors"
          title="Arrastra para redimensionar"
        >
          <div className="w-8 h-0.5 rounded-full bg-slate-300 dark:bg-slate-600 group-hover:bg-brand-400 dark:group-hover:bg-brand-500 transition-colors" />
        </div>

        {/* ── Editor (altura fija, resizable) ── */}
        <div
          className="flex-shrink-0 bg-white dark:bg-dark-surface border-t border-surface-muted dark:border-dark-border flex flex-col overflow-hidden"
          style={{ height: editorH }}
        >
          {/* Tabs del editor */}
          <div className="flex border-b border-surface-muted dark:border-dark-border flex-shrink-0">
            {[
              { id: 'color',    label: '+ Color' },
              { id: 'gradient', label: '+ Gradiente' },
              { id: 'file',     label: '+ Archivo' },
            ].map(t => (
              <button key={t.id} onClick={() => setEditorTab(t.id)}
                className={cn(
                  'flex-1 py-2.5 text-[12px] font-semibold transition-all',
                  editorTab === t.id
                    ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-600 dark:border-brand-400'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
                )}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Contenido del editor — scroll propio */}
          <div className="flex-1 overflow-y-auto p-4">
            {editorTab === 'color'    && <ColorEditor    onSave={handleSave} />}
            {editorTab === 'gradient' && <GradientEditor onSave={handleSave} />}
            {editorTab === 'file'     && (
              <FileImportStep
                importing={importing}
                onConfirm={handleImportConfirm}
                onCancel={() => {}}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!confirmDel}
        title="Eliminar fondo"
        message="¿Eliminar este fondo? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDel(null)}
      />

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}