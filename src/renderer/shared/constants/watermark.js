export const WATERMARK_OPACITY_MAP = { low: 0.25, medium: 0.5, high: 0.75, full: 1 }
export const WATERMARK_MARGIN_MAP  = { small: 16, medium: 32, large: 56 }

export const DEFAULT_WATERMARK = {
  enabled:  false,
  image:    null,
  position: 'bottom-right', // 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  opacity:  'medium',
  margin:   'medium',
}

export function watermarkCornerStyle({ position, margin }) {
  const m = WATERMARK_MARGIN_MAP[margin] ?? WATERMARK_MARGIN_MAP.medium
  return {
    top:    position.startsWith('top')  ? m : undefined,
    bottom: position.startsWith('bottom') ? m : undefined,
    left:   position.endsWith('left')  ? m : undefined,
    right:  position.endsWith('right') ? m : undefined,
  }
}

// Variante para previews en miniatura del control (espejo a escala de la proyección real)
export function watermarkPreviewStyle(watermark, marginDivisor = 6) {
  const raw = WATERMARK_MARGIN_MAP[watermark.margin] ?? WATERMARK_MARGIN_MAP.medium
  const m   = Math.max(4, Math.round(raw / marginDivisor))
  return {
    maxWidth: '14%', maxHeight: '14%',
    opacity: WATERMARK_OPACITY_MAP[watermark.opacity] ?? WATERMARK_OPACITY_MAP.medium,
    top:    watermark.position.startsWith('top')    ? m : undefined,
    bottom: watermark.position.startsWith('bottom') ? m : undefined,
    left:   watermark.position.endsWith('left')     ? m : undefined,
    right:  watermark.position.endsWith('right')    ? m : undefined,
  }
}
