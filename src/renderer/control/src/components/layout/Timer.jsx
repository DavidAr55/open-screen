import { useState, useEffect, useRef } from 'react'
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
    <div className="relative flex items-center">
      <div className={cn(
        'flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-xl border transition-all select-none',
        isOvertime
          ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
          : 'border-surface-muted dark:border-dark-border text-slate-500 dark:text-slate-400',
      )}>
        <button onClick={() => setShowSettings(v => !v)} title="Configurar temporizador" className="hover:text-brand-500 transition-colors">
          <ClockIcon />
        </button>
        <span className="font-mono text-[12px] font-bold tabular-nums min-w-[52px] text-center">{display}</span>
        <button onClick={() => setRunning(r => !r)} title={running ? 'Pausar' : 'Iniciar'}
          className="p-1 rounded-lg hover:bg-surface-soft dark:hover:bg-dark-card hover:text-brand-500 transition-colors">
          {running ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={reset} title="Reiniciar"
          className="p-1 rounded-lg hover:bg-surface-soft dark:hover:bg-dark-card hover:text-brand-500 transition-colors">
          <ResetIcon />
        </button>
      </div>

      {showSettings && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setShowSettings(false)} />
          <div className="absolute top-full mt-2 right-0 z-[1000] w-48 p-3 rounded-xl bg-white dark:bg-dark-surface border border-surface-muted dark:border-dark-border shadow-card-md">
            <div className="flex gap-1 p-1 rounded-lg bg-surface-soft dark:bg-dark-card mb-2">
              {['stopwatch', 'countdown'].map(m => (
                <button key={m} onClick={() => { setMode(m); reset() }}
                  className={cn(
                    'flex-1 py-1 rounded-md text-[11px] font-semibold transition-all',
                    mode === m ? 'bg-white dark:bg-dark-surface text-slate-900 dark:text-white shadow-sm' : 'text-slate-400',
                  )}>
                  {m === 'stopwatch' ? 'Cronómetro' : 'Cuenta regresiva'}
                </button>
              ))}
            </div>
            {mode === 'countdown' && (
              <div className="grid grid-cols-4 gap-1">
                {COUNTDOWN_PRESETS.map(min => (
                  <button key={min} onClick={() => { setCountdownMin(min); reset() }}
                    className={cn(
                      'text-[10px] font-semibold py-1 rounded-md transition-all',
                      countdownMin === min ? 'bg-brand-600 text-white' : 'bg-surface-soft dark:bg-dark-card text-slate-500 hover:text-brand-600',
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
