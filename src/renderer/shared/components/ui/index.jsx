import { cn } from '@shared/utils/cn.js'

// ─────────────────────────────────────────────────────────────
//  Button
// ─────────────────────────────────────────────────────────────
const BUTTON_VARIANTS = {
  primary: [
    'bg-brand-600 text-white shadow-brand',
    'hover:bg-brand-700 hover:shadow-brand-lg hover:-translate-y-px',
    'active:translate-y-0',
  ].join(' '),

  secondary: [
    'bg-surface-soft dark:bg-dark-card text-slate-600 dark:text-slate-300',
    'border border-surface-muted dark:border-dark-border',
    'hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-white',
  ].join(' '),

  danger: [
    'bg-red-50 dark:bg-red-950/40 text-brand-600 dark:text-brand-400',
    'border border-red-200 dark:border-red-900',
    'hover:bg-red-100 dark:hover:bg-red-950/60',
  ].join(' '),

  ghost: [
    'text-slate-500 dark:text-slate-400',
    'hover:bg-surface-soft dark:hover:bg-dark-card hover:text-slate-900 dark:hover:text-white',
  ].join(' '),
}

const BUTTON_SIZES = {
  sm: 'text-xs px-3 py-1.5 rounded-btn gap-1.5',
  md: 'text-sm px-4 py-2   rounded-btn gap-2',
  lg: 'text-sm px-5 py-2.5 rounded-card gap-2',
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

// ─────────────────────────────────────────────────────────────
//  Card
// ─────────────────────────────────────────────────────────────
export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-dark-surface',
        'border border-surface-muted dark:border-dark-border',
        'rounded-card shadow-card',
        'transition-colors duration-300',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Badge
// ─────────────────────────────────────────────────────────────
const BADGE_VARIANTS = {
  default: 'bg-surface-soft dark:bg-dark-card text-slate-500 dark:text-slate-400 border border-surface-muted dark:border-dark-border',
  brand:   'bg-brand-50   dark:bg-brand-950/30 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900',
  green:   'bg-green-50   dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900',
  red:     'bg-red-50     dark:bg-red-950/30   text-red-700   dark:text-red-400   border border-red-200   dark:border-red-900',
}

export function Badge({ children, variant = 'default', className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5',
        'text-[11px] font-semibold font-mono tracking-wide uppercase rounded-full',
        BADGE_VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
//  LiveBadge
// ─────────────────────────────────────────────────────────────
export function LiveBadge({ live }) {
  return (
    <Badge variant={live ? 'green' : 'default'}>
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

// ─────────────────────────────────────────────────────────────
//  Input
// ─────────────────────────────────────────────────────────────
export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 text-sm rounded-btn',
        'bg-surface-soft dark:bg-dark-card',
        'border border-surface-muted dark:border-dark-border',
        'text-slate-900 dark:text-slate-100',
        'placeholder:text-slate-400 dark:placeholder:text-slate-600',
        'outline-none transition-all',
        'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10',
        className,
      )}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────
//  Textarea
// ─────────────────────────────────────────────────────────────
export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2.5 text-sm rounded-btn resize-none leading-relaxed',
        'bg-surface-soft dark:bg-dark-card',
        'border border-surface-muted dark:border-dark-border',
        'text-slate-900 dark:text-slate-100',
        'placeholder:text-slate-400 dark:placeholder:text-slate-600',
        'outline-none transition-all',
        'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10',
        className,
      )}
      {...props}
    />
  )
}

// ─────────────────────────────────────────────────────────────
//  Select
// ─────────────────────────────────────────────────────────────
export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        'px-3 py-2 text-sm rounded-btn cursor-pointer',
        'bg-surface-soft dark:bg-dark-card',
        'border border-surface-muted dark:border-dark-border',
        'text-slate-700 dark:text-slate-300',
        'outline-none transition-all',
        'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

// ─────────────────────────────────────────────────────────────
//  Spinner
// ─────────────────────────────────────────────────────────────
export function Spinner({ size = 16, className }) {
  return (
    <svg
      width={size} height={size}
      className={cn('animate-spin text-brand-600', className)}
      viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────
//  SectionLabel
// ─────────────────────────────────────────────────────────────
export function SectionLabel({ children, className }) {
  return (
    <p className={cn(
      'text-[10.5px] font-bold tracking-[1.5px] uppercase',
      'text-slate-400 dark:text-slate-600',
      className,
    )}>
      {children}
    </p>
  )
}

// ─────────────────────────────────────────────────────────────
//  Divider
// ─────────────────────────────────────────────────────────────
export function Divider({ className }) {
  return <div className={cn('h-px bg-surface-muted dark:bg-dark-border', className)} />
}
