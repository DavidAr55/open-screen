const { contextBridge, ipcRenderer } = require('electron')

// API segura expuesta al renderer (sin acceso directo a Node)
contextBridge.exposeInMainWorld('openScreen', {

  // Enviar contenido a la pantalla de proyección
  project: (payload) => ipcRenderer.send('project:send', payload),

  // Limpiar pantalla de proyección
  clear: () => ipcRenderer.send('project:clear'),

  // Obtener lista de monitores
  getDisplays: () => ipcRenderer.invoke('displays:get'),

  // Escuchar contenido entrante (usado en projection.html)
  onReceive: (callback) => ipcRenderer.on('project:receive', (_, payload) => callback(payload)),
  onClear: (callback) => ipcRenderer.on('project:clear', () => callback()),
})
