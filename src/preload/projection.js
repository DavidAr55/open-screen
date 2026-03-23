import { contextBridge, ipcRenderer } from 'electron'

/**
 * API expuesta a la ventana de proyección.
 * Solo puede RECIBIR eventos — no puede enviar nada al proceso principal.
 */
contextBridge.exposeInMainWorld('api', {
  onReceive: (cb) => ipcRenderer.on('projection:receive',  (_e, payload) => cb(payload)),
  onClear:   (cb) => ipcRenderer.on('projection:clear',    ()            => cb()),
  onFreeze:  (cb) => ipcRenderer.on('projection:freeze',   (_e, data)    => cb(data)),
  onSlide:   (cb) => ipcRenderer.on('projection:slide',    (_e, payload) => cb(payload)),

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('projection:receive')
    ipcRenderer.removeAllListeners('projection:clear')
    ipcRenderer.removeAllListeners('projection:freeze')
    ipcRenderer.removeAllListeners('projection:slide')
  },
})