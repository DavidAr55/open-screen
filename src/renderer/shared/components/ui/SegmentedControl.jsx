import { cn } from '@shared/utils/cn.js'

/**
 * Control segmentado con etiquetas mono en mayúsculas (estilo CROSSFADE|CUT|WIPE).
 *
 * Props:
 *   options  — [{ value, label, icon? }]
 *   value    — valor activo
 *   onChange — (value) => void
 *   size     — 'sm' | 'md'
 *   block    — ocupa todo el ancho disponible
 */
export function SegmentedControl({ options, value, onChange, size = 'md', block = false, className }) {
  return (
    <div
      className={cn(
        'inline-flex p-0.5 gap-0.5 rounded-btn',
        'bg-surface-0 border border-line-1',
        block && 'flex w-full',
        className,
      )}
      role="tablist"
    >
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(opt.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-[3px]',
              'font-mono uppercase tracking-wide transition-all duration-150 select-none',
              'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
              size === 'sm' ? 'text-[10px] px-2 py-1' : 'text-[11px] px-3 py-1.5',
              block && 'flex-1',
              active
                ? 'bg-surface-3 text-ink-1 border border-line-2 font-semibold'
                : 'text-ink-3 border border-transparent hover:text-ink-1',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
