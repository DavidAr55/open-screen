import { cn } from '@shared/utils/cn.js'

const BADGE_VARIANTS = {
  default: 'bg-surface-3 text-ink-3 border border-line-1',
  neutral: 'bg-surface-3 text-ink-3 border border-line-1',
  primary: 'bg-primary-500/10 text-primary-500 border border-primary-500/30',
  live:    'bg-live-500/10 text-live-500 border border-live-500/30',
  warn:    'bg-warn-500/10 text-warn-600 border border-warn-500/30',
}

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5',
        'text-[10px] font-semibold font-mono tracking-[1px] uppercase rounded-btn',
        BADGE_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Rojo = en vivo (identidad broadcast); gris = sin señal.
export function LiveBadge({ live }) {
  return (
    <Badge variant={live ? 'live' : 'default'}>
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full bg-current',
          live && 'animate-blink',
        )}
      />
      {live ? 'En vivo' : 'Sin señal'}
    </Badge>
  )
}
