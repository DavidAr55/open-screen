import { ipcMain, dialog, shell } from 'electron'
import { readFileSync, existsSync, copyFileSync, mkdirSync } from 'fs'
import { join, basename, extname } from 'path'
import { app } from 'electron'

/**
 * IPC para el módulo de Presentaciones.
 * El renderer usa pdfjs-dist para renderizar slides como imágenes —
 * el main process solo gestiona los archivos y la DB.
 */
export function registerPresentationsIPC(presRepo, windowManager) {

  // ── CRUD ──────────────────────────────────────────────────────────────────

  ipcMain.handle('presentations:findAll', () => presRepo.findAll())
  ipcMain.handle('presentations:findById', (_e, id) => presRepo.findById(id))
  ipcMain.handle('presentations:delete', (_e, id) => {
    return presRepo.delete(id)
  })

  // Actualizar metadatos (nombre, page_count, thumbnail) desde el renderer
  // después de que pdfjs termine de procesar el archivo
  ipcMain.handle('presentations:update', (_e, id, data) => presRepo.update(id, data))

  // ── Importar archivo via diálogo del SO ───────────────────────────────────
  ipcMain.handle('presentations:import', async (event) => {
    const win = windowManager.getControl()

    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title:       'Importar presentación',
      buttonLabel: 'Importar',
      filters: [
        { name: 'Presentaciones', extensions: ['pdf', 'pptx', 'ppt'] },
        { name: 'PDF',            extensions: ['pdf'] },
      ],
      properties: ['openFile'],
    })

    if (canceled || !filePaths.length) return null

    const srcPath = filePaths[0]
    const ext     = extname(srcPath).toLowerCase().replace('.', '')
    const name    = basename(srcPath, extname(srcPath))

    // Copiar el archivo al directorio de datos de la app (para persistencia)
    const presDir = join(app.getPath('userData'), 'presentations')
    if (!existsSync(presDir)) mkdirSync(presDir, { recursive: true })

    const destPath = join(presDir, `${Date.now()}_${basename(srcPath)}`)
    copyFileSync(srcPath, destPath)

    // Solo PDF soportado en fase 1 — PPTX requiere conversión externa
    if (ext !== 'pdf') {
      return {
        error: 'Por ahora solo se soportan archivos PDF. Exporta tu presentación como PDF desde PowerPoint.',
        file_type: ext,
      }
    }

    // Crear registro en DB (page_count se actualiza desde el renderer)
    const record = presRepo.create({
      name,
      file_path: destPath,
      file_type: ext,
      page_count: 0,
    })

    return record
  })

  // Leer el archivo como base64 para que pdfjs lo procese en el renderer
  ipcMain.handle('presentations:readFile', (_e, id) => {
    const record = presRepo.findById(id)
    if (!record) return null
    if (!existsSync(record.file_path)) return { error: 'Archivo no encontrado en disco.' }
    const buffer = readFileSync(record.file_path)
    return {
      ...record,
      data: buffer.toString('base64'),
    }
  })

  // Abrir la carpeta de presentaciones en el explorador
  ipcMain.handle('presentations:openDir', () => {
    const dir = join(app.getPath('userData'), 'presentations')
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    shell.openPath(dir)
    return dir
  })

  // ── Proyectar una slide como imagen ───────────────────────────────────────
  // El renderer envía la imagen como dataURL; el main la reenvía a proyección
  ipcMain.on('presentations:projectSlide', (_e, payload) => {
    // payload: { dataUrl, slideNumber, totalSlides, presentationName }
    windowManager.sendToProjection('projection:slide', payload)
  })

  ipcMain.on('presentations:clearSlide', () => {
    windowManager.sendToProjection('projection:clear', null)
  })
}