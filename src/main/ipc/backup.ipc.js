import { ipcMain, dialog, app } from 'electron'
import { existsSync, copyFileSync, unlinkSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import Database from 'better-sqlite3'
import { getDbPath, closeDatabase } from '../db/database.js'

/**
 * IPC para respaldo/restauración manual de la base de datos.
 * `db` es la conexión better-sqlite3 activa (no un repositorio — opera sobre el archivo).
 */
export function registerBackupIPC(db, windowManager) {

  // ── Exportar: copia consistente (vía API de backup de SQLite) a donde elija el usuario ──
  ipcMain.handle('backup:export', async () => {
    const win = windowManager.getControl()
    const defaultName = `open-screen-backup-${new Date().toISOString().slice(0, 10)}.db`

    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title:       'Exportar respaldo',
      buttonLabel: 'Guardar',
      defaultPath: defaultName,
      filters: [{ name: 'Base de datos Open Screen', extensions: ['db'] }],
    })
    if (canceled || !filePath) return { canceled: true }

    try {
      await db.backup(filePath)
      return { path: filePath }
    } catch (e) {
      return { error: `No se pudo exportar: ${e.message}` }
    }
  })

  // ── Importar: reemplaza la DB actual por un archivo elegido y reinicia la app ──
  ipcMain.handle('backup:import', async () => {
    const win = windowManager.getControl()

    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title:       'Importar respaldo',
      buttonLabel: 'Importar',
      filters: [{ name: 'Base de datos Open Screen', extensions: ['db'] }],
      properties: ['openFile'],
    })
    if (canceled || !filePaths.length) return { canceled: true }

    const srcPath = filePaths[0]

    // Validar que sea un archivo SQLite de Open Screen antes de tocar nada
    let check
    try {
      check = new Database(srcPath, { readonly: true, fileMustExist: true })
      const hasSettings = check.prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='settings'`
      ).get()
      check.close()
      if (!hasSettings) return { error: 'El archivo no es un respaldo válido de Open Screen.' }
    } catch (e) {
      check?.close?.()
      return { error: `Archivo inválido: ${e.message}` }
    }

    const dbPath    = getDbPath()
    const backupDir = join(dirname(dbPath), 'backups')
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true })

    // Respaldo de seguridad de la DB actual por si el import falla o el usuario se arrepiente
    const safetyPath = join(backupDir, `pre-import-${Date.now()}.db`)
    try {
      await db.backup(safetyPath)
    } catch (e) {
      return { error: `No se pudo crear el respaldo de seguridad previo: ${e.message}` }
    }

    // Cerrar la conexión activa y reemplazar el archivo (limpia WAL/SHM viejos)
    closeDatabase()
    for (const suffix of ['', '-wal', '-shm']) {
      const f = dbPath + suffix
      if (existsSync(f)) unlinkSync(f)
    }
    copyFileSync(srcPath, dbPath)

    // Reiniciar la app para abrir la nueva base de datos desde cero
    app.relaunch()
    app.quit()
    return { success: true }
  })
}
