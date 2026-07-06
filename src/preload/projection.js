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
  onMedia:   (cb) => ipcRenderer.on('projection:media',    (_e, payload) => cb(payload)),
  onMediaControl: (cb) => ipcRenderer.on('projection:mediaControl', (_e, payload) => cb(payload)),
  onSetBg:   (cb) => ipcRenderer.on('projection:setBg',    (_e, payload) => cb(payload)),
  onSetFont: (cb) => ipcRenderer.on('projection:setFont',  (_e, name)    => cb(name)),
  onSetFontSize: (cb) => ipcRenderer.on('projection:setFontSize', (_e, mode) => cb(mode)),
  onSetWatermark: (cb) => ipcRenderer.on('projection:setWatermark', (_e, payload) => cb(payload)),
  onSetScreen:    (cb) => ipcRenderer.on('projection:setScreen',    (_e, mode)    => cb(mode)),

  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('projection:receive')
    ipcRenderer.removeAllListeners('projection:clear')
    ipcRenderer.removeAllListeners('projection:freeze')
    ipcRenderer.removeAllListeners('projection:slide')
    ipcRenderer.removeAllListeners('projection:media')
    ipcRenderer.removeAllListeners('projection:mediaControl')
    ipcRenderer.removeAllListeners('projection:setBg')
    ipcRenderer.removeAllListeners('projection:setFont')
    ipcRenderer.removeAllListeners('projection:setFontSize')
    ipcRenderer.removeAllListeners('projection:setWatermark')
    ipcRenderer.removeAllListeners('projection:setScreen')
  },
})