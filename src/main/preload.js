const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    platform: process.platform,

    closeWindow: () => ipcRenderer.send("window-control", "close"),
    minimizeWindow: () => ipcRenderer.send("window-control", "minimize"),
    toggleWindow: () => ipcRenderer.send("window-control", "toggle"),

    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),
    getDefaultFolders: () => ipcRenderer.invoke("get-default-folders"),

    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
    openExternal: url => ipcRenderer.invoke("open-external", url),
    readFolders: folders => ipcRenderer.invoke("read-folders", folders),
    readImages: folder => ipcRenderer.invoke("read-images", folder),
    deleteFile: path => ipcRenderer.invoke("delete-file", path),
    updateConfig: (key, value) => ipcRenderer.invoke("update-config", key, value),

    onFileOpened: callback => ipcRenderer.on("file-opened", callback)
});

contextBridge.exposeInMainWorld("image", {
    getMetadata: path => ipcRenderer.invoke("get-metadata", path),
    createThumbnail: path => ipcRenderer.invoke("create-thumbnail", path)
});