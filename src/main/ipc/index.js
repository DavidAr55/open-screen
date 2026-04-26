import { createRepositories }       from '../db/repositories/index.js'
import { registerLibraryIPC }       from './library.ipc.js'
import { registerSettingsIPC }      from './settings.ipc.js'
import { registerProjectionIPC }    from './projection.ipc.js'
import { registerDisplaysIPC }      from './displays.ipc.js'
import { registerBibleIPC }         from './bible.ipc.js'
import { registerSongsIPC }         from './songs.ipc.js'
import { registerPresentationsIPC } from './presentations.ipc.js'
import { registerBackgroundsIPC }   from './backgrounds.ipc.js'

export function registerAllIPC(db, windowManager, bgServerPort = 0) {
  const repos = createRepositories(db)
  registerLibraryIPC(repos.library)
  registerSettingsIPC(repos.settings)
  registerProjectionIPC(windowManager)
  registerDisplaysIPC()
  registerBibleIPC(repos.bible)
  registerSongsIPC(repos.songs)
  registerPresentationsIPC(repos.presentations, windowManager)
  registerBackgroundsIPC(repos.backgrounds, windowManager, bgServerPort)
}