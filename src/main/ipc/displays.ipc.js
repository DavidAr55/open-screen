import { ipcMain, screen } from 'electron'

/**
 * Canales IPC para detección de monitores.
 */
export function registerDisplaysIPC() {

  ipcMain.handle('displays:getAll', () => {
    const primary = screen.getPrimaryDisplay()
    return screen.getAllDisplays().map(d => ({
      id:        d.id,
      label:     `Monitor ${d.id} — ${d.bounds.width}×${d.bounds.height}`,
      isPrimary: d.id === primary.id,
      bounds:    d.bounds,
      scaleFactor: d.scaleFactor,
    }))
  })
}
