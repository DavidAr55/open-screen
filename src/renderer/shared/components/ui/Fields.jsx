import { cn } from '@shared/utils/cn.js'

const FIELD_BASE = [
  'bg-surface-0 border border-line-1 rounded-btn',
  'text-ink-1 placeholder:text-ink-4',
  'outline-none transition-all',
  'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15',
].join(' ')

export function Input({ className, ...props }) {
  return (
    <input
      className={cn('w-full px-3 py-2 text-sm', FIELD_BASE, className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full px-3 py-2.5 text-sm resize-none leading-relaxed',
        FIELD_BASE,
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn('px-3 py-2 text-sm cursor-pointer text-ink-2', FIELD_BASE, className)}
      {...props}
    >
      {children}
    </select>
  )
}
