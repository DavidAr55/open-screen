import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, Input, Select, FieldLabel, Spinner, SegmentedControl } from '@shared/components/ui/index.jsx'
import { DEFAULT_BG } from '@shared/constants/defaultBackground.js'
import { watermarkPreviewStyle } from '@shared/constants/watermark.js'
import { buildFontFamily } from '@shared/utils/font.js'
import { cn } from '@shared/utils/cn.js'
import { ConfirmModal } from '@shared/components/ConfirmModal.jsx'
import { ContextMenu } from '@shared/components/ContextMenu.jsx'
import { SlideCanvas } from '@shared/components/SlideCanvas.jsx'
import { PptxImportView } from '../components/songs/PptxImportView.jsx'

// ─── Constantes ───────────────────────────────────────────────────────────────
const SECTION_TYPES = [
  { value: 'intro',      label: 'Intro',    color: 'bg-surface-3 text-ink-3' },
  { value: 'verse',      label: 'Verso',    color: 'bg-blue-500/10 text-blue-500' },
  { value: 'pre-chorus', label: 'Pre-Coro', color: 'bg-purple-500/10 text-purple-500' },
  { value: 'chorus',     label: 'Coro',     color: 'bg-primary-500/15 text-primary-500' },
  { value: 'bridge',     label: 'Puente',   color: 'bg-amber-500/10 text-amber-500' },
  { value: 'tag',        label: 'Tag',      color: 'bg-emerald-500/10 text-emerald-500' },
  { value: 'outro',      label: 'Outro',    color: 'bg-surface-3 text-ink-3' },
  { value: 'custom',     label: 'Custom',   color: 'bg-rose-500/10 text-rose-500' },
]

const KEYS = [
  'C','C#','D','D#','E','F','F#','G','G#','A','A#','B',
  'Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getSectionMeta = (type) =>
  SECTION_TYPES.find(s => s.value === type) ?? SECTION_TYPES[1]

const buildDefaultLabel = (type, sections) => {
  const count = sections.filter(s => s.type === type).length + 1
  const meta = getSectionMeta(type)
  return `${meta.label}${count > 1 ? ` ${count}` : ''}`
}

const ipc = {
  songs: {
    findAll:        (f)    => window.api?.songs?.findAll(f) ?? Promise.resolve([]),
    findById:       (id)   => window.api?.songs?.findById(id) ?? Promise.resolve(null),
    create:         (d)    => window.api?.songs?.create(d) ?? Promise.resolve(null),
    update:         (id,d) => window.api?.songs?.update(id, d) ?? Promise.resolve(null),
    delete:         (id)   => window.api?.songs?.delete(id) ?? Promise.resolve(false),
    toggleFavorite: (id)   => window.api?.songs?.toggleFavorite(id) ?? Promise.resolve(null),
    getArtists:     ()     => window.api?.songs?.getArtists() ?? Promise.resolve([]),
  }
}

/**
 * Construye el array de secciones completo incluyendo el slide de título
 * como primer elemento (idx 0). No se almacena en DB — se genera dinámicamente.
 */
function buildAllSections(song) {
  const metaParts = [
    song.artist,
    song.key_sig ? `Tono: ${song.key_sig}` : null,
    song.tempo ? `${song.tempo} BPM` : null,
    song.copyright ? `© ${song.copyright}` : null,
  ].filter(Boolean)

  const titleSlide = {
    _isTitleSlide: true,
    type: 'title',
    label: 'Título',
    lyrics: (song.title ?? '').toUpperCase(),
    _meta: metaParts.join(' · '),
  }

  return [titleSlide, ...(song.sections ?? [])]
}

// ─── Iconos ───────────────────────────────────────────────────────────────────
const PlusIcon    = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
const TrashIcon   = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
const ProjectIcon = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const StarIcon    = ({ filled }) => <svg width="13" height="13" fill={filled ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
const EditIcon    = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const UpIcon      = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m18 15-6-6-6 6"/></svg>
const DownIcon    = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6"/></svg>
const MusicIcon   = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
const SaveIcon    = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const PanelIcon   = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
const ChevronRightIcon = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><polyline points="9 6 15 12 9 18"/></svg>
const UploadIcon  = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>

// ─── SectionBadge ─────────────────────────────────────────────────────────────
function SectionBadge({ type, active, className }) {
  if (type === 'title') {
    return (
      <span className={cn(
        'text-[9px] font-mono font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-[3px] flex-shrink-0',
        active ? 'bg-white/20 text-white' : 'bg-surface-3 text-ink-2',
        className,
      )}>
        Título
      </span>
    )
  }

  const meta = getSectionMeta(type)
  return (
    <span className={cn(
      'text-[9px] font-mono font-semibold uppercase tracking-[0.5px] px-1.5 py-0.5 rounded-[3px] flex-shrink-0',
      active ? 'bg-white/20 text-white' : meta.color,
      className,
    )}>
      {meta.label}
    </span>
  )
}

// ─── SectionSlide (en vista detalle) ──────────────────────────────────────────
function SectionSlide({ section, isActive, isLiveSlide, onClick, onProject }) {
  const { projectionClickMode } = useApp()
  const clickTimer = useRef(null)

  const handleClick = () => {
    onClick()
    if (projectionClickMode === 'single') {
      onProject()
      return
    }
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onProject()
    } else {
      clickTimer.current = setTimeout(() => { clickTimer.current = null }, 220)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group flex items-start gap-2 p-2.5 rounded-panel border cursor-pointer transition-all',
        isActive
          ? 'bg-primary-500/10 border-primary-500/50'
          : 'bg-surface-1 border-line-1 hover:border-primary-500/30',
      )}
      title={projectionClickMode === 'single' ? 'Clic: proyectar' : 'Doble clic: proyectar'}
    >
      <SectionBadge type={section.type} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-ink-2 truncate">
          {isLiveSlide && <span className="inline-block w-1.5 h-1.5 rounded-full bg-live-500 animate-blink mr-1 align-middle" title="En vivo" />}
          {section.label}
        </p>
        <p className="text-[11px] text-ink-4 truncate mt-0.5">
          {section._isTitleSlide ? (section._meta || '—') : (section.lyrics || '').split('\n')[0]}
        </p>
      </div>
    </div>
  )
}

