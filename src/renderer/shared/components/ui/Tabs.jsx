import { cn } from '@shared/utils/cn.js'

/**
 * Tabs mono en mayúsculas con subrayado azul (nav del Topbar, GENERAL/LAYERS…).
 *
 * Props:
 *   tabs     — [{ value, label }]
 *   value    — tab activo
 *   onChange — (value) => void
 */
export function Tabs({ tabs, value, onChange, className }) {
  return (
    <nav className={cn('flex items-center gap-1', className)} role="tablist">
      {tabs.map(tab => {
        const active = tab.value === value
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.value)}
            className={cn(
              'px-3 py-2 font-mono text-[11px] uppercase tracking-[1.2px] select-none',
              'border-b-2 transition-colors duration-150',
              'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
              active
                ? 'text-primary-500 border-primary-500 font-semibold'
                : 'text-ink-3 border-transparent hover:text-ink-1',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
