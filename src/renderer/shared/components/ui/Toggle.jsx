import { cn } from '@shared/utils/cn.js'

// Interruptor estilo iOS — encendido en azul primario.
export function Toggle({ checked, onChange, disabled, className, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex w-9 h-5 flex-shrink-0 rounded-full',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-500/50',
        'disabled:opacity-50 disabled:pointer-events-none',
        checked ? 'bg-primary-500' : 'bg-surface-3 border border-line-2',
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-sm',
          'transition-all duration-150',
          checked ? 'left-[18px]' : 'left-[3px]',
        )}
      />
    </button>
  )
}
