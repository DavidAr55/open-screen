import { useApp } from '../../context/AppContext.jsx'
import { Card, SectionLabel, LiveBadge } from '@shared/components/ui/index.jsx'
import { BG_STYLES } from '../editor/SlideEditor.jsx'
import { cn } from '@shared/utils/cn.js'

export function LivePanel() {
  const { isLive, liveText, liveBg, projCount, library, displays, project } = useApp()

  const secondary = displays.find(d => !d.isPrimary)
  const outputLabel = secondary
    ? `Monitor ${secondary.id} — ${secondary.bounds.width}×${secondary.bounds.height}`
    : 'Monitor principal'

  const thumbStyle = {
    background: BG_STYLES[liveBg] ?? BG_STYLES.dark,
  }

  return (
    <aside className={cn(
      'w-60 flex-shrink-0 flex flex-col p-3.5 gap-3 overflow-y-auto',
      'border-l border-surface-muted dark:border-dark-border',
      'transition-colors duration-300',
    )}>

      {/* Monitor en vivo */}
      <Card className="p-3 animate-fade-up">
        <div className="flex items-center justify-between mb-2.5">
          <SectionLabel>En vivo</SectionLabel>
          <LiveBadge live={isLive} />
        </div>

        {/* Thumbnail */}
        <div className="monitor-thumb mb-2.5">
          <div className="absolute inset-0 transition-all duration-500" style={thumbStyle} />
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <p
              className={cn(
                'font-bold text-center leading-tight whitespace-pre-wrap transition-colors',
                isLive ? 'text-white' : 'text-white/15',
              )}
              style={{ fontSize: '7px' }}
            >
              {isLive ? liveText : '— vacío —'}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 dark:text-slate-600">
          Salida:{' '}
          <span className="font-semibold text-slate-500 dark:text-slate-500">
            {outputLabel}
          </span>
        </p>
      </Card>

      {/* Estadísticas de sesión */}
      <Card className="p-3 animate-fade-up-2">
        <SectionLabel className="mb-2">Sesión</SectionLabel>
        <div className="stat-row">
          <span>Proyecciones</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{projCount}</span>
        </div>
        <div className="stat-row">
          <span>En biblioteca</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">{library.length}</span>
        </div>
        <div className="stat-row">
          <span>Monitores</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {displays.length || '—'}
          </span>
        </div>
      </Card>

      {/* Recientes */}
      <div className="animate-fade-up-2">
        <SectionLabel className="mb-2">Recientes</SectionLabel>
        <div className="flex flex-col gap-1.5">
          {library.slice(0, 5).map(item => (
            <button
              key={item.id}
              onClick={() => project(item.content, liveBg)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-btn text-[12px] font-semibold',
                'bg-brand-50 dark:bg-brand-950/20',
                'text-brand-600 dark:text-brand-400',
                'border border-brand-100 dark:border-brand-900',
                'truncate transition-all',
                'hover:bg-brand-100 dark:hover:bg-brand-950/40',
              )}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