// ─── Auto-grow textarea ───────────────────────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 80)}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2.5 text-[13px] leading-relaxed font-mono',
        'bg-transparent border-0 outline-none resize-none',
        'text-ink-1 placeholder:text-ink-4',
        className,
      )}
      style={{ minHeight: 80, overflow: 'hidden' }}
    />
  )
}

// ─── Editor de canción (rediseñado) ──────────────────────────────────────────
let _uidCounter = 0
const newUid = () => `s_${++_uidCounter}`

// Asegurar que cada sección tenga un _uid estable
const withUids = (arr) => arr.map(s => s._uid ? s : { ...s, _uid: newUid() })

function SongEditor({ song, onSave, onCancel }) {
  const [title, setTitle] = useState(song?.title ?? '')
  const [artist, setArtist] = useState(song?.artist ?? '')
  const [keySig, setKeySig] = useState(song?.key_sig ?? '')
  const [sections, setSections] = useState(() =>
    withUids(
      song?.sections?.length > 0
        ? song.sections
        : [{ type: 'verse', label: 'Verso 1', lyrics: '' }]
    )
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const [dragFrom, setDragFrom]     = useState(null)
  const [dragOver, setDragOver]     = useState(null)
  // IDs de secciones que acaban de moverse — para flash de animación
  const [flashIds, setFlashIds]     = useState(new Set())
  const sectionsEndRef = useRef(null)

  const flash = (...uids) => {
    setFlashIds(new Set(uids))
    setTimeout(() => setFlashIds(new Set()), 500)
  }

  const addSection = (type = 'verse') => {
    const label = buildDefaultLabel(type, sections)
    const uid   = newUid()
    setSections(prev => [...prev, { type, label, lyrics: '', _uid: uid }])
    setTimeout(() => sectionsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50)
  }

  const updateSection = (index, field, value) =>
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))

  const removeSection = (index) =>
    setSections(prev => prev.filter((_, i) => i !== index))

  const moveSection = (index, dir) => {
    const arr  = [...sections]
    const swap = dir === 'up' ? index - 1 : index + 1
    if (swap < 0 || swap >= arr.length) return
    ;[arr[index], arr[swap]] = [arr[swap], arr[index]]
    setSections(arr)
    flash(arr[index]._uid, arr[swap]._uid)
  }

  const handleDrop = (toIndex) => {
    if (dragFrom === null || dragFrom === toIndex) return
    const arr = [...sections]
    const [moved] = arr.splice(dragFrom, 1)
    arr.splice(toIndex, 0, moved)
    setSections(arr)
    setDragFrom(null)
    setDragOver(null)
    // Solo flashear el elemento que se movió
    flash(moved._uid)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      setError('El título es obligatorio')
      return
    }

    setError(null)
    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        artist: artist.trim(),
        key_sig: keySig,
        sections,
      })
    } catch (e) {
      console.error('[SongEditor]', e)
      setError('Error al guardar. Revisa la consola.')
      setSaving(false)
    }
  }

  const QUICK_ADD = ['verse', 'chorus', 'pre-chorus', 'bridge', 'intro', 'outro', 'tag', 'custom']

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header: metadatos ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-line-1 bg-surface-1">
        <div className="flex gap-4 items-end">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Nombre de la canción"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(null) }}
              className={cn(
                'w-full text-2xl font-extrabold bg-transparent outline-none',
                'text-ink-1 placeholder:text-ink-4',
                'border-b-2 pb-1 transition-colors',
                error && !title.trim()
                  ? 'border-live-400'
                  : 'border-transparent focus:border-primary-500',
              )}
            />
            {error && <p className="text-[11px] text-live-500 mt-1">{error}</p>}
          </div>

          <div className="w-52 flex-shrink-0">
            <p className="text-[10px] font-mono font-medium text-ink-4 uppercase tracking-[1.2px] mb-1">Artista / Autor</p>
            <input
              type="text"
              placeholder="Artista"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              className={cn(
                'w-full text-[14px] font-medium bg-transparent outline-none',
                'text-ink-2 placeholder:text-ink-4',
                'border-b border-line-1 focus:border-primary-500 pb-0.5 transition-colors',
              )}
            />
          </div>

          <div className="flex-shrink-0">
            <p className="text-[10px] font-mono font-medium text-ink-4 uppercase tracking-[1.2px] mb-1">Tono</p>
            <select
              value={keySig}
              onChange={e => setKeySig(e.target.value)}
              className={cn(
                'text-[13px] font-mono font-bold bg-transparent outline-none cursor-pointer',
                'text-ink-2 border-b border-line-1',
                'focus:border-primary-500 pb-0.5 pr-2 transition-colors',
              )}
            >
              <option value="">—</option>
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Área de secciones (scroll independiente) ──────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {sections.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-ink-4">
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <p className="text-sm">Usa los botones de abajo para añadir secciones</p>
          </div>
        )}

        {sections.map((section, i) => {
          const meta      = getSectionMeta(section.type)
          const isFlash   = flashIds.has(section._uid)
          const isDragged = dragFrom === i
          const isTarget  = dragOver === i && dragFrom !== i
          return (
            <div
              key={section._uid}
              draggable
              onDragStart={() => setDragFrom(i)}
              onDragOver={e => { e.preventDefault(); setDragOver(i) }}
              onDrop={() => handleDrop(i)}
              onDragEnd={() => { setDragFrom(null); setDragOver(null) }}
              className={cn(
                'rounded-card border overflow-hidden',
                'transition-[border-color,box-shadow,transform,opacity] duration-200',
                isTarget  && 'border-primary-400 shadow-card-md scale-[1.01]',
                isDragged && 'opacity-30 scale-[0.98]',
                isFlash   && !isDragged && !isTarget && 'animate-section-flash border-primary-400',
                !isTarget && !isDragged && !isFlash && 'border-line-1',
                'bg-surface-1',
              )}
            >
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <span className="flex-shrink-0 text-ink-4 cursor-grab active:cursor-grabbing">
                  <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                    <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
                    <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
                    <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
                  </svg>
                </span>

                <select
                  value={section.type}
                  onChange={e => {
                    const newType = e.target.value
                    const newLabel = buildDefaultLabel(newType, sections.filter((_, idx) => idx !== i))
                    updateSection(i, 'type', newType)
                    updateSection(i, 'label', newLabel)
                  }}
                  className={cn(
                    'text-[10px] font-mono font-semibold uppercase tracking-[0.5px] px-2 py-1 rounded-[3px] border-0 outline-none cursor-pointer',
                    meta.color,
                  )}
                >
                  {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>

                <input
                  type="text"
                  value={section.label}
                  onChange={e => updateSection(i, 'label', e.target.value)}
                  placeholder="Etiqueta"
                  className={cn(
                    'flex-1 text-[13px] font-semibold bg-transparent outline-none',
                    'text-ink-2 placeholder:text-ink-4',
                    'border-b border-transparent focus:border-line-2',
                  )}
                />

                <div className="flex items-center gap-0.5 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveSection(i, 'up')}
                    disabled={i === 0}
                    title="Subir"
                    className="p-1.5 rounded-btn hover:bg-surface-3 text-ink-3 disabled:opacity-20 transition-all"
                  >
                    <UpIcon />
                  </button>
                  <button
                    onClick={() => moveSection(i, 'down')}
                    disabled={i === sections.length - 1}
                    title="Bajar"
                    className="p-1.5 rounded-btn hover:bg-surface-3 text-ink-3 disabled:opacity-20 transition-all"
                  >
                    <DownIcon />
                  </button>
                  <button
                    onClick={() => removeSection(i)}
                    title="Eliminar sección"
                    className="p-1.5 rounded-btn hover:bg-live-500/10 text-ink-4 hover:text-live-500 transition-all"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              <div className="mx-3 h-px bg-line-1" />

              <AutoTextarea
                value={section.lyrics}
                onChange={e => updateSection(i, 'lyrics', e.target.value)}
                placeholder={`Letra del ${meta.label.toLowerCase()}…`}
              />
            </div>
          )
        })}

        <div ref={sectionsEndRef} />
      </div>

      {/* ── Footer sticky: botones de añadir + guardar ───────────────────── */}
      <div className="flex-shrink-0 border-t border-line-1 bg-surface-1">
        <div className="px-6 py-2 flex items-center gap-1.5 flex-wrap border-b border-line-1">
          <span className="text-[10px] font-mono font-medium text-ink-4 uppercase tracking-[1.2px] mr-1 flex-shrink-0">
            Añadir:
          </span>
          {QUICK_ADD.map(t => {
            const m = getSectionMeta(t)
            return (
              <button
                key={t}
                onClick={() => addSection(t)}
                className={cn(
                  'text-[10px] font-mono font-semibold uppercase tracking-[0.5px] px-3 py-1.5 rounded-btn border transition-all hover:scale-105 active:scale-95',
                  m.color,
                  'border-current/30',
                )}
              >
                + {m.label}
              </button>
            )
          })}
        </div>

        <div className="px-6 py-3 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-btn text-[13px] font-semibold border border-line-2 text-ink-2 hover:bg-surface-3 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className={cn(
              'flex-[2] py-2.5 rounded-btn text-[13px] font-bold transition-all',
              'bg-primary-200 text-neutral-950 hover:bg-primary-300',
              'disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            {saving ? 'Guardando…' : song?.id ? 'Guardar cambios' : 'Crear canción'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Slide mini-preview (para el modo grid) ───────────────────────────────────
function SlideGridCard({ section, isActive, isLiveSlide, index, total, onSelect, onProject, effectiveBg }) {
  const { projectionFontFamily } = useApp()
  const lines = (section.lyrics || '').split('\n').length
  const fontSize = lines > 6 ? 5 : lines > 4 ? 6 : lines > 2 ? 7 : 9
  const isMedia = effectiveBg && (effectiveBg.type === 'image' || effectiveBg.type === 'gif' || effectiveBg.type === 'video')

  return (
    <div
      onClick={() => { onSelect(); onProject() }}
      title="Clic: proyectar"
      className={cn(
        'relative rounded-panel overflow-hidden cursor-pointer transition-all group',
        'border-2',
        isLiveSlide
          ? 'border-live-500 shadow-[0_0_12px_rgb(255_59_48/.35)] scale-[1.02]'
          : isActive
            ? 'border-primary-500 scale-[1.02]'
            : 'border-transparent hover:border-primary-500/50 hover:scale-[1.01]',
      )}
      style={{ aspectRatio: '16/9' }}
    >
      {!isMedia && <div className="absolute inset-0" style={{ background: effectiveBg?.value }} />}
      {isMedia && (effectiveBg.type === 'image' || effectiveBg.type === 'gif') && (
        <>
          <img src={effectiveBg.thumbnail || effectiveBg.value} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.38)' }} />
        </>
      )}
      {isMedia && effectiveBg.type === 'video' && (
        <>
          {effectiveBg.thumbnail
            ? <img src={effectiveBg.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover" />
            : <div className="absolute inset-0" style={{ background: '#000' }} />
          }
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.38)' }} />
        </>
      )}

      <div className="absolute top-1.5 left-2 font-mono text-white/30 text-[8px] font-bold select-none">
        {index + 1}/{total}
      </div>

      {isLiveSlide && (
        <div className="absolute top-1.5 right-2 flex items-center gap-1 font-mono text-live-500 text-[8px] font-bold uppercase tracking-[0.5px] select-none">
          <span className="w-1 h-1 rounded-full bg-live-500 animate-blink" /> Live
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-primary-500/90 text-white rounded-full p-1.5">
          <ProjectIcon />
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 py-2 gap-0.5">
        <p
          className="text-white font-bold text-center leading-tight whitespace-pre-wrap"
          style={{ fontFamily: buildFontFamily(projectionFontFamily), fontSize: `${fontSize}px`, textShadow: '0 1px 6px rgba(0,0,0,.9)', maxWidth: '100%' }}
        >
          {section.lyrics}
        </p>
      </div>

      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <SectionBadge type={section.type} active={isActive} />
      </div>
    </div>
  )
}

// ─── Detalle de canción ───────────────────────────────────────────────────────
function SongDetail({ song, activeBg, sidebarCollapsed, onToggleSidebar, onEdit, onDelete, onProjectSection, isLive, onClearLive }) {
  const { isNavNext, isNavPrev, projectionClickMode, setNextText, projectionFontFamily, projFontSize, watermark,
          registerTransport, clearSignal } = useApp()
  const allSections = useMemo(() => buildAllSections(song), [song])
  const [activeIdx, setActiveIdx] = useState(0)
  const [liveIdx, setLiveIdx] = useState(null)
  const [detailView, setDetailView] = useState('list')
  const effectiveBg = activeBg ?? DEFAULT_BG
  const activeSection = allSections[activeIdx]

  // Vista previa de "lo próximo" para el panel de Escenario
  useEffect(() => {
    const next = allSections[activeIdx + 1]
    setNextText(next ? (next._isTitleSlide ? song.title : (next.label || next.type)) : '')
  }, [allSections, activeIdx, song.title, setNextText])

  const handleProjectSection = useCallback((section) => {
    if (!section) return
    setLiveIdx(allSections.indexOf(section))

    if (section._isTitleSlide) {
      const sub = section._meta ? `— ${section._meta}` : ''
      onProjectSection({
        ...section,
        lyrics: sub ? `${section.lyrics}\n\n${sub}` : section.lyrics,
        _raw: true,
      })
    } else {
      onProjectSection(section)
    }
  }, [onProjectSection, allSections])

  // La señal de limpieza global y el apagado quitan el indicador de en vivo
  useEffect(() => { setLiveIdx(null) }, [clearSignal])
  useEffect(() => { if (!isLive) setLiveIdx(null) }, [isLive])

  const goPrev = useCallback(() => {
    if (activeIdx <= 0) return
    const newIdx = activeIdx - 1
    setActiveIdx(newIdx)
    handleProjectSection(allSections[newIdx])
  }, [activeIdx, allSections, handleProjectSection])

  const goNext = useCallback(() => {
    if (activeIdx >= allSections.length - 1) return
    const newIdx = activeIdx + 1
    setActiveIdx(newIdx)
    handleProjectSection(allSections[newIdx])
  }, [activeIdx, allSections, handleProjectSection])

  // ── Transport global (barra inferior): prev/next de secciones ──────────────
  useEffect(() => {
    return registerTransport({
      onPrev: goPrev,
      onNext: goNext,
      label: `${activeIdx + 1}/${allSections.length}`,
    })
  }, [goPrev, goNext, activeIdx, allSections.length, registerTransport])

  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (isNavNext(e.key)) {
        e.preventDefault()
        goNext()
      } else if (isNavPrev(e.key)) {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'Home') {
        e.preventDefault()
        setActiveIdx(0)
        handleProjectSection(allSections[0])
      } else if (e.key === 'End') {
        e.preventDefault()
        const last = allSections.length - 1
        setActiveIdx(last)
        handleProjectSection(allSections[last])
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [goNext, goPrev, allSections, handleProjectSection, isNavNext, isNavPrev])

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-xl text-ink-1 truncate">{song.title}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {song.artist && <span className="text-[12px] text-ink-3">{song.artist}</span>}
            {song.key_sig && <span className="text-[11px] font-mono font-bold bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-btn border border-primary-500/30">{song.key_sig}</span>}
            {song.tempo && <span className="text-[11px] text-ink-3 font-mono">{song.tempo} BPM</span>}
            {song.copyright && <span className="text-[10px] text-ink-4 italic">© {song.copyright}</span>}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0 items-center">
          <SegmentedControl
            size="sm"
            options={[
              { value: 'list', label: 'Lista' },
              { value: 'grid', label: 'Grid' },
            ]}
            value={detailView}
            onChange={setDetailView}
          />

          <Button variant="secondary" size="sm" onClick={() => onEdit(song)}>
            <EditIcon /> Editar
          </Button>

          {isLive ? (
            <Button variant="danger" size="md" onClick={onClearLive}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Dejar de presentar
            </Button>
          ) : (
            <Button size="md" onClick={() => handleProjectSection(activeSection)}>
              <ProjectIcon /> Proyectar
            </Button>
          )}

          <button
            onClick={onToggleSidebar}
            title={sidebarCollapsed ? 'Mostrar buscador de canciones' : 'Ocultar buscador de canciones'}
            className={cn(
              'p-2 transition-colors rounded-btn',
              sidebarCollapsed
                ? 'text-primary-500 bg-primary-500/10'
                : 'text-ink-4 hover:text-primary-500 hover:bg-primary-500/10',
            )}
          >
            <PanelIcon />
          </button>

          <button
            onClick={() => onDelete(song.id)}
            className="p-2 text-ink-4 hover:text-live-500 transition-colors rounded-btn hover:bg-live-500/10"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {detailView === 'list' && (
        <div className="flex gap-4 flex-1 overflow-hidden">
          <div className="w-56 flex-shrink-0 overflow-y-auto space-y-1.5">
            <FieldLabel className="mb-2">
              Secciones ({allSections.length})
              <span className="ml-1 text-ink-4 font-normal normal-case tracking-normal">· {projectionClickMode === 'single' ? 'clic proyecta' : 'doble clic proyecta'}</span>
            </FieldLabel>

            {allSections.map((section, idx) => (
              <SectionSlide
                key={idx}
                section={section}
                isActive={activeIdx === idx}
                isLiveSlide={isLive && liveIdx === idx}
                onClick={() => setActiveIdx(idx)}
                onProject={() => handleProjectSection(section)}
              />
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <SlideCanvas
              bg={effectiveBg}
              text={activeSection
                ? (activeSection._isTitleSlide && activeSection._meta
                    ? `${activeSection.lyrics}\n\n— ${activeSection._meta}`
                    : activeSection.lyrics)
                : ''}
              fontFamily={projectionFontFamily}
              fontSizeMode={projFontSize}
              label={isLive && liveIdx === activeIdx ? 'En vivo' : 'Preview'}
              live={isLive && liveIdx === activeIdx}
              video
              className="flex-shrink-0"
              style={{ maxHeight: '60%' }}
            >
              {watermark?.enabled && watermark.image && (
                <img src={watermark.image} alt="" className="absolute pointer-events-none select-none"
                  style={watermarkPreviewStyle(watermark)} />
              )}
            </SlideCanvas>

            <NavBar
              activeIdx={activeIdx}
              total={allSections.length}
              label={activeSection?.label}
              onPrev={goPrev}
              onNext={goNext}
              onProject={() => handleProjectSection(activeSection)}
            />
          </div>
        </div>
      )}

      {detailView === 'grid' && (
        <div className="flex flex-col flex-1 overflow-hidden gap-3">
          <div className="flex-1 overflow-y-auto">
            <div className="grid gap-3 pr-1" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
              {allSections.map((section, idx) => (
                <SlideGridCard
                  key={idx}
                  section={section}
                  index={idx}
                  total={allSections.length}
                  isActive={activeIdx === idx}
                  isLiveSlide={isLive && liveIdx === idx}
                  effectiveBg={effectiveBg}
                  onSelect={() => setActiveIdx(idx)}
                  onProject={() => {
                    setActiveIdx(idx)
                    handleProjectSection(section)
                  }}
                />
              ))}
            </div>
          </div>

          <NavBar
            activeIdx={activeIdx}
            total={allSections.length}
            label={activeSection?.label}
            onPrev={goPrev}
            onNext={goNext}
            onProject={() => handleProjectSection(activeSection)}
          />
        </div>
      )}
    </div>
  )
}

// ─── Barra de navegación prev/next + proyectar ────────────────────────────────
function NavBar({ activeIdx, total, label, onPrev, onNext, onProject }) {
  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <Button variant="outline" size="md" disabled={activeIdx <= 0} onClick={onPrev}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Anterior
      </Button>

      <Button variant="primary" size="lg" className="flex-1" onClick={onProject}>
        <ProjectIcon />
        {label ? `Proyectar "${label}"` : 'Proyectar'}
      </Button>

      <Button variant="outline" size="md" disabled={activeIdx >= total - 1} onClick={onNext}>
        Siguiente
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Button>
    </div>
  )
}

// ─── Song list item con drag & drop + context menu ────────────────────────────
function SongListItem({
  song, index, total, isActive, isDragging, isDragOver,
  onSelect, onProject, onEdit, onDelete, onToggleFav, onMoveUp, onMoveDown,
  onSaveToLibrary,
  onDragStart, onDragOver, onDragEnd, onDrop,
}) {
  const [ctx, setCtx] = useState(null)
  const clickTimer = useRef(null)

  const handleClick = (e) => {
    if (e.ctrlKey || e.metaKey) return
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
      onProject()
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null
        onSelect()
      }, 220)
    }
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    if (!isActive) onSelect()
    setCtx({ x: e.clientX, y: e.clientY })
  }

  const DragHandle = () => (
    <span className="flex-shrink-0 text-ink-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-0.5">
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
        <circle cx="3" cy="2.5" r="1.2"/><circle cx="7" cy="2.5" r="1.2"/>
        <circle cx="3" cy="7" r="1.2"/><circle cx="7" cy="7" r="1.2"/>
        <circle cx="3" cy="11.5" r="1.2"/><circle cx="7" cy="11.5" r="1.2"/>
      </svg>
    </span>
  )

  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragOver={(e) => { e.preventDefault(); onDragOver() }}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title="Clic: seleccionar · Doble clic: proyectar · Clic derecho: opciones"
        className={cn(
          'group w-full flex items-start gap-2 p-3 rounded-panel border cursor-pointer transition-all duration-100 select-none',
          isDragOver && 'border-primary-400 bg-primary-500/10 scale-[1.01]',
          isDragging && 'opacity-25 scale-95',
          isActive && !isDragOver && 'bg-primary-500/10 border-primary-500/40',
          !isActive && !isDragOver && 'bg-surface-1 border-transparent hover:border-line-1',
        )}
      >
        <DragHandle />
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-[13px] font-semibold truncate',
            isActive ? 'text-primary-500' : 'text-ink-1',
          )}>
            {song.title}
          </p>
          {song.artist && <p className="text-[11px] text-ink-4 truncate">{song.artist}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {song.key_sig && (
            <span className="text-[10px] font-mono font-bold bg-surface-3 text-ink-3 px-1.5 py-0.5 rounded-[3px]">
              {song.key_sig}
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onToggleFav() }}
            className={cn('transition-colors', song.is_favorite ? 'text-warn-500' : 'text-ink-4 hover:text-warn-500')}
          >
            <StarIcon filled={song.is_favorite} />
          </button>
        </div>
      </div>

      <ContextMenu
        open={!!ctx}
        x={ctx?.x ?? 0}
        y={ctx?.y ?? 0}
        title={song.artist ? `${song.title} · ${song.artist}` : song.title}
        items={[
          { icon: <ProjectIcon />, label: 'Proyectar', onClick: onProject },
          { icon: <EditIcon />,    label: 'Editar', onClick: onEdit },
          { icon: <SaveIcon />,    label: 'Guardar en biblioteca', onClick: onSaveToLibrary },
          'sep',
          { icon: <StarIcon filled={song.is_favorite} />, label: song.is_favorite ? 'Quitar de favoritos' : 'Marcar favorito', onClick: onToggleFav },
          'sep',
          { icon: <UpIcon />,   label: 'Subir', onClick: onMoveUp, disabled: index <= 0 },
          { icon: <DownIcon />, label: 'Bajar', onClick: onMoveDown, disabled: index >= total - 1 },
          'sep',
          { icon: <TrashIcon />, label: 'Eliminar', onClick: onDelete, danger: true },
        ]}
        onClose={() => setCtx(null)}
      />
    </>
  )
}

