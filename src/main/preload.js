const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    platform: process.platform,

    // 窗口控制
    closeWindow: () => ipcRenderer.send("window-control", "close"),
    minimizeWindow: () => ipcRenderer.send("window-control", "minimize"),
    toggleWindow: () => ipcRenderer.send("window-control", "toggle"),

    // 原生方法
    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),
    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
    openConfirmDialog: () => ipcRenderer.invoke("open-confirm-dialog"),
    openExternal: url => ipcRenderer.invoke("open-external", url),

    // 文件读写
    readFolders: folders => ipcRenderer.invoke("read-folders", folders),
    readFolder: folder => ipcRenderer.invoke("read-folder", folder),
    readImages: folder => ipcRenderer.invoke("read-images", folder),
    getParentFolder: file => ipcRenderer.invoke("get-parent-folder", file),
    getConfig: key => ipcRenderer.invoke("get-config", key),
    updateConfig: (key, value) => ipcRenderer.invoke("update-config", key, value),
    trashFile: path => ipcRenderer.invoke("trash-file", path),
    deleteFile: path => ipcRenderer.invoke("delete-file", path),

    // 双击文件启动应用
    getFileToOpen: () => ipcRenderer.invoke("get-file-to-open"),
    onFileOpened: callback => ipcRenderer.on("file-opened", callback)
});

contextBridge.exposeInMainWorld("image", {
    getMetadata: path => ipcRenderer.invoke("get-metadata", path),
    createThumbnail: path => ipcRenderer.invoke("create-thumbnail", path)
});