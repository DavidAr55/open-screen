import { useState, useEffect } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { FieldLabel, InspectorSection } from '@shared/components/ui/index.jsx'
import { SlideCanvas } from '@shared/components/SlideCanvas.jsx'
import { watermarkPreviewStyle } from '@shared/constants/watermark.js'
import { Timer } from '../layout/Timer.jsx'
import { cn } from '@shared/utils/cn.js'

function formatTimecode(totalSeconds) {
  const s   = Math.max(0, totalSeconds)
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(sec)}`
}

/**
 * Rail derecho estilo inspector: PREVIEW (lo próximo) + SALIDA EN VIVO
 * (con timecode) + temporizador + sesión + recientes.
 */
export function Inspector() {
  const {
    isLive, liveText, nextText, activeBg, projCount, library, displays,
    project, projectionFontFamily, projFontSize, watermark, liveSince,
  } = useApp()

  // Ticker del timecode — solo corre mientras hay proyección activa
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!isLive || !liveSince) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isLive, liveSince])

  const elapsed = isLive && liveSince ? Math.floor((now - liveSince) / 1000) : 0

  const secondary = displays.find(d => !d.isPrimary)
  const outputLabel = secondary
    ? `Monitor ${secondary.id} — ${secondary.bounds.width}×${secondary.bounds.height}`
    : 'Monitor principal'

  return (
    <aside className={cn(
      'w-72 flex-shrink-0 flex flex-col p-3 gap-4 overflow-y-auto',
      'bg-surface-1 border-l border-line-1',
      'transition-colors duration-300',
    )}>
      {/* Preview — lo que viene después (lo alimenta la página activa) */}
      <InspectorSection title="Preview" className="animate-fade-up">
        <SlideCanvas
          bg={activeBg}
          text={nextText}
          fontFamily={projectionFontFamily}
          fontSizeMode={projFontSize}
          empty="— nada en cola —"
          className="shadow-none"
        />
      </InspectorSection>

      {/* Salida en vivo */}
      <section className="animate-fade-up-2">
        <div className="flex items-center justify-between mb-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[1.2px] uppercase',
            isLive ? 'text-live-500' : 'text-ink-3',
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full bg-current', isLive && 'animate-blink')} />
            {isLive ? 'Salida en vivo' : 'Sin señal'}
          </span>
          <span className="font-mono text-[10px] tabular-nums text-ink-3 select-none">
            {formatTimecode(elapsed)}
          </span>
        </div>

        <SlideCanvas
          bg={activeBg}
          text={isLive ? liveText : ''}
          fontFamily={projectionFontFamily}
          fontSizeMode={projFontSize}
          empty="— vacío —"
          className="shadow-none"
        >
          {watermark?.enabled && watermark.image && (
            <img src={watermark.image} alt="" className="absolute pointer-events-none select-none"
              style={watermarkPreviewStyle(watermark, 3)} />
          )}
        </SlideCanvas>

        {/* Barra de actividad */}
        <div className="h-0.5 mt-1.5 rounded-full bg-surface-3 overflow-hidden">
          <div className={cn(
            'h-full rounded-full bg-live-500 transition-all duration-500',
            isLive ? 'w-full animate-blink' : 'w-0',
          )} />
        </div>

        <p className="text-[10.5px] text-ink-4 mt-1.5">
          Salida: <span className="font-mono text-ink-3">{outputLabel}</span>
        </p>
      </section>

      {/* Temporizador del operador */}
      <InspectorSection title="Temporizador" className="animate-fade-up-2">
        <Timer />
      </InspectorSection>

      {/* Estadísticas de sesión */}
      <InspectorSection title="Sesión" className="animate-fade-up-3">
        <div>
          <div className="stat-row">
            <span>Proyecciones</span>
            <span className="font-mono font-bold text-ink-1 tabular-nums">{projCount}</span>
          </div>
          <div className="stat-row">
            <span>En biblioteca</span>
            <span className="font-mono font-bold text-ink-1 tabular-nums">{library.length}</span>
          </div>
          <div className="stat-row">
            <span>Monitores</span>
            <span className="font-mono font-bold text-ink-1 tabular-nums">{displays.length || '—'}</span>
          </div>
        </div>
      </InspectorSection>

      {/* Recientes */}
      <InspectorSection title="Recientes" className="animate-fade-up-3">
        <div className="flex flex-col gap-1.5">
          {library.length === 0 && (
            <p className="text-[11px] text-ink-4">Guarda elementos en la biblioteca para verlos aquí.</p>
          )}
          {library.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => project(item.content)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-btn text-[12px] font-semibold',
                'bg-primary-500/10 text-primary-500',
                'border border-primary-500/20',
                'truncate transition-all',
                'hover:bg-primary-500/20',
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </InspectorSection>
    </aside>
  )
}
