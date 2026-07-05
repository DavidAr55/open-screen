import { ipcMain, app } from 'electron'

// Versión real de la app — la misma que ve electron-builder al empaquetar (package.json)
export function registerAppIPC() {
  ipcMain.handle('app:getVersion', () => app.getVersion())
}
