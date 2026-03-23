import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  projection: {
    send:   (payload) => ipcRenderer.send('projection:send', payload),
    clear:  ()        => ipcRenderer.send('projection:clear'),
    freeze: (frozen)  => ipcRenderer.send('projection:freeze', frozen),
  },
  library: {
    findAll:  (filters)    => ipcRenderer.invoke('library:findAll', filters),
    findById: (id)         => ipcRenderer.invoke('library:findById', id),
    create:   (data)       => ipcRenderer.invoke('library:create', data),
    update:   (id, data)   => ipcRenderer.invoke('library:update', id, data),
    delete:   (id)         => ipcRenderer.invoke('library:delete', id),
    count:    (type)       => ipcRenderer.invoke('library:count', type),
  },
  settings: {
    get:     (key, def)    => ipcRenderer.invoke('settings:get', key, def),
    set:     (key, val)    => ipcRenderer.invoke('settings:set', key, val),
    getAll:  ()            => ipcRenderer.invoke('settings:getAll'),
    setMany: (entries)     => ipcRenderer.invoke('settings:setMany', entries),
  },
  displays: {
    getAll: () => ipcRenderer.invoke('displays:getAll'),
  },
  bible: {
    listModules:     ()                      => ipcRenderer.invoke('bible:listModules'),
    openBiblesDir:   ()                      => ipcRenderer.invoke('bible:openBiblesDir'),
    getBooks:        (id)                    => ipcRenderer.invoke('bible:getBooks', id),
    getChapterCount: (id, bookId)            => ipcRenderer.invoke('bible:getChapterCount', id, bookId),
    getVerse:        (id, book, ch, v)       => ipcRenderer.invoke('bible:getVerse', id, book, ch, v),
    getChapter:      (id, book, ch)          => ipcRenderer.invoke('bible:getChapter', id, book, ch),
    search:          (id, query, opts)       => ipcRenderer.invoke('bible:search', id, query, opts),
    validateModule:  (filePath)              => ipcRenderer.invoke('bible:validateModule', filePath),
  },
  songs: {
    findAll:        (filters)  => ipcRenderer.invoke('songs:findAll', filters),
    findById:       (id)       => ipcRenderer.invoke('songs:findById', id),
    create:         (data)     => ipcRenderer.invoke('songs:create', data),
    update:         (id, data) => ipcRenderer.invoke('songs:update', id, data),
    delete:         (id)       => ipcRenderer.invoke('songs:delete', id),
    toggleFavorite: (id)       => ipcRenderer.invoke('songs:toggleFavorite', id),
    getArtists:     ()         => ipcRenderer.invoke('songs:getArtists'),
    count:          ()         => ipcRenderer.invoke('songs:count'),
  },
  presentations: {
    findAll:      ()           => ipcRenderer.invoke('presentations:findAll'),
    findById:     (id)         => ipcRenderer.invoke('presentations:findById', id),
    import:       ()           => ipcRenderer.invoke('presentations:import'),
    readFile:     (id)         => ipcRenderer.invoke('presentations:readFile', id),
    update:       (id, data)   => ipcRenderer.invoke('presentations:update', id, data),
    delete:       (id)         => ipcRenderer.invoke('presentations:delete', id),
    openDir:      ()           => ipcRenderer.invoke('presentations:openDir'),
    projectSlide: (payload)    => ipcRenderer.send('presentations:projectSlide', payload),
    clearSlide:   ()           => ipcRenderer.send('presentations:clearSlide'),
  },
})