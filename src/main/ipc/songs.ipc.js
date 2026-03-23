import { ipcMain } from 'electron'

export function registerSongsIPC(songsRepo) {
  ipcMain.handle('songs:findAll',       (_e, filters)      => songsRepo.findAll(filters))
  ipcMain.handle('songs:findById',      (_e, id)           => songsRepo.findById(id))
  ipcMain.handle('songs:create',        (_e, data)         => songsRepo.create(data))
  ipcMain.handle('songs:update',        (_e, id, data)     => songsRepo.update(id, data))
  ipcMain.handle('songs:delete',        (_e, id)           => songsRepo.delete(id))
  ipcMain.handle('songs:toggleFavorite',(_e, id)           => songsRepo.toggleFavorite(id))
  ipcMain.handle('songs:getArtists',    ()                 => songsRepo.getArtists())
  ipcMain.handle('songs:count',         ()                 => songsRepo.count())
}