import { cn } from '@shared/utils/cn.js'

const BUTTON_VARIANTS = {
  // Tonal azul pastel — botón primario de la identidad
  primary: [
    'bg-primary-200 text-neutral-950',
    'hover:bg-primary-300 active:bg-primary-200',
  ].join(' '),

  secondary: [
    'bg-surface-3 text-ink-2',
    'border border-line-1',
    'hover:border-line-2 hover:text-ink-1',
  ].join(' '),

  outline: [
    'bg-transparent text-ink-2',
    'border border-line-2',
    'hover:border-ink-4 hover:text-ink-1',
  ].join(' '),

  danger: [
    'bg-live-500/10 text-live-500',
    'border border-live-500/30',
    'hover:bg-live-500/20',
  ].join(' '),

  // Rojo sólido — exclusivo para GO LIVE / estado en vivo
  live: [
    'bg-live-500 text-white',
    'hover:bg-live-600',
    'shadow-[0_2px_10px_-2px_rgb(255_59_48/.5)]',
  ].join(' '),

  ghost: [
    'text-ink-3',
    'hover:bg-surface-3 hover:text-ink-1',
  ].join(' '),

  // Crema — botón invertido de la identidad
  inverted: [
    'bg-cream text-neutral-950',
    'hover:bg-cream-soft',
  ].join(' '),
}

const BUTTON_SIZES = {
  sm: 'text-xs px-3 py-1.5 rounded-btn gap-1.5',
  md: 'text-[13px] px-4 py-2 rounded-btn gap-2',
  lg: 'text-sm px-5 py-2.5 rounded-panel gap-2',
}

export function Button({
  children,
  variant = 'primary',
  size    = 'md',
  className,
  disabled,
  ...props
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-semibold',
        'transition-all duration-150 select-none whitespace-nowrap',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
        'disabled:opacity-50 disabled:pointer-events-none',
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}
