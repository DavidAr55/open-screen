import { ipcMain } from 'electron'

/**
 * Canales IPC para la biblioteca de contenido.
 *
 * Convención de nombres: 'library:<acción>'
 * Los handlers `ipcMain.handle` retornan una Promise implícita al renderer.
 */
export function registerLibraryIPC(libraryRepo) {

  // Obtener todos (con filtros opcionales)
  ipcMain.handle('library:findAll', (_e, filters) => {
    return libraryRepo.findAll(filters)
  })

  // Obtener uno por ID
  ipcMain.handle('library:findById', (_e, id) => {
    return libraryRepo.findById(id)
  })

  // Crear
  ipcMain.handle('library:create', (_e, data) => {
    return libraryRepo.create(data)
  })

  // Actualizar
  ipcMain.handle('library:update', (_e, id, data) => {
    return libraryRepo.update(id, data)
  })

  // Eliminar
  ipcMain.handle('library:delete', (_e, id) => {
    return libraryRepo.delete(id)
  })

  // Total de ítems
  ipcMain.handle('library:count', (_e, type) => {
    return libraryRepo.count(type)
  })
}
