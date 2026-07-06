import { useState, useEffect } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { LiveBadge } from '@shared/components/ui/index.jsx'
import { buildFontFamily } from '@shared/utils/font.js'

function useClock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

// ─── Vista de escenario ────────────────────────────────────────────────────────
// Panel de solo lectura pensado para que el presentador vea qué está proyectado
// (y qué sigue) sin depender de la pantalla de la audiencia.
// SIEMPRE oscuro (monitor de confianza) — usa solo tokens absolutos (neutral/live),
// nunca variables semánticas, para que el tema claro no se filtre aquí.
export function StagePage() {
  const { isLive, liveText, nextText, projectionFontFamily } = useApp()
  const now = useClock()
  const timeStr = now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <main className="flex-1 flex flex-col bg-neutral-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/10 flex-shrink-0">
        <span className="font-mono text-2xl font-bold tracking-wider text-white/90 tabular-nums">{timeStr}</span>
        <LiveBadge live={isLive} />
      </div>

      {/* Texto en vivo */}
      <div className="flex-1 flex items-center justify-center px-12 py-8 overflow-hidden">
        {liveText ? (
          <p className="text-center font-extrabold leading-snug whitespace-pre-wrap"
             style={{ fontFamily: buildFontFamily(projectionFontFamily), fontSize: 'clamp(28px, 5vw, 64px)' }}>
            {liveText}
          </p>
        ) : (
          <p className="text-white/30 text-xl font-semibold">Sin proyección en vivo</p>
        )}
      </div>

      {/* Próximo */}
      <div className="flex-shrink-0 border-t border-white/10 px-8 py-4 flex items-center gap-3">
        <span className="text-[10px] font-mono font-semibold uppercase tracking-[1.5px] text-white/40">Próximo</span>
        <span className="text-sm font-semibold text-white/70 truncate">
          {nextText || '—'}
        </span>
      </div>
    </main>
  )
}