export function SongsPage() {
  const { project, activeBg, isLive, clearProjection, refreshLibrary, isNavNext, isNavPrev,
          pendingSelection, clearPendingSelection } = useApp()

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [artistFilter, setArtistFilter] = useState('all')
  const [showFavs, setShowFavs] = useState(false)
  const [artists, setArtists] = useState([])

  const [view, setView] = useState('list')
  const [activeSong, setActiveSong] = useState(null)
  const [editSong, setEditSong] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [confirmModal, setConfirmModal] = useState(null)

  const searchTimer = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const filters = {}
      if (search) filters.search = search
      if (artistFilter !== 'all') filters.artist = artistFilter
      if (showFavs) filters.favorite = true

      const [list, artistList] = await Promise.all([
        ipc.songs.findAll(filters),
        ipc.songs.getArtists(),
      ])
      setSongs(list ?? [])
      setArtists(artistList ?? [])
    } catch (e) {
      console.error('[SongsPage] Error al cargar canciones:', e)
    } finally {
      setLoading(false)
    }
  }, [search, artistFilter, showFavs])

  useEffect(() => {
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(load, 250)
    return () => clearTimeout(searchTimer.current)
  }, [load])

  const selectSong = useCallback(async (song) => {
    if (activeSong?.id === song.id) return activeSong
    const full = await ipc.songs.findById(song.id)
    setActiveSong(full)
    return full
  }, [activeSong])

  // ── Deep-link del buscador global: seleccionar y proyectar la primera sección ──
  useEffect(() => {
    if (pendingSelection?.type !== 'song') return
    setView('list')
    ;(async () => {
      const full = await selectSong({ id: pendingSelection.payload.songId })
      const first = full && buildAllSections(full)[0]
      if (first) {
        const meta = first._isTitleSlide && first._meta ? `\n\n— ${first._meta}` : ''
        project(`${first.lyrics}${meta}`)
      }
      clearPendingSelection()
    })()
  }, [pendingSelection]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async (data) => {
    try {
      let saved
      if (editSong?.id) {
        saved = await ipc.songs.update(editSong.id, data)
      } else {
        saved = await ipc.songs.create(data)
      }

      await load()
      setView('list')
      setEditSong(null)

      if (saved?.id) {
        const full = await ipc.songs.findById(saved.id)
        setActiveSong(full)
      }
    } catch (e) {
      console.error('[SongsPage] Error en handleSave:', e)
      throw e
    }
  }, [editSong, load])

  const handleDelete = useCallback((id) => {
    setConfirmModal({
      message: '¿Eliminar esta canción? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmModal(null)
        await ipc.songs.delete(id)
        if (activeSong?.id === id) setActiveSong(null)
        await load()
      },
    })
  }, [activeSong, load])

  const handleToggleFav = useCallback(async (id) => {
    const updated = await ipc.songs.toggleFavorite(id)
    if (updated) {
      setSongs(prev => prev.map(s => s.id === id ? { ...s, is_favorite: updated.is_favorite } : s))
      if (activeSong?.id === id) {
        setActiveSong(prev => ({ ...prev, is_favorite: updated.is_favorite }))
      }
    }
  }, [activeSong])

  const handleMoveUp = useCallback((id) => {
    setSongs(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx <= 0) return prev
      const next = [...prev]
      ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      return next
    })
  }, [])

  const handleMoveDown = useCallback((id) => {
    setSongs(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx < 0 || idx >= prev.length - 1) return prev
      const next = [...prev]
      ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return next
    })
  }, [])

  const handleProject = useCallback(async (song) => {
    const full = await ipc.songs.findById(song.id)
    setActiveSong(full)
    const [first] = buildAllSections(full)
    if (!first) return
    if (first._isTitleSlide) {
      const sub = first._meta ? `— ${first._meta}` : ''
      project(sub ? `${first.lyrics}\n\n${sub}` : first.lyrics)
    } else {
      project(first.lyrics)
    }
  }, [project])

  const [dragFrom, setDragFrom] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const handleDrop = useCallback((toIndex) => {
    if (dragFrom === null || dragFrom === toIndex) return
    setSongs(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragFrom, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setDragFrom(null)
    setDragOver(null)
  }, [dragFrom])

  const handleSaveToLibrary = useCallback(async (song) => {
    try {
      await window.api?.library.create({
        title: song.title,
        content: `${song.title}${song.artist ? `\n${song.artist}` : ''}`,
        type: 'song',
        ref: { songId: song.id },
      })
      refreshLibrary()
    } catch (e) {
      console.error('[SongsPage] Error al guardar en biblioteca:', e)
    }
  }, [refreshLibrary])

  if (view === 'edit') {
    return (
      <main className="flex-1 flex flex-col overflow-hidden">
        <SongEditor
          song={editSong}
          onSave={handleSave}
          onCancel={() => { setView('list'); setEditSong(null) }}
        />
      </main>
    )
  }

  if (view === 'importPptx') {
    return (
      <PptxImportView
        onCancel={() => setView('list')}
        onDone={async (lastSong) => {
          await load()
          setView('list')
          if (lastSong?.id) {
            const full = await ipc.songs.findById(lastSong.id)
            setActiveSong(full)
          }
        }}
      />
    )
  }

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* Panel izquierdo */}
      <div className={cn(
        'flex-shrink-0 flex flex-col border-r overflow-hidden transition-all duration-200',
        'border-line-1 bg-surface-1',
        sidebarCollapsed ? 'w-9' : 'w-72',
      )}>
        {sidebarCollapsed ? (
          <div className="flex-1 flex flex-col items-center pt-3">
            <button
              onClick={() => setSidebarCollapsed(false)}
              title="Mostrar buscador de canciones"
              className="p-1.5 text-ink-4 hover:text-primary-500 rounded-btn hover:bg-surface-3 transition-colors"
            >
              <ChevronRightIcon />
            </button>
          </div>
        ) : (
        <>
        <div className="p-3 border-b border-line-1">
          <div className="flex items-center justify-between mb-3">
            <FieldLabel>Canciones ({songs.length})</FieldLabel>
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => setView('importPptx')} title="Importar letras desde un archivo PowerPoint">
                <UploadIcon /> PPTX
              </Button>
              <Button size="sm" onClick={() => { setEditSong(null); setView('edit') }}>
                <PlusIcon /> Nueva
              </Button>
            </div>
          </div>

          <div className="relative mb-2">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-ink-4"
              width="12"
              height="12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <Input
              className="pl-8 text-[13px]"
              placeholder="Buscar canciones…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {artists.length > 0 && (
            <Select
              className="w-full text-[12px] mb-2"
              value={artistFilter}
              onChange={e => setArtistFilter(e.target.value)}
            >
              <option value="all">Todos los artistas</option>
              {artists.map(a => <option key={a} value={a}>{a}</option>)}
            </Select>
          )}

          <button
            onClick={() => setShowFavs(f => !f)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-btn text-[12px] font-semibold border transition-all',
              showFavs
                ? 'bg-warn-500/10 text-warn-500 border-warn-500/40'
                : 'border-line-1 text-ink-4 hover:text-ink-2',
            )}
          >
            <StarIcon filled={showFavs} />
            {showFavs ? 'Mostrando favoritos' : 'Filtrar favoritos'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={20} />
            </div>
          ) : songs.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-10 h-10 rounded-panel bg-surface-3 text-ink-3 flex items-center justify-center mx-auto mb-3">
                <MusicIcon />
              </div>
              <p className="text-[13px] text-ink-4">
                {search ? 'Sin resultados' : 'No hay canciones aún'}
              </p>
              {!search && (
                <button
                  onClick={() => { setEditSong(null); setView('edit') }}
                  className="text-[12px] text-primary-500 hover:text-primary-400 mt-1.5"
                >
                  + Crear primera canción
                </button>
              )}
            </div>
          ) : (
            songs.map((song, index) => (
              <SongListItem
                key={song.id}
                song={song}
                index={index}
                total={songs.length}
                isActive={activeSong?.id === song.id}
                isDragging={dragFrom === index}
                isDragOver={dragOver === index && dragFrom !== index}
                onSelect={() => selectSong(song)}
                onProject={() => handleProject(song)}
                onEdit={async () => {
                  const full = await ipc.songs.findById(song.id)
                  setEditSong(full)
                  setView('edit')
                }}
                onDelete={() => handleDelete(song.id)}
                onToggleFav={() => handleToggleFav(song.id)}
                onMoveUp={() => handleMoveUp(song.id)}
                onMoveDown={() => handleMoveDown(song.id)}
                onSaveToLibrary={() => handleSaveToLibrary(song)}
                onDragStart={() => setDragFrom(index)}
                onDragOver={() => setDragOver(index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => { setDragFrom(null); setDragOver(null) }}
              />
            ))
          )}
        </div>
        </>
        )}
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4">
        {activeSong ? (
          <SongDetail
            song={activeSong}
            activeBg={activeBg}
            isLive={isLive}
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(v => !v)}
            onEdit={async (s) => {
              const full = await ipc.songs.findById(s.id)
              setEditSong(full)
              setView('edit')
            }}
            onDelete={handleDelete}
            onClearLive={clearProjection}
            onProjectSection={(section) => project(section.lyrics)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-ink-4">
            <div className="w-14 h-14 rounded-card bg-surface-3 flex items-center justify-center">
              <MusicIcon />
            </div>
            <p className="text-sm">Selecciona una canción</p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmModal}
        title="Eliminar canción"
        message={confirmModal?.message}
        confirmLabel="Eliminar"
        onConfirm={confirmModal?.onConfirm}
        onCancel={() => setConfirmModal(null)}
      />
    </main>
  )
}