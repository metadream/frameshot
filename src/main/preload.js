const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    platform: process.platform,

    closeWindow: () => ipcRenderer.send("window-control", "close"),
    minimizeWindow: () => ipcRenderer.send("window-control", "minimize"),
    toggleWindow: () => ipcRenderer.send("window-control", "toggle"),

    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),

    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
    openConfirmDialog: () => ipcRenderer.invoke("open-confirm-dialog"),
    openExternal: url => ipcRenderer.invoke("open-external", url),
    readFolders: (folders, maxDepth) => ipcRenderer.invoke("read-folders", folders, maxDepth),
    readImages: folder => ipcRenderer.invoke("read-images", folder),
    getConfig: key => ipcRenderer.invoke("get-config", key),
    updateConfig: (key, value) => ipcRenderer.invoke("update-config", key, value),
    deleteFile: path => ipcRenderer.invoke("delete-file", path),

    onFileOpened: callback => ipcRenderer.on("file-opened", callback)
});

contextBridge.exposeInMainWorld("image", {
    getMetadata: path => ipcRenderer.invoke("get-metadata", path),
    createThumbnail: path => ipcRenderer.invoke("create-thumbnail", path)
});