const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
    ipcDump: (anything) => ipcRenderer.send('dump', anything),
    ipcPinWindow: (pin) => ipcRenderer.send('pin-window', pin),
    ipcCloseWindow: () => ipcRenderer.send('close-window'),
    ipcMinimizeWindow: () => ipcRenderer.send('minimize-window'),
    ipcMaximizeWindow: (flag) => ipcRenderer.send('maximize-window', flag),
    ipcGetMousePosition: () => ipcRenderer.invoke('get-mouse-position'),
    ipcGetMenuSection: (height) => ipcRenderer.invoke('get-menu-section', height),
    ipcToggleTrafficLight: (flag) => ipcRenderer.send('toggle-traffic-light', flag),
    ipcOnToggleToolBar: (callback) => ipcRenderer.on('toggle-tool-bar', (_event, value) => callback(value)),
})
