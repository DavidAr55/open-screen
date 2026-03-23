import { BrowserWindow, screen, shell, app, nativeImage } from 'electron'
import { join, resolve } from 'path'

const isDev    = !app.isPackaged
const DEV_URL  = process.env['ELECTRON_RENDERER_URL']

// Cargar el icono de la app
// En dev usa PNG si existe, en producción usa el que empaquetó electron-builder
function loadAppIcon() {
  try {
    // Ruta relativa a resources/ desde la raíz del proyecto
    const iconPath = isDev
      ? resolve(process.cwd(), 'resources/icon.png')
      : join(process.resourcesPath, 'icon.png')
    return nativeImage.createFromPath(iconPath)
  } catch {
    return null
  }
}

// Exportar para uso en index.js (dock icon de macOS)
export { loadAppIcon }

export class WindowManager {
  #control    = null
  #projection = null

  createAll() {
    this.#control    = this.#createControlWindow()
    this.#projection = this.#createProjectionWindow()
  }

  // ── Ventana de control (operador) ──────────────────────
  #createControlWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize

    const win = new BrowserWindow({
      width:     1300,
      height:    820,
      minWidth:  960,
      minHeight: 600,
      x: Math.floor((width  - 1300) / 2),
      y: Math.floor((height - 820)  / 2),
      title:           'Open Screen — Control',
      backgroundColor: '#f1f5f9',
      icon:            loadAppIcon() ?? undefined,
      show:            false,
      webPreferences: {
        preload:          join(__dirname, '../preload/control.mjs'),
        nodeIntegration:  false,
        contextIsolation: true,
        sandbox:          false, // necesario para better-sqlite3 vía IPC
      }
    })

    win.once('ready-to-show', () => win.show())

    // Abrir links externos en el navegador del sistema
    win.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })

    if (isDev && DEV_URL) {
      win.loadURL(`${DEV_URL}/control/index.html`)
      win.webContents.openDevTools()
    } else {
      win.loadFile(join(__dirname, '../renderer/control/index.html'))
    }

    win.on('closed', () => {
      this.#control = null
      // Cierra la proyección cuando se cierra el control
      this.#projection?.close()
    })

    return win
  }

  // ── Ventana de proyección (pantalla secundaria) ────────
  #createProjectionWindow() {
    const displays = screen.getAllDisplays()
    const primary  = screen.getPrimaryDisplay()
    const target   = displays.find(d => d.id !== primary.id) ?? primary

    const { x, y, width, height } = target.bounds

    const win = new BrowserWindow({
      x, y, width, height,
      title:           'Open Screen — Projection',
      backgroundColor: '#000000',
      frame:           false,
      kiosk:           displays.length > 1,
      show:            false,
      webPreferences: {
        preload:          join(__dirname, '../preload/projection.mjs'),
        nodeIntegration:  false,
        contextIsolation: true,
        sandbox:          false,
      }
    })

    win.once('ready-to-show', () => win.show())

    if (isDev && DEV_URL) {
      win.loadURL(`${DEV_URL}/projection/index.html`)
    } else {
      win.loadFile(join(__dirname, '../renderer/projection/index.html'))
    }

    win.on('closed', () => { this.#projection = null })

    return win
  }

  // ── API pública ────────────────────────────────────────
  getControl()    { return this.#control }
  getProjection() { return this.#projection }

  hasWindows() {
    return BrowserWindow.getAllWindows().length > 0
  }

  focusControl() {
    if (this.#control?.isMinimized()) this.#control.restore()
    this.#control?.focus()
  }

  /**
   * Envía un payload a la ventana de proyección
   * @param {string} channel
   * @param {any} payload
   */
  sendToProjection(channel, payload) {
    this.#projection?.webContents?.send(channel, payload)
  }
}