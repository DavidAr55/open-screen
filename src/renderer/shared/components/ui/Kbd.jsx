import { cn } from '@shared/utils/cn.js'

export function Kbd({ children, className }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded-[3px]',
        'bg-surface-3 border border-line-2',
        'text-[10px] font-mono text-ink-3 leading-none',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
