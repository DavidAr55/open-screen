import { cn } from '@shared/utils/cn.js'

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-surface-1 border border-line-1',
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

export function Spinner({ size = 16, className }) {
  return (
    <svg
      width={size} height={size}
      className={cn('animate-spin text-primary-500', className)}
      viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// Micro-etiqueta mono en mayúsculas ("INSPECTOR", "PREVIEW", labels de campos)
export function FieldLabel({ children, className }) {
  return (
    <p className={cn(
      'text-[10px] font-mono font-medium tracking-[1.2px] uppercase text-ink-3',
      className,
    )}>
      {children}
    </p>
  )
}

/**
 * Sección de inspector: header mono en mayúsculas + slot de acción opcional.
 */
export function InspectorSection({ title, action, children, className }) {
  return (
    <section className={cn('flex flex-col', className)}>
      <div className="flex items-center justify-between mb-2">
        <FieldLabel>{title}</FieldLabel>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Divider({ className }) {
  return <div className={cn('h-px bg-line-1', className)} />
}
