const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),
    getDesktop: () => ipcRenderer.invoke("get-desktop"),

    openExternal: url => ipcRenderer.invoke("open-external", url),
    openFileDialog: multiple => ipcRenderer.invoke("open-file-dialog", multiple),
    getFilePath: file => webUtils.getPathForFile(file),
    getThumbnail: path => ipcRenderer.invoke("get-thumbnail", path),
    readFilePaths: paths => ipcRenderer.invoke("read-file-paths", paths)
});