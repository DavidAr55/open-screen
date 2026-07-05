import { useState, useEffect, useMemo } from 'react'
import { Button, Input, Spinner, SectionLabel } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'

const BackIcon    = () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const SplitIcon   = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M6 3v18M18 3v18M6 12h12"/></svg>
const MusicIcon   = () => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>

const firstLine = (text) => (text || '').split('\n').map(l => l.trim()).find(Boolean) ?? ''

/**
 * Parte la lista de slides incluidas en grupos según los índices marcados
 * como "dividir antes de este slide".
 */
function buildGroups(slides, breakpoints) {
  const included = slides.filter(s => s.include)
  const groups = []
  let current = []

  for (const slide of included) {
    if (current.length && breakpoints.has(slide.index)) {
      groups.push(current)
      current = []
    }
    current.push(slide)
  }
  if (current.length) groups.push(current)

  return groups
}

export function PptxImportView({ onDone, onCancel }) {
  const [phase, setPhase]     = useState('picking') // picking | loading | preview | importing | error
  const [fileName, setFileName] = useState('')
  const [slides, setSlides]   = useState([]) // { index, text, include }
  const [breakpoints, setBreakpoints] = useState(new Set())
  const [titles, setTitles]   = useState({}) // groupIdx -> { title, artist }
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      const path = await window.api?.songs.pickPptx()
      if (cancelled) return
      if (!path) { onCancel(); return }

      setPhase('loading')
      const result = await window.api?.songs.parsePptx(path)
      if (cancelled) return

      if (!result || result.error) {
        setError(result?.error ?? 'No se pudo leer el archivo.')
        setPhase('error')
        return
      }

      setFileName(result.name)
      setSlides(
        (result.slides ?? []).map(s => ({ ...s, include: s.text.trim().length > 0 }))
      )
      setPhase('preview')
    }

    run()
    return () => { cancelled = true }
  }, [])

  const groups = useMemo(() => buildGroups(slides, breakpoints), [slides, breakpoints])

  const toggleInclude = (index) => {
    setSlides(prev => prev.map(s => s.index === index ? { ...s, include: !s.include } : s))
  }

  const toggleBreakpoint = (index) => {
    setBreakpoints(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const getGroupInfo = (groupIdx, group) => {
    const stored = titles[groupIdx]
    if (stored) return stored
    return {
      title:  firstLine(group[0]?.text).slice(0, 60) || `Canción ${groupIdx + 1}`,
      artist: '',
    }
  }

  const updateGroupInfo = (groupIdx, field, value) => {
    setTitles(prev => ({
      ...prev,
      [groupIdx]: { ...getGroupInfo(groupIdx, groups[groupIdx]), [field]: value },
    }))
  }

  const handleImport = async () => {
    setPhase('importing')
    try {
      let lastSong = null
      for (let g = 0; g < groups.length; g++) {
        const group = groups[g]
        const info  = getGroupInfo(g, group)
        if (!info.title.trim()) continue

        const sections = group.map((slide, i) => ({
          type:   'verse',
          label:  `Verso ${i + 1}`,
          lyrics: slide.text,
        }))

        lastSong = await window.api?.songs.create({
          title:  info.title.trim(),
          artist: info.artist.trim(),
          sections,
        })
      }
      onDone(lastSong)
    } catch (e) {
      console.error('[PptxImportView] Error al importar:', e)
      setError('Error al crear las canciones. Revisa la consola.')
      setPhase('preview')
    }
  }

  if (phase === 'picking' || phase === 'loading') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Spinner size={24} />
        <p className="text-sm">{phase === 'picking' ? 'Selecciona un archivo .pptx…' : 'Leyendo diapositivas…'}</p>
      </main>
    )
  }

  if (phase === 'error') {
    return (
      <main className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
        <p className="text-red-500 font-semibold">{error}</p>
        <Button variant="secondary" onClick={onCancel}>Volver</Button>
      </main>
    )
  }

  const includedCount = slides.filter(s => s.include).length

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-surface-muted dark:border-dark-border flex-shrink-0">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
          <BackIcon />
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-slate-900 dark:text-white truncate">{fileName}</p>
          <p className="text-[11px] text-slate-400">
            {includedCount} de {slides.length} diapositivas incluidas · {groups.length} {groups.length === 1 ? 'canción' : 'canciones'}
          </p>
        </div>
        <Button onClick={handleImport} disabled={phase === 'importing' || groups.length === 0}>
          {phase === 'importing' ? <Spinner size={14} className="text-white" /> : <MusicIcon />}
          {phase === 'importing' ? 'Importando…' : `Importar ${groups.length} ${groups.length === 1 ? 'canción' : 'canciones'}`}
        </Button>
      </div>

      {error && (
        <div className="px-5 py-2 bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900 flex-shrink-0">
          <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Lista de slides */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <SectionLabel className="mb-1">Diapositivas</SectionLabel>
          {slides.map((slide, i) => (
            <div key={slide.index}>
              <div
                className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border transition-all',
                  slide.include
                    ? 'bg-white dark:bg-dark-surface border-surface-muted dark:border-dark-border'
                    : 'bg-slate-50 dark:bg-dark-card/40 border-transparent opacity-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={slide.include}
                  onChange={() => toggleInclude(slide.index)}
                  className="mt-1 flex-shrink-0"
                />
                <span className="text-[10px] font-mono font-bold text-slate-400 mt-1 flex-shrink-0 w-6">
                  {slide.index + 1}
                </span>
                <p className="flex-1 text-[12.5px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {slide.text || <span className="italic text-slate-400">(sin texto — probablemente solo imagen)</span>}
                </p>
              </div>

              {i < slides.length - 1 && slide.include && slides[i + 1]?.include && (
                <div className="flex items-center justify-center py-1">
                  <button
                    onClick={() => toggleBreakpoint(slides[i + 1].index)}
                    title="Marcar como inicio de una nueva canción"
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all',
                      breakpoints.has(slides[i + 1].index)
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'text-slate-400 border-surface-muted dark:border-dark-border hover:border-brand-300 hover:text-brand-500',
                    )}
                  >
                    <SplitIcon />
                    {breakpoints.has(slides[i + 1].index) ? 'Nueva canción aquí' : 'Dividir aquí'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Panel de canciones a crear */}
        <div className="w-80 flex-shrink-0 border-l border-surface-muted dark:border-dark-border overflow-y-auto p-4 space-y-3">
          <SectionLabel className="mb-1">Canciones a crear ({groups.length})</SectionLabel>
          {groups.length === 0 && (
            <p className="text-[12px] text-slate-400">Incluye al menos una diapositiva con texto.</p>
          )}
          {groups.map((group, g) => {
            const info = getGroupInfo(g, group)
            return (
              <div key={g} className="p-3 rounded-xl border border-surface-muted dark:border-dark-border bg-white dark:bg-dark-surface space-y-2">
                <p className="text-[10px] font-mono font-bold text-slate-400">
                  {group.length} {group.length === 1 ? 'diapositiva' : 'diapositivas'}
                </p>
                <Input
                  placeholder="Título de la canción"
                  value={info.title}
                  onChange={e => updateGroupInfo(g, 'title', e.target.value)}
                  className="text-[13px] font-semibold"
                />
                <Input
                  placeholder="Artista (opcional)"
                  value={info.artist}
                  onChange={e => updateGroupInfo(g, 'artist', e.target.value)}
                  className="text-[12px]"
                />
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
