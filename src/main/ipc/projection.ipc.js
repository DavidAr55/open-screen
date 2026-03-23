import { ipcMain } from 'electron'

/**
 * Canales IPC para controlar la ventana de proyección.
 * El WindowManager se pasa como dependencia para enviar mensajes
 * a la ventana de proyección sin acoplar este módulo a BrowserWindow directamente.
 */
export function registerProjectionIPC(windowManager) {

  // Proyectar contenido
  ipcMain.on('projection:send', (_e, payload) => {
    windowManager.sendToProjection('projection:receive', payload)
  })

  // Limpiar pantalla
  ipcMain.on('projection:clear', () => {
    windowManager.sendToProjection('projection:clear', null)
  })

  // Freeze — congela la imagen actual (útil en transiciones)
  ipcMain.on('projection:freeze', (_e, frozen) => {
    windowManager.sendToProjection('projection:freeze', { frozen })
  })
}
