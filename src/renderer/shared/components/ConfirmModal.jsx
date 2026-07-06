import { useEffect, useRef } from 'react'
import { cn } from '@shared/utils/cn.js'

/**
 * Modal de confirmación con el estilo de Open Screen.
 * Reemplaza el `confirm()` nativo del sistema.
 *
 * Props:
 *   open      — boolean
 *   title     — string
 *   message   — string
 *   onConfirm — () => void
 *   onCancel  — () => void
 *   danger    — boolean (botón de confirmación en rojo)
 *   confirmLabel — string (default: "Eliminar")
 *   cancelLabel  — string (default: "Cancelar")
 */
export function ConfirmModal({
  open,
  title      = '¿Estás seguro?',
  message,
  onConfirm,
  onCancel,
  danger       = true,
  confirmLabel = 'Eliminar',
  cancelLabel  = 'Cancelar',
}) {
  const confirmRef = useRef(null)

  // Foco automático al botón de confirmación
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => confirmRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') onCancel?.()
      if (e.key === 'Enter')  onConfirm?.()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onCancel, onConfirm])

  if (!open) return null

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        className={cn(
          'w-80 rounded-card p-5 flex flex-col gap-4',
          'bg-surface-1 border border-line-1 shadow-card-md',
          'animate-modal-in',
        )}
      >
        {/* Icono + título */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-9 h-9 rounded-panel flex items-center justify-center flex-shrink-0',
            danger ? 'bg-live-500/12 text-live-500' : 'bg-warn-500/12 text-warn-500',
          )}>
            {danger ? (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[15px] text-ink-1">{title}</p>
            {message && (
              <p className="text-[13px] text-ink-3 mt-1 leading-relaxed">{message}</p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className={cn(
              'px-4 py-2 rounded-btn text-[13px] font-semibold transition-all',
              'border border-line-2 text-ink-2',
              'hover:bg-surface-3 hover:text-ink-1',
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={cn(
              'px-4 py-2 rounded-btn text-[13px] font-bold transition-all',
              'outline-none focus-visible:ring-2',
              danger
                ? 'bg-live-500 hover:bg-live-600 text-white focus-visible:ring-live-500/40'
                : 'bg-primary-200 hover:bg-primary-300 text-neutral-950 focus-visible:ring-primary-500/40',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
