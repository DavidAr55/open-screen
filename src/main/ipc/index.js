import { createRepositories }       from '../db/repositories/index.js'
import { registerAppIPC }           from './app.ipc.js'
import { registerLibraryIPC }       from './library.ipc.js'
import { registerSettingsIPC }      from './settings.ipc.js'
import { registerProjectionIPC }    from './projection.ipc.js'
import { registerDisplaysIPC }      from './displays.ipc.js'
import { registerBibleIPC }         from './bible.ipc.js'
import { registerSongsIPC }         from './songs.ipc.js'
import { registerPresentationsIPC } from './presentations.ipc.js'
import { registerBackgroundsIPC }   from './backgrounds.ipc.js'
import { registerMultimediaIPC }    from './multimedia.ipc.js'
import { registerBackupIPC }        from './backup.ipc.js'
import { registerFontsIPC }         from './fonts.ipc.js'
import { registerWatermarkIPC }      from './watermark.ipc.js'
import { registerSearchIPC }         from './search.ipc.js'

export function registerAllIPC(db, windowManager, bgServerPort = 0) {
  const repos = createRepositories(db)
  registerAppIPC()
  registerLibraryIPC(repos.library)
  registerSettingsIPC(repos.settings)
  registerProjectionIPC(windowManager)
  registerDisplaysIPC(windowManager)
  registerBibleIPC(repos.bible)
  registerSongsIPC(repos.songs, windowManager)
  registerPresentationsIPC(repos.presentations, windowManager)
  registerBackgroundsIPC(repos.backgrounds, windowManager, bgServerPort)
  registerMultimediaIPC(repos.media, windowManager, bgServerPort)
  registerBackupIPC(db, windowManager)
  registerFontsIPC()
  registerWatermarkIPC(windowManager)
  registerSearchIPC(repos) // buscador global: agrega varios dominios, recibe todos los repos
}