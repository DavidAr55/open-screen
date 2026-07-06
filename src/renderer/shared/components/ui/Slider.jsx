import { cn } from '@shared/utils/cn.js'

/**
 * Slider fino con thumb redondo y pista rellena en azul primario.
 * Wrapper de <input type="range"> — acepta min/max/step/value/onChange nativos.
 */
export function Slider({ min = 0, max = 100, value = 0, className, style, ...props }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      className={cn('ui-slider', className)}
      style={{
        background: `linear-gradient(to right, #007AFF 0%, #007AFF ${pct}%, rgb(var(--surface-3)) ${pct}%, rgb(var(--surface-3)) 100%)`,
        ...style,
      }}
      {...props}
    />
  )
}
