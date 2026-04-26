import { app }                                from 'electron'
import { WindowManager, loadAppIcon }         from './windows/WindowManager.js'
import { initDatabase }                       from './db/database.js'
import { registerAllIPC }                     from './ipc/index.js'
import { createServer }                       from 'http'
import { createReadStream, existsSync, statSync } from 'fs'
import { extname }                            from 'path'

// Prevenir múltiples instancias
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
  process.exit(0)
}

// ── Servidor HTTP local para servir archivos de fondo ─────────────────────────
// Usa un puerto aleatorio en 127.0.0.1. Maneja Range requests nativaente
// con fs.createReadStream, lo que permite video streaming correcto (206).
const MIME = {
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp',
}

let bgServerPort = 0
let bgServer     = null

function startBgFileServer() {
  return new Promise((resolve) => {
    bgServer = createServer((req, res) => {
      // URL format: /bg?path=C:/Users/...
      const urlObj   = new URL(req.url, 'http://localhost')
      const filePath = urlObj.searchParams.get('path') ?? ''

      if (!filePath || !existsSync(filePath)) {
        res.writeHead(404); res.end('Not Found')
        return
      }

      const stat        = statSync(filePath)
      const fileSize    = stat.size
      const contentType = MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
      const range       = req.headers.range

      if (range) {
        const [, s, e] = (range.match(/bytes=(\d*)-(\d*)/) ?? [])
        const start = s ? parseInt(s) : 0
        const end   = (e && e !== '') ? parseInt(e) : fileSize - 1
        const chunk = end - start + 1

        res.writeHead(206, {
          'Content-Type':   contentType,
          'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges':  'bytes',
          'Content-Length': chunk,
        })
        createReadStream(filePath, { start, end }).pipe(res)
      } else {
        res.writeHead(200, {
          'Content-Type':   contentType,
          'Accept-Ranges':  'bytes',
          'Content-Length': fileSize,
        })
        createReadStream(filePath).pipe(res)
      }
    })

    // Puerto 0 = asignar aleatorio libre
    bgServer.listen(0, '127.0.0.1', () => {
      bgServerPort = bgServer.address().port
      console.log(`[BgServer] escuchando en http://127.0.0.1:${bgServerPort}`)
      resolve(bgServerPort)
    })
  })
}

/**
 * Convierte una bg:// URL (o file:// URL) a la URL del servidor local.
 * El renderer recibe este puerto a través de IPC para construir URLs correctas.
 */
export function bgFileUrl(rawPath) {
  const normalized = rawPath.replace(/\\/g, '/')
  return `http://127.0.0.1:${bgServerPort}/bg?path=${encodeURIComponent(normalized)}`
}

let windowManager = null

app.whenReady().then(async () => {
  // 1. Iniciar servidor de archivos de fondo
  await startBgFileServer()

  // Icono dock/taskbar (macOS)
  const icon = loadAppIcon ? loadAppIcon() : null
  if (icon && process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon)
  }

  // 2. Base de datos
  const db = initDatabase()

  // 3. Ventanas
  windowManager = new WindowManager()
  windowManager.createAll()

  // 4. IPC
  registerAllIPC(db, windowManager, bgServerPort)

  app.on('activate', () => {
    if (windowManager && !windowManager.hasWindows()) windowManager.createAll()
  })
})

app.on('second-instance', () => windowManager?.focusControl())

app.on('window-all-closed', () => {
  bgServer?.close()
  if (process.platform !== 'darwin') app.quit()
})