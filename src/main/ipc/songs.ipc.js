import { ipcMain, dialog } from 'electron'
import { readFileSync } from 'fs'
import { parsePptx } from '../utils/pptxParser.js'

export function registerSongsIPC(songsRepo, windowManager) {
  ipcMain.handle('songs:findAll',       (_e, filters)      => songsRepo.findAll(filters))
  ipcMain.handle('songs:findById',      (_e, id)           => songsRepo.findById(id))
  ipcMain.handle('songs:create',        (_e, data)         => songsRepo.create(data))
  ipcMain.handle('songs:update',        (_e, id, data)     => songsRepo.update(id, data))
  ipcMain.handle('songs:delete',        (_e, id)           => songsRepo.delete(id))
  ipcMain.handle('songs:toggleFavorite',(_e, id)           => songsRepo.toggleFavorite(id))
  ipcMain.handle('songs:getArtists',    ()                 => songsRepo.getArtists())
  ipcMain.handle('songs:count',         ()                 => songsRepo.count())

  // ── Importar letras desde PowerPoint (.pptx) ───────────────────────────────
  ipcMain.handle('songs:pickPptx', async () => {
    const win = windowManager?.getControl()
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title:       'Importar PowerPoint',
      buttonLabel: 'Importar',
      filters:     [{ name: 'PowerPoint', extensions: ['pptx'] }],
      properties:  ['openFile'],
    })
    if (canceled || !filePaths.length) return null
    return filePaths[0]
  })

  ipcMain.handle('songs:parsePptx', async (_e, filePath) => {
    try {
      const buffer = readFileSync(filePath)
      const { slides } = await parsePptx(buffer)
      const name = filePath.split(/[\\/]/).pop().replace(/\.pptx$/i, '')
      return { name, slides }
    } catch (e) {
      return { error: `No se pudo leer el archivo: ${e.message}` }
    }
  })
}