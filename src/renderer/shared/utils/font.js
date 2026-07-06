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

// Separa el texto principal del subtexto (referencia/atribución) usando el
// mismo delimitador que la ventana de proyección, para que los previews del
// Control muestren exactamente el mismo resultado.
export function splitProjectionText(raw) {
  const text   = raw ?? ''
  const sepIdx = text.lastIndexOf('\n\n—')
  const main   = sepIdx !== -1 ? text.substring(0, sepIdx).trim() : text
  const sub    = sepIdx !== -1 ? text.substring(sepIdx + 3).trim() : ''
  return { main, sub }
}

// Ancho (px) que la proyección real asume como referencia al calcular el
// tamaño de fuente en píxeles absolutos — usado para escalar ese mismo
// tamaño a unidades `cqw` dentro de los lienzos de preview del Control.
export const PROJECTION_REF_WIDTH = 1920

export function previewFontSize(px) {
  return `${(px / PROJECTION_REF_WIDTH * 100).toFixed(3)}cqw`
}
