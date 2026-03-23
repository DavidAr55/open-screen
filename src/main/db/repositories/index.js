import { SettingsRepository }          from './SettingsRepository.js'
import { LibraryRepository }           from './LibraryRepository.js'
import { MediaRepository }             from './MediaRepository.js'
import { BibleRepository }             from './BibleRepository.js'
import { SongRepository }              from './SongRepository.js'
import { SlidePresentationRepository } from './SlidePresentationRepository.js'

/**
 * Crea todas las instancias de repositorios.
 * BibleRepository gestiona sus propias conexiones (.osb files), no necesita db.
 * @param {import('better-sqlite3').Database} db
 */
export function createRepositories(db) {
  return {
    settings: new SettingsRepository(db),
    library:  new LibraryRepository(db),
    media:    new MediaRepository(db),
    bible:    new BibleRepository(),
    songs:    new SongRepository(db),
    slide:    new SlidePresentationRepository(db),
  }
}