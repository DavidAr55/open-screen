import { useState, useEffect, useCallback, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Button, Card, Input, Select, SectionLabel, Spinner } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'
import { ConfirmModal } from '@shared/components/ConfirmModal.jsx'

// ─── Constantes ───────────────────────────────────────────────────────────────
const SECTION_TYPES = [
  { value: 'intro',      label: 'Intro',    color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
  { value: 'verse',      label: 'Verso',    color: 'bg-blue-50 dark:bg-blue-950/40 text-blue-500' },
  { value: 'pre-chorus', label: 'Pre-Coro', color: 'bg-purple-50 dark:bg-purple-950/40 text-purple-500' },
  { value: 'chorus',     label: 'Coro',     color: 'bg-brand-50 dark:bg-brand-950/40 text-brand-600' },
  { value: 'bridge',     label: 'Puente',   color: 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' },
  { value: 'tag',        label: 'Tag',      color: 'bg-green-50 dark:bg-green-950/40 text-green-500' },
  { value: 'outro',      label: 'Outro',    color: 'bg-slate-100 dark:bg-slate-800 text-slate-500' },
  { value: 'custom',     label: 'Custom',   color: 'bg-rose-50 dark:bg-rose-950/40 text-rose-500' },
]

const KEYS = [
  'C','C#','D','D#','E','F','F#','G','G#','A','A#','B',
  'Cm','C#m','Dm','D#m','Em','Fm','F#m','Gm','G#m','Am','A#m','Bm',
]

const BG_MAP = {
  dark:  'radial-gradient(ellipse at 50% 35%, #1c0a0a, #000)',
  red:   'radial-gradient(ellipse at 50% 30%, #4a0808, #1a0000)',
  black: '#000',
}

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
const BackIcon    = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>

// ─── SectionBadge ─────────────────────────────────────────────────────────────
function SectionBadge({ type, active, className }) {
  if (type === 'title') {
    return (
      <span className={cn(
        'text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
        active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
        className,
      )}>
        Título
      </span>
    )
  }

  const meta = getSectionMeta(type)
  return (
    <span className={cn(
      'text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0',
      active ? 'bg-white/20 text-white' : meta.color,
      className,
    )}>
      {meta.label}
    </span>
  )
}

// ─── SectionSlide (en vista detalle) ──────────────────────────────────────────
function SectionSlide({ section, isActive, onClick, onProject }) {
  return (
    <div
      onClick={() => { onClick(); onProject() }}
      className={cn(
        'group flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition-all',
        isActive
          ? 'bg-brand-50 dark:bg-brand-950/30 border-brand-300 dark:border-brand-800'
          : 'bg-white dark:bg-dark-surface border-surface-muted dark:border-dark-border hover:border-brand-200 dark:hover:border-brand-900',
      )}
      title="Clic: proyectar"
    >
      <SectionBadge type={section.type} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{section.label}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-600 truncate mt-0.5">
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
        'text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600',
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
      <div className="flex-shrink-0 px-6 py-4 border-b border-surface-muted dark:border-dark-border bg-white dark:bg-dark-surface">
        <div className="flex gap-4 items-end">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Nombre de la canción"
              value={title}
              onChange={e => { setTitle(e.target.value); setError(null) }}
              className={cn(
                'w-full text-2xl font-extrabold bg-transparent outline-none',
                'text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700',
                'border-b-2 pb-1 transition-colors',
                error && !title.trim()
                  ? 'border-red-400'
                  : 'border-transparent focus:border-brand-500',
              )}
            />
            {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
          </div>

          <div className="w-52 flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Artista / Autor</p>
            <input
              type="text"
              placeholder="Artista"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              className={cn(
                'w-full text-[14px] font-medium bg-transparent outline-none',
                'text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700',
                'border-b border-surface-muted dark:border-dark-border focus:border-brand-400 pb-0.5 transition-colors',
              )}
            />
          </div>

          <div className="flex-shrink-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tono</p>
            <select
              value={keySig}
              onChange={e => setKeySig(e.target.value)}
              className={cn(
                'text-[13px] font-mono font-bold bg-transparent outline-none cursor-pointer',
                'text-slate-700 dark:text-slate-300 border-b border-surface-muted dark:border-dark-border',
                'focus:border-brand-400 pb-0.5 pr-2 transition-colors',
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
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
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
                'rounded-2xl border overflow-hidden',
                'transition-[border-color,box-shadow,transform,opacity] duration-200',
                isTarget  && 'border-brand-400 dark:border-brand-600 shadow-brand scale-[1.01]',
                isDragged && 'opacity-30 scale-[0.98]',
                isFlash   && !isDragged && !isTarget && 'section-flash border-brand-400 dark:border-brand-600',
                !isTarget && !isDragged && !isFlash && 'border-surface-muted dark:border-dark-border',
                'bg-white dark:bg-dark-surface',
              )}
            >
              <div className="flex items-center gap-2 px-3 pt-3 pb-2">
                <span className="flex-shrink-0 text-slate-300 dark:text-slate-700 cursor-grab active:cursor-grabbing">
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
                    'text-[10px] font-bold px-2 py-1 rounded-full border-0 outline-none cursor-pointer',
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
                    'text-slate-700 dark:text-slate-300 placeholder:text-slate-400',
                    'border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600',
                  )}
                />

                <div className="flex items-center gap-0.5 flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => moveSection(i, 'up')}
                    disabled={i === 0}
                    title="Subir"
                    className="p-1.5 rounded-lg hover:bg-surface-soft dark:hover:bg-dark-card text-slate-500 disabled:opacity-20 transition-all"
                  >
                    <UpIcon />
                  </button>
                  <button
                    onClick={() => moveSection(i, 'down')}
                    disabled={i === sections.length - 1}
                    title="Bajar"
                    className="p-1.5 rounded-lg hover:bg-surface-soft dark:hover:bg-dark-card text-slate-500 disabled:opacity-20 transition-all"
                  >
                    <DownIcon />
                  </button>
                  <button
                    onClick={() => removeSection(i)}
                    title="Eliminar sección"
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-all"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>

              <div className="mx-3 h-px bg-surface-muted dark:bg-dark-border" />

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
      <div className="flex-shrink-0 border-t border-surface-muted dark:border-dark-border bg-white dark:bg-dark-surface">
        <div className="px-6 py-2 flex items-center gap-1.5 flex-wrap border-b border-surface-muted dark:border-dark-border">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
            Añadir:
          </span>
          {QUICK_ADD.map(t => {
            const m = getSectionMeta(t)
            return (
              <button
                key={t}
                onClick={() => addSection(t)}
                className={cn(
                  'text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all hover:scale-105 active:scale-95',
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
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold border border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300 hover:bg-surface-soft dark:hover:bg-dark-card transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className={cn(
              'flex-[2] py-2.5 rounded-xl text-[13px] font-bold text-white transition-all',
              'bg-brand-600 hover:bg-brand-700 shadow-brand',
              'hover:-translate-y-px active:translate-y-0',
              'disabled:opacity-50 disabled:pointer-events-none',
            )}
          >
            {saving ? 'Guardando…' : song?.id ? 'Guardar cambios' : 'Crear canción'}
          </button>
        </div>
      </div>

      {/* Keyframes para el flash de reordenamiento */}
      <style>{`
        @keyframes sectionFlash {
          0%   { box-shadow: 0 0 0 0 rgba(229, 29, 29, 0.5); background-color: rgba(229,29,29,0.08); }
          40%  { box-shadow: 0 0 0 6px rgba(229, 29, 29, 0.15); background-color: rgba(229,29,29,0.12); }
          100% { box-shadow: 0 0 0 0 rgba(229, 29, 29, 0); background-color: transparent; }
        }
        .section-flash {
          animation: sectionFlash 0.45s cubic-bezier(.36,.07,.19,.97) forwards;
        }
      `}</style>
    </div>
  )
}

// ─── Proyector de canción ─────────────────────────────────────────────────────
function SongProjector({ song, liveBg, activeBg, onBack }) {
  const { project } = useApp()
  const allSections = buildAllSections(song)
  const [activeIdx, setActiveIdx] = useState(0)

  const projectSection = useCallback((section, idx) => {
    setActiveIdx(idx)
    if (section._isTitleSlide) {
      const text = section.lyrics
      const sub = section._meta ? `— ${section._meta}` : ''
      project(sub ? `${text}\n\n${sub}` : text, liveBg)
    } else {
      const sub = `— ${song.title}${song.artist ? ` · ${song.artist}` : ''}`
      project(`${section.lyrics}\n\n${sub}`, liveBg)
    }
  }, [song, project, liveBg])

  useEffect(() => {
    if (allSections.length > 0) projectSection(allSections[0], 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song.id])

  useEffect(() => {
    const handler = (e) => {
      if (!['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].includes(e.key)) return
      e.preventDefault()
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        const next = Math.min(activeIdx + 1, allSections.length - 1)
        if (next !== activeIdx) projectSection(allSections[next], next)
      } else {
        const prev = Math.max(activeIdx - 1, 0)
        if (prev !== activeIdx) projectSection(allSections[prev], prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeIdx, allSections, projectSection])

  const effectiveBg = activeBg ?? { type: 'gradient', value: BG_MAP[liveBg] ?? BG_MAP.dark }
  const isMedia = effectiveBg.type === 'image' || effectiveBg.type === 'gif' || effectiveBg.type === 'video'
  const activeSection = allSections[activeIdx]
  const total = allSections.length

  return (
    <div className="flex-1 flex overflow-hidden gap-4 p-5">
      <div className="w-64 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0">
            <BackIcon />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[14px] text-slate-900 dark:text-white truncate">{song.title}</p>
            {song.artist && <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>}
          </div>
          {song.key_sig && (
            <span className="text-[11px] font-mono font-bold bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 px-2 py-1 rounded-lg border border-brand-200 dark:border-brand-900 flex-shrink-0">
              {song.key_sig}
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5">
          {allSections.map((section, idx) => (
            <button
              key={idx}
              onClick={() => projectSection(section, idx)}
              className={cn(
                'w-full text-left p-3 rounded-xl border transition-all',
                idx === activeIdx
                  ? 'bg-brand-600 border-brand-700 text-white shadow-brand'
                  : 'bg-white dark:bg-dark-surface border-surface-muted dark:border-dark-border hover:border-brand-200 dark:hover:border-brand-900',
              )}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <SectionBadge type={section.type} active={idx === activeIdx} />
                <span className={cn(
                  'text-[11px] font-semibold truncate',
                  idx === activeIdx ? 'text-white' : 'text-slate-700 dark:text-slate-300',
                )}>
                  {section.label}
                </span>
              </div>
              <p className={cn('text-[11px] truncate', idx === activeIdx ? 'text-white/70' : 'text-slate-400')}>
                {section._isTitleSlide ? (section._meta || section.lyrics) : (section.lyrics || '').split('\n')[0]}
              </p>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center">
          {activeIdx + 1} / {total} · ← → para navegar
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="slide-canvas" style={{ flex: '1', maxHeight: '60%' }}>
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
          <span className="absolute top-2.5 left-3 font-mono text-[10px] text-white/20 tracking-wider">PREVIEW</span>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 gap-3 overflow-hidden">
            {activeSection && (
              <>
                <p
                  className="text-white font-bold text-center leading-snug whitespace-pre-wrap"
                  style={{
                    fontSize: 'clamp(11px, 2.5vw, 26px)',
                    textShadow: '0 2px 24px rgba(0,0,0,.8)',
                    maxWidth: '100%',
                    overflowWrap: 'break-word',
                  }}
                >
                  {activeSection.lyrics}
                </p>
                <p className="text-white/40 text-center" style={{ fontSize: 'clamp(8px, 1.1vw, 12px)' }}>
                  {activeSection._isTitleSlide
                    ? activeSection._meta
                    : `${song.title}${song.artist ? ` · ${song.artist}` : ''}`}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="secondary"
            size="sm"
            disabled={activeIdx <= 0}
            onClick={() => {
              const p = activeIdx - 1
              projectSection(allSections[p], p)
            }}
          >
            ← Anterior
          </Button>
          <div className="flex-1 text-center self-center">
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
              {activeSection?.label ?? ''}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={activeIdx >= total - 1}
            onClick={() => {
              const n = activeIdx + 1
              projectSection(allSections[n], n)
            }}
          >
            Siguiente →
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Slide mini-preview (para el modo grid) ───────────────────────────────────
function SlideGridCard({ section, isActive, index, total, onSelect, onProject, effectiveBg }) {
  const lines = (section.lyrics || '').split('\n').length
  const fontSize = lines > 6 ? 5 : lines > 4 ? 6 : lines > 2 ? 7 : 9
  const isMedia = effectiveBg && (effectiveBg.type === 'image' || effectiveBg.type === 'gif' || effectiveBg.type === 'video')

  return (
    <div
      onClick={() => { onSelect(); onProject() }}
      title="Clic: proyectar"
      className={cn(
        'relative rounded-xl overflow-hidden cursor-pointer transition-all group',
        'border-2',
        isActive
          ? 'border-brand-500 shadow-brand scale-[1.02]'
          : 'border-transparent hover:border-brand-300 dark:hover:border-brand-700 hover:scale-[1.01]',
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
        <div className="absolute inset-0" style={{ background: '#000' }} />
      )}

      <div className="absolute top-1.5 left-2 font-mono text-white/30 text-[8px] font-bold select-none">
        {index + 1}/{total}
      </div>

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="bg-brand-600/90 text-white rounded-full p-1.5">
          <ProjectIcon />
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center px-2 py-2 gap-0.5">
        <p
          className="text-white font-bold text-center leading-tight whitespace-pre-wrap"
          style={{ fontSize: `${fontSize}px`, textShadow: '0 1px 6px rgba(0,0,0,.9)', maxWidth: '100%' }}
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
function SongDetail({ song, liveBg, activeBg, onOpenProjector, onEdit, onDelete, onProjectSection, isLive, onClearLive }) {
  const allSections = buildAllSections(song)
  const [activeIdx, setActiveIdx] = useState(0)
  const [detailView, setDetailView] = useState('list')
  const effectiveBg = activeBg ?? { type: 'gradient', value: BG_MAP[liveBg] ?? BG_MAP.dark }
  const isMedia = effectiveBg.type === 'image' || effectiveBg.type === 'gif' || effectiveBg.type === 'video'
  const activeSection = allSections[activeIdx]

  const handleProjectSection = useCallback((section) => {
    if (!section) return

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
  }, [onProjectSection])

  const goPrev = () => {
    if (activeIdx <= 0) return
    const newIdx = activeIdx - 1
    setActiveIdx(newIdx)
    handleProjectSection(allSections[newIdx])
  }

  const goNext = () => {
    if (activeIdx >= allSections.length - 1) return
    const newIdx = activeIdx + 1
    setActiveIdx(newIdx)
    handleProjectSection(allSections[newIdx])
  }

  useEffect(() => {
    const handler = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        goNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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
  }, [goNext, goPrev, allSections, handleProjectSection])

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-start justify-between flex-shrink-0 gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-extrabold text-xl text-slate-900 dark:text-white truncate">{song.title}</h2>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {song.artist && <span className="text-[12px] text-slate-400">{song.artist}</span>}
            {song.key_sig && <span className="text-[11px] font-mono font-bold bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-md border border-brand-200 dark:border-brand-900">{song.key_sig}</span>}
            {song.tempo && <span className="text-[11px] text-slate-400 font-mono">{song.tempo} BPM</span>}
            {song.copyright && <span className="text-[10px] text-slate-400 italic">© {song.copyright}</span>}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0 items-center">
          <div className="flex rounded-lg overflow-hidden border border-surface-muted dark:border-dark-border">
            <button
              onClick={() => setDetailView('list')}
              title="Vista de lista"
              className={cn(
                'px-2.5 py-1.5 transition-colors',
                detailView === 'list'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-dark-surface text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              )}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
            <button
              onClick={() => setDetailView('grid')}
              title="Vista de cuadrícula"
              className={cn(
                'px-2.5 py-1.5 transition-colors border-l border-surface-muted dark:border-dark-border',
                detailView === 'grid'
                  ? 'bg-brand-600 text-white'
                  : 'bg-white dark:bg-dark-surface text-slate-400 hover:text-slate-600 dark:hover:text-slate-300',
              )}
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={() => onEdit(song)}>
            <EditIcon /> Editar
          </Button>

          {isLive ? (
            <button
              onClick={onClearLive}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] font-bold text-white bg-slate-700 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-600 transition-all"
            >
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
              Dejar de presentar
            </button>
          ) : (
            <Button size="md" onClick={() => handleProjectSection(activeSection)}>
              <ProjectIcon /> Proyectar
            </Button>
          )}

          <button
            onClick={() => onOpenProjector(song)}
            title="Modo proyector completo (pantalla completa)"
            className="p-2 text-slate-400 hover:text-brand-500 transition-colors rounded-lg hover:bg-brand-50 dark:hover:bg-brand-950/20"
          >
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3" />
              <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h3" />
              <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>

          <button
            onClick={() => onDelete(song.id)}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {detailView === 'list' && (
        <div className="flex gap-4 flex-1 overflow-hidden">
          <div className="w-56 flex-shrink-0 overflow-y-auto space-y-1.5">
            <SectionLabel className="mb-2">
              Secciones ({allSections.length})
              <span className="ml-1 text-slate-300 dark:text-slate-700 font-normal normal-case tracking-normal">· clic proyecta</span>
            </SectionLabel>

            {allSections.map((section, idx) => (
              <SectionSlide
                key={idx}
                section={section}
                isActive={activeIdx === idx}
                onClick={() => setActiveIdx(idx)}
                onProject={() => handleProjectSection(section)}
              />
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <div className="slide-canvas flex-shrink-0" style={{ maxHeight: '60%' }}>
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
              <span className="absolute top-2.5 left-3 font-mono text-[10px] text-white/20 tracking-wider">PREVIEW</span>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-2 overflow-hidden">
                {activeSection && (
                  <>
                    <p
                      className="text-white font-bold text-center leading-snug whitespace-pre-wrap"
                      style={{
                        fontSize: 'clamp(11px, 2.4vw, 24px)',
                        textShadow: '0 2px 24px rgba(0,0,0,.8)',
                        maxWidth: '100%',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {activeSection.lyrics}
                    </p>
                    <p className="text-white/40 text-center" style={{ fontSize: 'clamp(8px, 1vw, 12px)' }}>
                      {activeSection._isTitleSlide ? activeSection._meta : `${song.title}${song.artist ? ` · ${song.artist}` : ''}`}
                    </p>
                  </>
                )}
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
      <button
        disabled={activeIdx <= 0}
        onClick={onPrev}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold',
          'border transition-all',
          activeIdx <= 0
            ? 'border-surface-muted dark:border-dark-border text-slate-300 dark:text-slate-700 cursor-not-allowed'
            : 'border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300',
          activeIdx > 0 && 'hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20',
        )}
      >
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Anterior
      </button>

      <button
        onClick={onProject}
        className={cn(
          'flex-1 flex items-center justify-center gap-2',
          'py-2.5 rounded-xl text-[13px] font-bold text-white',
          'bg-brand-600 hover:bg-brand-700 transition-all',
          'shadow-brand hover:shadow-brand-lg hover:-translate-y-px active:translate-y-0',
        )}
      >
        <ProjectIcon />
        {label ? `Proyectar "${label}"` : 'Proyectar'}
      </button>

      <button
        disabled={activeIdx >= total - 1}
        onClick={onNext}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold',
          'border transition-all',
          activeIdx >= total - 1
            ? 'border-surface-muted dark:border-dark-border text-slate-300 dark:text-slate-700 cursor-not-allowed'
            : 'border-surface-muted dark:border-dark-border text-slate-600 dark:text-slate-300',
          activeIdx < total - 1 && 'hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20',
        )}
      >
        Siguiente
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
// ─── Song context menu ────────────────────────────────────────────────────────
function SongContextMenu({
  x, y, song, index, total,
  onProject, onEdit, onDelete, onToggleFav, onMoveUp, onMoveDown, onSaveToLibrary, onClose,
}) {
  const ref = useRef(null)

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', handle), 50)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', handle)
    }
  }, [onClose])

  const style = {
    position: 'fixed',
    top: Math.min(y, window.innerHeight - 280),
    left: Math.min(x, window.innerWidth - 220),
    zIndex: 9999,
  }

  const Sep = () => <div className="my-1 h-px bg-surface-muted dark:bg-dark-border mx-2" />

  const MI = ({ icon, label, onClick, danger, disabled }) => (
    <button
      disabled={disabled}
      onClick={() => { onClick(); onClose() }}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-1.5 text-[12.5px] font-medium transition-colors text-left',
        'disabled:opacity-35 disabled:pointer-events-none',
        danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-slate-700 dark:text-slate-300 hover:bg-surface-soft dark:hover:bg-dark-card',
      )}
    >
      {icon && <span className="opacity-60 flex-shrink-0">{icon}</span>}
      {label}
    </button>
  )

  return (
    <div
      ref={ref}
      style={style}
      className="w-52 py-1.5 rounded-xl bg-white dark:bg-dark-surface border border-surface-muted dark:border-dark-border shadow-card-md"
    >
      <div className="px-3 py-2 border-b border-surface-muted dark:border-dark-border mb-1">
        <p className="text-[12px] font-bold text-slate-800 dark:text-slate-200 truncate">{song.title}</p>
        {song.artist && <p className="text-[10px] text-slate-400 truncate">{song.artist}</p>}
      </div>
      <MI icon={<ProjectIcon />} label="Proyectar" onClick={onProject} />
      <MI icon={<EditIcon />} label="Editar" onClick={onEdit} />
      <MI icon={<SaveIcon />} label="Guardar en biblioteca" onClick={onSaveToLibrary} />
      <Sep />
      <MI
        icon={<StarIcon filled={song.is_favorite} />}
        label={song.is_favorite ? 'Quitar de favoritos' : 'Marcar favorito'}
        onClick={onToggleFav}
      />
      <Sep />
      <MI icon={<UpIcon />} label="Subir" onClick={onMoveUp} disabled={index <= 0} />
      <MI icon={<DownIcon />} label="Bajar" onClick={onMoveDown} disabled={index >= total - 1} />
      <Sep />
      <MI icon={<TrashIcon />} label="Eliminar" onClick={onDelete} danger />
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
    <span className="flex-shrink-0 text-slate-300 dark:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mt-0.5">
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
          'group w-full flex items-start gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-100 select-none',
          isDragOver && 'border-brand-400 dark:border-brand-600 bg-brand-50/50 dark:bg-brand-950/20 scale-[1.01]',
          isDragging && 'opacity-25 scale-95',
          isActive && !isDragOver && 'bg-brand-50 dark:bg-brand-950/30 border-brand-200 dark:border-brand-900',
          !isActive && !isDragOver && 'bg-white dark:bg-dark-surface border-transparent hover:border-surface-muted dark:hover:border-dark-border',
        )}
      >
        <DragHandle />
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-[13px] font-semibold truncate',
            isActive ? 'text-brand-700 dark:text-brand-300' : 'text-slate-800 dark:text-slate-200',
          )}>
            {song.title}
          </p>
          {song.artist && <p className="text-[11px] text-slate-400 truncate">{song.artist}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {song.key_sig && (
            <span className="text-[10px] font-mono font-bold bg-surface-soft dark:bg-dark-card text-slate-500 px-1.5 py-0.5 rounded">
              {song.key_sig}
            </span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onToggleFav() }}
            className={cn('transition-colors', song.is_favorite ? 'text-amber-400' : 'text-slate-300 hover:text-amber-400')}
          >
            <StarIcon filled={song.is_favorite} />
          </button>
        </div>
      </div>

      {ctx && (
        <SongContextMenu
          x={ctx.x}
          y={ctx.y}
          song={song}
          index={index}
          total={total}
          onProject={onProject}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggleFav={onToggleFav}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onSaveToLibrary={onSaveToLibrary}
          onClose={() => setCtx(null)}
        />
      )}
    </>
  )
}

export function SongsPage() {
  const { project, liveBg, activeBg, isLive, clearProjection, refreshLibrary } = useApp()

  const [songs, setSongs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [artistFilter, setArtistFilter] = useState('all')
  const [showFavs, setShowFavs] = useState(false)
  const [artists, setArtists] = useState([])

  const [view, setView] = useState('list')
  const [activeSong, setActiveSong] = useState(null)
  const [editSong, setEditSong] = useState(null)

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
    if (activeSong?.id === song.id) return
    const full = await ipc.songs.findById(song.id)
    setActiveSong(full)
  }, [activeSong])

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
    setView('project')
  }, [])

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

  if (view === 'project' && activeSong) {
    return (
      <main className="flex-1 flex overflow-hidden">
        <SongProjector song={activeSong} liveBg={liveBg} activeBg={activeBg} onBack={() => setView('list')} />
      </main>
    )
  }

  return (
    <main className="flex-1 flex overflow-hidden">
      {/* Panel izquierdo */}
      <div className={cn(
        'w-72 flex-shrink-0 flex flex-col border-r overflow-hidden',
        'border-surface-muted dark:border-dark-border',
        'bg-white dark:bg-dark-surface transition-colors',
      )}>
        <div className="p-3 border-b border-surface-muted dark:border-dark-border">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Canciones ({songs.length})</SectionLabel>
            <Button size="sm" onClick={() => { setEditSong(null); setView('edit') }}>
              <PlusIcon /> Nueva
            </Button>
          </div>

          <div className="relative mb-2">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
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
              'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-all',
              showFavs
                ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 border-amber-200 dark:border-amber-900'
                : 'border-surface-muted dark:border-dark-border text-slate-400 hover:text-slate-600',
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
              <div className="w-10 h-10 rounded-xl bg-surface-soft dark:bg-dark-card flex items-center justify-center mx-auto mb-3">
                <MusicIcon />
              </div>
              <p className="text-[13px] text-slate-400">
                {search ? 'Sin resultados' : 'No hay canciones aún'}
              </p>
              {!search && (
                <button
                  onClick={() => { setEditSong(null); setView('edit') }}
                  className="text-[12px] text-brand-500 hover:text-brand-600 mt-1.5"
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
      </div>

      {/* Panel derecho */}
      <div className="flex-1 flex flex-col overflow-hidden p-5 gap-4">
        {activeSong ? (
          <SongDetail
            song={activeSong}
            liveBg={liveBg}
            activeBg={activeBg}
            isLive={isLive}
            onOpenProjector={handleProject}
            onEdit={async (s) => {
              const full = await ipc.songs.findById(s.id)
              setEditSong(full)
              setView('edit')
            }}
            onDelete={handleDelete}
            onClearLive={clearProjection}
            onProjectSection={(section) => {
              if (section._raw) {
                project(section.lyrics, liveBg)
              } else {
                const meta = `— ${activeSong.title}${activeSong.artist ? ` · ${activeSong.artist}` : ''}`
                project(`${section.lyrics}\n\n${meta}`, liveBg)
              }
            }}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-surface-soft dark:bg-dark-card flex items-center justify-center">
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