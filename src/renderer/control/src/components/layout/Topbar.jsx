import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import { Button, LiveBadge } from '@shared/components/ui/index.jsx'
import { cn } from '@shared/utils/cn.js'
import { BackgroundsPanel } from '../backgound/BackgroundsPanel.jsx'

const SunIcon  = () => <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
const MoonIcon = () => <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>

export function Topbar() {
  const { theme, setTheme, isLive, clearProjection, displays, activeBg } = useApp()
  const [showBgPanel, setShowBgPanel] = useState(false)
  const isDark = theme === 'dark'

  const secondary    = displays.find(d => !d.isPrimary)
  const monitorLabel = secondary ? `${displays.length} monitores` : `${displays.length} monitor`

  const bgPreviewStyle = (() => {
    if (!activeBg) return { background: 'radial-gradient(ellipse at 50% 35%, #1c0a0a, #000)' }
    if (activeBg.type === 'color' || activeBg.type === 'gradient' || activeBg.type === 'css') return { background: activeBg.value }
    if ((activeBg.type === 'image' || activeBg.type === 'gif') && (activeBg.thumbnail || activeBg.value)) {
      return { backgroundImage: `url(${activeBg.thumbnail || activeBg.value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    }
    return { background: '#111' }
  })()

  return (
    <>
      <header className={cn(
        'h-[54px] flex items-center px-5 gap-4 flex-shrink-0 z-10',
        'bg-white dark:bg-dark-surface',
        'border-b border-surface-muted dark:border-dark-border',
        'transition-colors duration-300',
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 w-56 flex-shrink-0 select-none">
          <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 304 304" xmlns="http://www.w3.org/2000/svg">
            <rect width="304" height="304" rx="39.72" fill="#10141e"/>
            <path fill="#5c6476" d="M228.19,71Q169,71,109.71,71h-4.92C109,81.77,109,81.77,119.5,81.77q55,0,110,0c10.2,0,16.81,7.43,15.92,17.48-.23,2.48-.38,5-.4,7.47-.2,27.3,1.12,54.61,0,81.92-.42,10.54-6,16.5-16.39,16.5q-74.48.06-149,0c-10.54,0-16.31-5.84-16.31-16.4,0-17.49-.15-35,.12-52.48.08-4.9-.69-7.94-6.09-9.36S52,125,52,130.55c-.08,19.83-.2,39.65,0,59.48.13,15.13,11.34,26,26.44,26q75,0,150,0c17.3,0,28-10.74,28-28.1q.06-44.24,0-88.47C256.4,81.75,245.78,71,228.19,71z"/>
            <path fill="#ad1e24" d="M197.49,106.65c0-7.07-1.83-8.62-8.77-7.23-14.2,2.84-28.36,5.83-42.56,8.62-4.7.92-6.75,3.35-6.74,8.24,0,12.49-.4,25-.41,37.46,0,3.42-.92,4.81-4.53,4.58a20.57,20.57,0,0,0-7.37,1c-5.52,1.75-9.86,5.11-11.22,11-1.22,5.33-.33,10.45,4.14,14.11,6.15,5.06,13.2,5.23,20.25,2.4,6.8-2.72,9.65-8.08,9.5-15.43-.24-11.83-.11-23.66-.13-35.49,0-2-.21-4.12,2.54-4.67q15.66-3.1,31.32-6.24c2.2-.43,3.34.28,3.57,2.78a120.29,120.29,0,0,1,.22,14.46c-.11,3.74-1.25,5.42-5.32,4.94-4.46-.52-8.59,1.05-12.28,3.48a13.84,13.84,0,0,0-1.13,22.62c6,4.75,12.73,4.59,19.37,1.74,6.37-2.74,9.78-7.71,9.7-14.91-.11-9,0-18,0-27h-.11Q197.5,119.9,197.49,106.65z"/>
            <path fill="#5c6476" d="M196.68,226q-42.69.19-85.37.06c-3.7,0-6.27.74-6.14,5.1.11,3.94,1.52,5.92,6,5.84,3.57-.07,7.15-.1,10.73-.13,10.73-.06,21.46,0,32.2,0s21.21,0,31.82,0c3.54,0,7.07,0,10.61.05,3.79,0,6.64-.52,6.73-5.15S201,226,196.68,226z"/>
            <circle fill="#ad1e24" opacity=".5" cx="70.94" cy="90.34" r="23.35"/>
            <circle fill="#ad1e24" cx="71.35" cy="89.79" r="18.2"/>
          </svg>
          <span className="font-extrabold text-[15px] tracking-tight text-slate-900 dark:text-white">Open Screen</span>
        </div>

        <h1 className="font-bold text-base text-slate-700 dark:text-slate-300">Panel de control</h1>

        <div className="ml-auto flex items-center gap-3">
          {/* Monitor badge */}
          <span className="font-mono text-[11px] px-2.5 py-1 rounded-full bg-surface-soft dark:bg-dark-card border border-surface-muted dark:border-dark-border text-slate-400 dark:text-slate-500 select-none">
            {displays.length > 0 ? monitorLabel : 'Cargando…'}
          </span>

          {/* Botón Fondos */}
          <button
            onClick={() => setShowBgPanel(v => !v)}
            title="Editor de fondos de proyección"
            className={cn(
              'flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border transition-all',
              showBgPanel
                ? 'border-brand-400 dark:border-brand-600 bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400'
                : 'border-surface-muted dark:border-dark-border text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-brand-300 dark:hover:border-brand-700',
            )}
          >
            <div
              className="w-8 h-5 rounded-md border border-slate-300/20 dark:border-white/10 overflow-hidden flex-shrink-0"
              style={bgPreviewStyle}
            />
            <span className="text-[11px] font-semibold">Fondo</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className={cn('transition-transform duration-200', showBgPanel && 'rotate-180')}>
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          {/* Theme toggle */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-300 dark:text-slate-600"><SunIcon /></span>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={cn('relative w-9 h-5 rounded-full transition-colors duration-200', isDark ? 'bg-brand-600' : 'bg-slate-200')}
              title="Cambiar tema"
            >
              <span className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200', isDark && 'translate-x-4')} />
            </button>
            <span className="text-slate-300 dark:text-slate-600"><MoonIcon /></span>
          </div>

          <LiveBadge live={isLive} />

          <Button variant="danger" size="sm" onClick={clearProjection}>
            <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
            </svg>
            Limpiar pantalla
          </Button>
        </div>
      </header>

      {showBgPanel && <BackgroundsPanel onClose={() => setShowBgPanel(false)} />}
    </>
  )
}