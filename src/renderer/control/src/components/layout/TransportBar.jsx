import { useApp } from '../../context/AppContext.jsx'
import { cn } from '@shared/utils/cn.js'

// ─── Iconos ───────────────────────────────────────────────────────────────────
const ClearIcon = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 3l18 18"/><path d="M10.5 5H19a1 1 0 0 1 1 1v8.5"/><path d="M5 8.5V18a1 1 0 0 0 1 1h12"/></svg>
const LogoIcon  = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20"/></svg>
const BlackIcon = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" opacity=".25"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
const PrevIcon  = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
const NextIcon  = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="m9 18 6-6-6-6"/></svg>
const LiveIcon  = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2" fill="currentColor"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14"/></svg>

function TransportButton({ icon, label, onClick, active, disabled, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'flex flex-col items-center justify-center gap-1 min-w-[68px] h-[42px] rounded-btn',
        'transition-all duration-150 select-none',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
        'disabled:opacity-35 disabled:pointer-events-none',
        active
          ? 'bg-primary-500/10 text-primary-500'
          : 'text-ink-3 hover:text-ink-1 hover:bg-surface-3',
      )}
    >
      {icon}
      <span className="text-[9px] font-mono uppercase tracking-[1px] leading-none">{label}</span>
    </button>
  )
}

/**
 * Barra de transporte global (estilo consola broadcast):
 * LIMPIAR / LOGO / NEGRO / ◀ ANTERIOR / SIGUIENTE ▶ / EN VIVO.
 * Prev/Next los provee la página activa vía registerTransport().
 */
export function TransportBar() {
  const {
    clearProjection,
    screenMode, toggleScreenMode,
    transport,
    isLive, liveText, toggleProjection,
  } = useApp()

  return (
    <footer className={cn(
      'relative h-[54px] flex items-center justify-center gap-1 px-4 flex-shrink-0',
      'bg-surface-1 border-t border-line-1',
      'transition-colors duration-300',
    )}>
      <TransportButton
        icon={<ClearIcon />}
        label="Limpiar"
        title="Limpiar la proyección por completo"
        onClick={clearProjection}
      />
      <TransportButton
        icon={<LogoIcon />}
        label="Logo"
        title="Mostrar solo el logo en pantalla"
        active={screenMode === 'logo'}
        onClick={() => toggleScreenMode('logo')}
      />
      <TransportButton
        icon={<BlackIcon />}
        label="Negro"
        title="Fundir la pantalla a negro"
        active={screenMode === 'black'}
        onClick={() => toggleScreenMode('black')}
      />

      <div className="w-px h-6 bg-line-1 mx-2" />

      <TransportButton
        icon={<PrevIcon />}
        label="Anterior"
        title={transport ? 'Elemento anterior' : 'Sin navegación en esta vista'}
        disabled={!transport?.onPrev}
        onClick={() => transport?.onPrev?.()}
      />
      {transport?.label && (
        <span className="font-mono text-[10px] uppercase tracking-[1px] text-ink-3 min-w-[96px] text-center truncate select-none">
          {transport.label}
        </span>
      )}
      <TransportButton
        icon={<NextIcon />}
        label="Siguiente"
        title={transport ? 'Elemento siguiente' : 'Sin navegación en esta vista'}
        disabled={!transport?.onNext}
        onClick={() => transport?.onNext?.()}
      />

      {/* EN VIVO — anclado a la derecha */}
      <button
        onClick={toggleProjection}
        disabled={!isLive && !liveText}
        title={isLive ? 'Apagar proyección' : 'Reanudar proyección'}
        className={cn(
          'absolute right-4 flex flex-col items-center justify-center gap-1 w-[72px] h-[42px] rounded-btn',
          'transition-all duration-150 select-none',
          'outline-none focus-visible:ring-2 focus-visible:ring-live-500/50',
          'disabled:opacity-35 disabled:pointer-events-none',
          isLive
            ? 'bg-live-500 text-white shadow-[0_2px_12px_-2px_rgb(255_59_48/.6)]'
            : 'bg-live-500/10 text-live-500 border border-live-500/30 hover:bg-live-500/20',
        )}
      >
        <LiveIcon />
        <span className="text-[9px] font-mono uppercase tracking-[1px] leading-none font-semibold">
          {isLive ? 'En vivo' : 'Live'}
        </span>
      </button>
    </footer>
  )
}
