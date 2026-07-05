import { ipcMain, dialog, shell } from 'electron'
import { readFileSync, existsSync, copyFileSync, mkdirSync, statSync } from 'fs'
import { join, basename, extname } from 'path'
import { app } from 'electron'

const IMAGE_EXTS = ['.jpg','.jpeg','.png','.webp','.avif']
const GIF_EXTS   = ['.gif']
const VIDEO_EXTS = ['.mp4','.webm','.mov','.mkv']

function getMediaDir() {
  const dir = join(app.getPath('userData'), 'multimedia')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

function resolveType(ext) {
  if (IMAGE_EXTS.includes(ext)) return 'image'
  if (GIF_EXTS.includes(ext))   return 'gif'
  if (VIDEO_EXTS.includes(ext)) return 'video'
  return null
}

function toHttpUrl(filePath, port) {
  const normalized = filePath.replace(/\\/g, '/')
  const params = new URLSearchParams({ path: normalized })
  return `http://127.0.0.1:${port}/bg?${params.toString()}`
}

/** Convierte la ruta cruda guardada en DB a URL http del servidor local (o reescribe el puerto si ya lo era). */
function normalizeUrl(value, port) {
  if (!value) return value
  if (value.startsWith('http://127.0.0.1')) {
    return value.replace(/^http:\/\/127\.0\.0\.1:\d+/, `http://127.0.0.1:${port}`)
  }
  if (value.match(/^[A-Za-z]:[/\\]/) || value.startsWith('/')) {
    return toHttpUrl(value, port)
  }
  return value
}

export function registerMultimediaIPC(mediaRepo, windowManager, bgServerPort) {

  ipcMain.handle('multimedia:findAll', (_e, type) => {
    return mediaRepo.findAll(type).map(m => ({ ...m, path: normalizeUrl(m.path, bgServerPort) }))
  })

  ipcMain.handle('multimedia:findById', (_e, id) => {
    const m = mediaRepo.findById(id)
    if (!m) return null
    return { ...m, path: normalizeUrl(m.path, bgServerPort) }
  })

  ipcMain.handle('multimedia:update',         (_e, id, data) => mediaRepo.update(id, data))
  ipcMain.handle('multimedia:delete',         (_e, id)       => mediaRepo.delete(id))
  ipcMain.handle('multimedia:toggleFavorite', (_e, id)       => mediaRepo.toggleFavorite(id))

  // ── Importar archivo (imagen / gif / video) ───────────────────────────────
  ipcMain.handle('multimedia:import', async () => {
    const win = windowManager.getControl()
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title:       'Importar multimedia',
      buttonLabel: 'Importar',
      filters: [
        { name: 'Imágenes, GIFs y Video', extensions: ['jpg','jpeg','png','webp','avif','gif','mp4','webm','mov','mkv'] },
      ],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return null

    const src  = filePaths[0]
    const ext  = extname(src).toLowerCase()
    const type = resolveType(ext)
    if (!type) return { error: 'Formato no soportado.' }

    const name = basename(src, ext)
    const dest = join(getMediaDir(), `${Date.now()}_${basename(src)}`)
    copyFileSync(src, dest)

    // Thumbnail base64 solo para imagen/gif — un video requeriría ffmpeg para extraer un frame
    let thumbnail = null
    if (type === 'image' || type === 'gif') {
      try {
        const buf  = readFileSync(dest)
        const mime = type === 'gif' ? 'image/gif'
          : ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.avif' ? 'image/avif' : 'image/jpeg'
        thumbnail = `data:${mime};base64,${buf.toString('base64')}`
      } catch {}
    }

    const { size } = statSync(dest)
    const record = mediaRepo.register({
      name, path: dest, type,
      mime_type:  type === 'video' ? `video/${ext.replace('.', '')}` : null,
      size_bytes: size,
      thumbnail,
    })

    return { ...record, path: normalizeUrl(record.path, bgServerPort) }
  })

  ipcMain.handle('multimedia:openDir', () => {
    const dir = getMediaDir()
    shell.openPath(dir)
    return dir
  })

  // ── Proyección ─────────────────────────────────────────────────────────────
  ipcMain.on('multimedia:project', (_e, payload) => {
    // payload: { id, type, url, name }
    windowManager.sendToProjection('projection:media', payload)
  })

  ipcMain.on('multimedia:clear', () => {
    windowManager.sendToProjection('projection:clear', null)
  })

  // Reenvía acciones del reproductor del operador (play/pause/seek/volumen) a la proyección
  ipcMain.on('multimedia:mediaControl', (_e, payload) => {
    windowManager.sendToProjection('projection:mediaControl', payload)
  })
}
