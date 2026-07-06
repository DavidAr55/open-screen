import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@shared/utils/cn.js'

/**
 * Menú contextual compartido — unifica las copias de Scripture/Songs/
 * Presentations/Multimedia/Sidebar.
 *
 * Props:
 *   open    — boolean
 *   x, y    — posición (clientX/clientY del evento contextmenu)
 *   title   — string opcional (header truncado)
 *   items   — [{ icon?, label, danger?, disabled?, onClick } | 'sep']
 *   onClose — () => void (click fuera / Escape / tras ejecutar un item)
 */
export function ContextMenu({ open, x = 0, y = 0, title, items = [], onClose }) {
  const ref = useRef(null)
  const [pos, setPos] = useState({ x, y })

  // Clampear al viewport para que el menú no se salga de pantalla
  useLayoutEffect(() => {
    if (!open) return
    setPos({ x, y })
    const el = ref.current
    if (!el) return
    const { innerWidth, innerHeight } = window
    const r = el.getBoundingClientRect()
    setPos({
      x: Math.min(x, innerWidth - r.width - 8),
      y: Math.min(y, innerHeight - r.height - 8),
    })
  }, [open, x, y])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!ref.current?.contains(e.target)) onClose?.() }
    const onKey  = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        'w-52 py-1 rounded-panel',
        'bg-surface-1 border border-line-1 shadow-card-md',
        'animate-modal-in',
      )}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
    >
      {title && (
        <p className="px-3 pt-1.5 pb-2 text-[10px] font-mono uppercase tracking-[1px] text-ink-4 truncate border-b border-line-1 mb-1">
          {title}
        </p>
      )}
      {items.map((item, i) =>
        item === 'sep' ? (
          <div key={i} className="h-px bg-line-1 my-1" />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            onClick={() => { item.onClick?.(); onClose?.() }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-left',
              'text-[12.5px] font-medium transition-colors duration-100',
              'disabled:opacity-40 disabled:pointer-events-none',
              item.danger
                ? 'text-live-500 hover:bg-live-500/10'
                : 'text-ink-2 hover:bg-surface-3 hover:text-ink-1',
            )}
          >
            {item.icon && <span className="flex-shrink-0 inline-flex">{item.icon}</span>}
            <span className="truncate">{item.label}</span>
          </button>
        )
      )}
    </div>
  )
}
