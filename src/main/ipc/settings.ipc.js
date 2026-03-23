import { ipcMain } from 'electron'

/**
 * Canales IPC para la configuración global del sistema.
 */
export function registerSettingsIPC(settingsRepo) {

  // Obtener una clave
  ipcMain.handle('settings:get', (_e, key, defaultValue) => {
    return settingsRepo.get(key, defaultValue)
  })

  // Establecer una clave
  ipcMain.handle('settings:set', (_e, key, value) => {
    return settingsRepo.set(key, value)
  })

  // Obtener todas
  ipcMain.handle('settings:getAll', () => {
    return settingsRepo.getAll()
  })

  // Actualizar múltiples en una transacción
  ipcMain.handle('settings:setMany', (_e, entries) => {
    return settingsRepo.setMany(entries)
  })
}
