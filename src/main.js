const { app, BrowserWindow, screen, ipcMain } = require('electron')
const path = require('path')

const isDev = process.argv.includes('--dev')

let controlWindow = null   // Ventana del operador
let projectionWindow = null // Ventana de proyección (pantalla secundaria)

// ─────────────────────────────────────────────
//  VENTANA DE CONTROL (operador)
// ─────────────────────────────────────────────
function createControlWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize

  controlWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    x: Math.floor((width - 1280) / 2),
    y: Math.floor((height - 800) / 2),
    minWidth: 900,
    minHeight: 600,
    title: 'Open Screen — Control',
    backgroundColor: '#0f0f13',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  controlWindow.loadFile(path.join(__dirname, 'renderer/control.html'))

  if (isDev) {
    controlWindow.webContents.openDevTools()
  }

  controlWindow.on('closed', () => {
    controlWindow = null
    app.quit()
  })
}

// ─────────────────────────────────────────────
//  VENTANA DE PROYECCIÓN (pantalla secundaria)
// ─────────────────────────────────────────────
function createProjectionWindow() {
  const displays = screen.getAllDisplays()

  // Usar pantalla secundaria si existe, si no usar la primaria
  const targetDisplay = displays.length > 1
    ? displays.find(d => d.id !== screen.getPrimaryDisplay().id)
    : screen.getPrimaryDisplay()

  const { x, y, width, height } = targetDisplay.bounds

  projectionWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    title: 'Open Screen — Projection',
    backgroundColor: '#000000',
    frame: false,          // Sin bordes
    kiosk: displays.length > 1, // Pantalla completa solo si es monitor secundario
    alwaysOnTop: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  projectionWindow.loadFile(path.join(__dirname, 'renderer/projection.html'))

  projectionWindow.on('closed', () => {
    projectionWindow = null
  })
}

// ─────────────────────────────────────────────
//  IPC — Comunicación entre ventanas
// ─────────────────────────────────────────────

// El operador envía contenido a la pantalla de proyección
ipcMain.on('project:send', (event, payload) => {
  if (projectionWindow) {
    projectionWindow.webContents.send('project:receive', payload)
  }
})

// El operador limpia la pantalla de proyección
ipcMain.on('project:clear', () => {
  if (projectionWindow) {
    projectionWindow.webContents.send('project:clear')
  }
})

// Consultar monitores disponibles
ipcMain.handle('displays:get', () => {
  return screen.getAllDisplays().map(d => ({
    id: d.id,
    label: `Monitor ${d.id} (${d.bounds.width}x${d.bounds.height})`,
    isPrimary: d.id === screen.getPrimaryDisplay().id,
    bounds: d.bounds
  }))
})

// ─────────────────────────────────────────────
//  APP LIFECYCLE
// ─────────────────────────────────────────────
app.whenReady().then(() => {
  createControlWindow()
  createProjectionWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createControlWindow()
      createProjectionWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
