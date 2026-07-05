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

  // Actualizar la fuente en caliente, sin esperar a la próxima diapositiva
  ipcMain.on('projection:setFont', (_e, fontName) => {
    windowManager.sendToProjection('projection:setFont', fontName)
  })

  // Actualizar el tamaño de fuente en caliente, sin esperar a la próxima diapositiva
  ipcMain.on('projection:setFontSize', (_e, fontSizeMode) => {
    windowManager.sendToProjection('projection:setFontSize', fontSizeMode)
  })

  // Actualizar la marca de agua en caliente
  ipcMain.on('projection:setWatermark', (_e, watermark) => {
    windowManager.sendToProjection('projection:setWatermark', watermark)
  })
}
