import { useState, useEffect } from 'react'
import { cn } from '@shared/utils/cn.js'

const PlayIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 3 20 12 6 21 6 3"/></svg>
const PauseIcon = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const ResetIcon = () => <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 3 3 8 8 8"/></svg>
const ClockIcon = () => <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>

const COUNTDOWN_PRESETS = [5, 10, 15, 20, 30, 45, 60] // minutos

function formatTime(totalSeconds) {
  const sign = totalSeconds < 0 ? '-' : ''
  const s    = Math.abs(totalSeconds)
  const h    = Math.floor(s / 3600)
  const m    = Math.floor((s % 3600) / 60)
  const sec  = s % 60
  const pad  = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${sign}${pad(h)}:${pad(m)}:${pad(sec)}` : `${sign}${pad(m)}:${pad(sec)}`
}

// Temporizador solo para el operador — no se persiste ni se proyecta.
export function Timer() {
  const [mode,         setMode]         = useState('stopwatch') // 'stopwatch' | 'countdown'
  const [countdownMin, setCountdownMin] = useState(20)
  const [running,      setRunning]      = useState(false)
  const [elapsed,      setElapsed]      = useState(0) // segundos transcurridos
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(id)
  }, [running])

  const reset = () => { setRunning(false); setElapsed(0) }

  const remaining  = countdownMin * 60 - elapsed
  const display    = mode === 'countdown' ? formatTime(remaining) : formatTime(elapsed)
  const isOvertime = mode === 'countdown' && remaining < 0

  return (
    <div className="relative">
      <div className={cn(
        'flex items-center gap-1.5 pl-2.5 pr-1.5 py-2 rounded-btn border transition-all select-none',
        isOvertime
          ? 'border-live-500/40 bg-live-500/10 text-live-500'
          : running
            ? 'border-live-500/30 text-ink-2'
            : 'border-line-1 text-ink-3',
      )}>
        <button onClick={() => setShowSettings(v => !v)} title="Configurar temporizador" className="hover:text-primary-500 transition-colors">
          <ClockIcon />
        </button>
        <span className={cn(
          'flex-1 font-mono text-[13px] font-bold tabular-nums text-center',
          running && !isOvertime && 'text-ink-1',
        )}>
          {display}
        </span>
        <button onClick={() => setRunning(r => !r)} title={running ? 'Pausar' : 'Iniciar'}
          className={cn(
            'p-1.5 rounded-[3px] transition-colors',
            running ? 'text-live-500 hover:bg-live-500/10' : 'hover:bg-surface-3 hover:text-primary-500',
          )}>
          {running ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={reset} title="Reiniciar"
          className="p-1.5 rounded-[3px] hover:bg-surface-3 hover:text-primary-500 transition-colors">
          <ResetIcon />
        </button>
      </div>

      {showSettings && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setShowSettings(false)} />
          <div className="absolute top-full mt-2 right-0 z-[1000] w-52 p-3 rounded-panel bg-surface-1 border border-line-1 shadow-card-md animate-modal-in">
            <div className="flex gap-0.5 p-0.5 rounded-btn bg-surface-0 border border-line-1 mb-2">
              {['stopwatch', 'countdown'].map(m => (
                <button key={m} onClick={() => { setMode(m); reset() }}
                  className={cn(
                    'flex-1 py-1 rounded-[3px] text-[10px] font-mono font-semibold uppercase tracking-[0.5px] transition-all',
                    mode === m ? 'bg-surface-3 text-ink-1 border border-line-2' : 'text-ink-4 border border-transparent',
                  )}>
                  {m === 'stopwatch' ? 'Crono' : 'Regresiva'}
                </button>
              ))}
            </div>
            {mode === 'countdown' && (
              <div className="grid grid-cols-4 gap-1">
                {COUNTDOWN_PRESETS.map(min => (
                  <button key={min} onClick={() => { setCountdownMin(min); reset() }}
                    className={cn(
                      'text-[10px] font-mono font-semibold py-1 rounded-[3px] transition-all',
                      countdownMin === min ? 'bg-primary-500 text-white' : 'bg-surface-3 text-ink-3 hover:text-primary-500',
                    )}>
                    {min}m
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
