import { cn } from '@shared/utils/cn.js'

// Chips de icono con tinte pastel — idénticos en ambos temas (identidad).
const ICON_VARIANTS = {
  primary: 'bg-primary-200 text-primary-800 hover:bg-primary-300',
  danger:  'bg-live-200 text-live-700 hover:bg-live-300',
  warn:    'bg-warn-200 text-warn-700 hover:bg-warn-300',
  neutral: 'bg-surface-3 text-ink-2 border border-line-1 hover:text-ink-1 hover:border-line-2',
  ghost:   'text-ink-3 hover:bg-surface-3 hover:text-ink-1',
}

const ICON_SIZES = {
  sm: 'w-7 h-7',
  md: 'w-9 h-9',
}

export function IconButton({
  children,
  variant = 'neutral',
  size    = 'md',
  active  = false,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center flex-shrink-0 rounded-panel',
        'transition-all duration-150 select-none',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
        'disabled:opacity-50 disabled:pointer-events-none',
        ICON_VARIANTS[variant],
        ICON_SIZES[size],
        active && 'ring-2 ring-primary-500/60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
