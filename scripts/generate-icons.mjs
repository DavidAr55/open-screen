/**
 * scripts/generate-icons.mjs
 *
 * Convierte resources/icon.svg a los formatos necesarios para Electron:
 *   resources/icon.png   ← Linux + dev mode (256x256)
 *   resources/icon.ico   ← Windows (multi-size)
 *
 * Requiere: npm install --save-dev sharp png-to-ico
 * Uso:      node scripts/generate-icons.mjs
 */

import sharp    from 'sharp'
import pngToIco from 'png-to-ico'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root      = resolve(__dirname, '..')

const svgPath  = resolve(root, 'resources/icon.svg')
const pngPath  = resolve(root, 'resources/icon.png')
const icoPath  = resolve(root, 'resources/icon.ico')

const svgBuffer = readFileSync(svgPath)

console.log('🎨 Generando icon.png (256×256)…')
await sharp(svgBuffer)
  .resize(256, 256)
  .png()
  .toFile(pngPath)

console.log('🪟 Generando icon.ico (multi-size para Windows)…')
// Generar tamaños necesarios para .ico: 16, 32, 48, 256
const sizes = [16, 32, 48, 256]
const pngBuffers = await Promise.all(
  sizes.map(size =>
    sharp(svgBuffer).resize(size, size).png().toBuffer()
  )
)

const icoBuffer = await pngToIco(pngBuffers)
writeFileSync(icoPath, icoBuffer)

console.log('✅ Iconos generados:')
console.log(`   ${pngPath}`)
console.log(`   ${icoPath}`)
console.log('\nAhora puedes correr npm run dev y verás el icono en la barra de tareas.')
