import { ipcMain, shell } from 'electron'

/**
 * Canales IPC para los módulos bíblicos (.osb).
 * Convención de nombres: 'bible:<acción>'
 */
export function registerBibleIPC(bibleRepo) {

  // Lista los módulos instalados en userData/bibles/
  ipcMain.handle('bible:listModules', () =>
    bibleRepo.listModules()
  )

  // Abre el directorio bibles/ en el explorador del SO
  // El usuario arrastra/copia los .osb aquí para instalarlos
  ipcMain.handle('bible:openBiblesDir', () => {
    const dir = bibleRepo.getBiblesDir()
    shell.openPath(dir)
    return dir
  })

  // Libros de un módulo
  ipcMain.handle('bible:getBooks', (_e, moduleId) =>
    bibleRepo.getBooks(moduleId)
  )

  // Nº de capítulos de un libro
  ipcMain.handle('bible:getChapterCount', (_e, moduleId, bookId) =>
    bibleRepo.getChapterCount(moduleId, bookId)
  )

  // Versículo individual
  ipcMain.handle('bible:getVerse', (_e, moduleId, book, chapter, verse) =>
    bibleRepo.getVerse(moduleId, book, chapter, verse)
  )

  // Capítulo completo
  ipcMain.handle('bible:getChapter', (_e, moduleId, book, chapter) =>
    bibleRepo.getChapter(moduleId, book, chapter)
  )

  // Búsqueda de texto libre
  ipcMain.handle('bible:search', (_e, moduleId, query, options) =>
    bibleRepo.search(moduleId, query, options)
  )

  // Validar un .osb externo antes de copiarlo al directorio
  ipcMain.handle('bible:validateModule', (_e, filePath) =>
    bibleRepo.validateModule(filePath)
  )
}
