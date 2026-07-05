export const DEFAULT_PROJECTION_FONT = 'Plus Jakarta Sans'

export function buildFontFamily(name) {
  const font = name || DEFAULT_PROJECTION_FONT
  return `"${font}", sans-serif`
}

// Tamaño automático según cantidad de líneas y ancho máximo de línea
export function calcAutoFontSize(text) {
  if (!text) return 80
  const lines    = text.split('\n').length
  const maxChars = Math.max(...text.split('\n').map(l => l.length))
  if (lines >= 10) return 42
  if (lines >= 8)  return 46
  if (lines >= 6)  return 52
  if (lines >= 5)  return 58
  if (lines >= 4)  return 66
  if (lines >= 3)  return 74
  if (maxChars >= 50) return 56
  if (maxChars >= 40) return 66
  if (maxChars >= 30) return 78
  return 80
}

// Resuelve el tamaño final: 'auto' o vacío calcula según el texto; cualquier
// número (px) enviado por el usuario se usa tal cual.
export function resolveFontSize(text, fontSizeMode) {
  const custom = Number(fontSizeMode)
  if (fontSizeMode && fontSizeMode !== 'auto' && !Number.isNaN(custom) && custom > 0) return custom
  return calcAutoFontSize(text)
}
