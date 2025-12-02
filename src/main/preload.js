const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),
    getPicturePath: () => ipcRenderer.invoke("get-picture-path"),
    getTempPath: () => ipcRenderer.invoke("get-temp-path"),
    getFilePath: file => webUtils.getPathForFile(file),

    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
    openExternal: url => ipcRenderer.invoke("open-external", url),
    readFilePaths: paths => ipcRenderer.invoke("read-file-paths", paths)
});

contextBridge.exposeInMainWorld("image", {
    createThumbnail: path => ipcRenderer.invoke("create-thumbnail", path)
});