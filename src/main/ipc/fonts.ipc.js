import { ipcMain } from 'electron'
import { getFonts } from 'font-list'

/**
 * Canal IPC para listar las fuentes instaladas en el sistema (usadas en proyección).
 */
export function registerFontsIPC() {

  ipcMain.handle('fonts:getAll', async () => {
    try {
      const fonts = await getFonts({ disableQuoting: true })
      return fonts.sort((a, b) => a.localeCompare(b))
    } catch {
      return []
    }
  })
}
