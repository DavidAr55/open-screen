import { ipcMain, dialog } from 'electron'
import { readFileSync, statSync } from 'fs'
import { extname } from 'path'

const MIME_BY_EXT = {
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB — es un logo, no un fondo

/**
 * Canal IPC para cargar la imagen del logo de marca de agua como data URL base64.
 */
export function registerWatermarkIPC(windowManager) {

  ipcMain.handle('watermark:pickImage', async () => {
    const win = windowManager.getControl()
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: 'Elegir imagen de marca de agua',
      filters: [
        { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'] },
      ],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return null

    const src  = filePaths[0]
    const ext  = extname(src).toLowerCase()
    const mime = MIME_BY_EXT[ext]
    if (!mime) return { error: 'Formato no soportado.' }

    if (statSync(src).size > MAX_SIZE_BYTES) {
      return { error: 'La imagen es demasiado grande (máx. 5 MB).' }
    }

    const base64 = readFileSync(src).toString('base64')
    return { dataUrl: `data:${mime};base64,${base64}` }
  })
}
