import { app } from 'electron'
import { WindowManager, loadAppIcon } from './windows/WindowManager.js'
import { initDatabase }  from './db/database.js'
import { registerAllIPC } from './ipc/index.js'

// Prevenir múltiples instancias
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

let windowManager = null

app.whenReady().then(async () => {
  // Setear icono en dock/taskbar (macOS)
  const icon = loadAppIcon ? loadAppIcon() : null
  if (icon && process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  // 1. Inicializar base de datos (crea tablas si no existen)
  const db = initDatabase()

  // 2. Crear ventanas primero — IPC de proyección las necesita
  windowManager = new WindowManager()
  windowManager.createAll()

  // 3. Registrar todos los handlers IPC (pasa windowManager para projection.ipc)
  registerAllIPC(db, windowManager)

  app.on('activate', () => {
    if (windowManager && !windowManager.hasWindows()) {
      windowManager.createAll()
    }
  })
})

app.on('second-instance', () => {
  // Si el usuario abre una segunda instancia, enfoca la existente
  windowManager?.focusControl()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})