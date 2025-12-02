const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),
    getDesktop: () => ipcRenderer.invoke("get-desktop"),
    getFilePath: file => webUtils.getPathForFile(file),

    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
    openExternal: url => ipcRenderer.invoke("open-external", url),
    readFilePaths: paths => ipcRenderer.invoke("read-file-paths", paths)
});

contextBridge.exposeInMainWorld("image", {
    createThumbnail: path => ipcRenderer.invoke("create-thumbnail", path)
});