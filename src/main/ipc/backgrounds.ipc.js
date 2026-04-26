import { ipcMain, dialog } from 'electron'
import { readFileSync, existsSync, copyFileSync, mkdirSync } from 'fs'
import { join, basename, extname } from 'path'
import { app } from 'electron'

const IMAGE_EXTS = ['.jpg','.jpeg','.png','.webp','.avif']
const GIF_EXTS   = ['.gif']
const VIDEO_EXTS = ['.mp4','.webm','.mov','.mkv']

function getBgDir() {
  const dir = join(app.getPath('userData'), 'backgrounds')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function resolveType(ext) {
  if (IMAGE_EXTS.includes(ext)) return 'image'
  if (GIF_EXTS.includes(ext))   return 'gif'
  if (VIDEO_EXTS.includes(ext))  return 'video'
  return null
}

/** Convierte una ruta de archivo al URL del servidor local */
function toHttpUrl(filePath, port) {
  // Normalizar separadores a forward slash
  const normalized = filePath.replace(/\\/g, '/')
  const params = new URLSearchParams({ path: normalized })
  return `http://127.0.0.1:${port}/bg?${params.toString()}`
}

/** Detecta si un value es CSS puro (color o gradiente) — no necesita conversión */
function isCssValue(value) {
  if (!value) return false
  const v = value.trim()
  return v.startsWith('#')
    || v.startsWith('rgb')
    || v.startsWith('hsl')
    || v.startsWith('linear-gradient')
    || v.startsWith('radial-gradient')
    || v.startsWith('conic-gradient')
}

/** Normaliza el value guardado en DB a HTTP URL para el renderer */
function normalizeValue(value, port) {
  if (!value) return value

  // CSS puro (color/gradiente) — no tocar
  if (isCssValue(value)) return value

  // Ya es HTTP del servidor local — actualizar puerto si cambió
  if (value.startsWith('http://127.0.0.1')) {
    return value.replace(/^http:\/\/127\.0\.0\.1:\d+/, `http://127.0.0.1:${port}`)
  }

  // Es una ruta absoluta de archivo (sin scheme)
  if (value.match(/^[A-Za-z]:[/\\]/) || value.startsWith('/')) {
    return toHttpUrl(value, port)
  }

  // Formato antiguo bg:// — extraer ruta
  if (value.startsWith('bg://')) {
    let raw = value
      .replace(/^bg:\/\/\//, '')
      .replace(/^bg:\/\/([a-zA-Z])\//, '$1:/')
    try { raw = decodeURIComponent(raw) } catch {}
    return toHttpUrl(raw, port)
  }

  // Formato antiguo file:// — extraer ruta
  if (value.startsWith('file:///')) {
    let raw = value.replace(/^file:\/\/\//, '')
    if (!raw.match(/^[A-Za-z]:/)) raw = '/' + raw
    try { raw = decodeURIComponent(raw) } catch {}
    return toHttpUrl(raw, port)
  }

  // Fallback — devolver intacto
  return value
}

export function registerBackgroundsIPC(bgRepo, windowManager, bgServerPort) {

  // Exponer el puerto del servidor al renderer
  ipcMain.handle('backgrounds:getServerPort', () => bgServerPort)

  ipcMain.handle('backgrounds:findAll', (_e, filters) => {
    const list = bgRepo.findAll(filters)
    // Normalizar valores legacy a HTTP URLs
    return list.map(bg => ({
      ...bg,
      value: normalizeValue(bg.value, bgServerPort),
    }))
  })

  ipcMain.handle('backgrounds:findById', (_e, id) => {
    const bg = bgRepo.findById(id)
    if (!bg) return null
    return { ...bg, value: normalizeValue(bg.value, bgServerPort) }
  })

  ipcMain.handle('backgrounds:create',         (_e, data)     => bgRepo.create(data))
  ipcMain.handle('backgrounds:update',         (_e, id, data) => bgRepo.update(id, data))
  ipcMain.handle('backgrounds:delete',         (_e, id)       => bgRepo.delete(id))
  ipcMain.handle('backgrounds:toggleFavorite', (_e, id)       => bgRepo.toggleFavorite(id))

  // Paso 1: Elegir archivo + devolver preview sin guardar aún
  ipcMain.handle('backgrounds:pickFile', async () => {
    const win = windowManager.getControl()
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Elegir fondo',
      filters: [
        { name: 'Imágenes y Video', extensions: ['jpg','jpeg','png','webp','gif','mp4','webm','mov'] },
      ],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return null

    const src  = filePaths[0]
    const ext  = extname(src).toLowerCase()
    const type = resolveType(ext)
    if (!type) return { error: 'Formato no soportado.' }

    const name = basename(src, ext)

    // Preview base64 para imagen/gif (para mostrar en el paso de confirmación)
    let previewSrc = null
    if (type === 'image' || type === 'gif') {
      try {
        const buf  = readFileSync(src)
        const mime = type === 'gif' ? 'image/gif'
          : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg'
        previewSrc = `data:${mime};base64,${buf.toString('base64')}`
      } catch {}
    }

    return { name, type, filePath: src, filename: basename(src), previewSrc }
  })

  // Paso 2: Confirmar e importar el archivo seleccionado
  ipcMain.handle('backgrounds:importConfirmed', async (_e, { filePath, name, type, previewSrc }) => {
    if (!filePath || !existsSync(filePath)) return { error: 'Archivo no encontrado.' }

    const ext  = extname(filePath).toLowerCase()
    const dest = join(getBgDir(), `${Date.now()}_${basename(filePath)}`)
    copyFileSync(filePath, dest)

    const thumbnail = previewSrc ?? null  // ya viene como base64 del paso anterior
    const httpUrl   = toHttpUrl(dest, bgServerPort)
    return bgRepo.create({ name, type, value: httpUrl, thumbnail })
  })

  // Actualizar fondo activo en la ventana de proyección
  ipcMain.on('backgrounds:setActive', (_e, bgPayload) => {
    windowManager.sendToProjection('projection:setBg', bgPayload)
  })
}