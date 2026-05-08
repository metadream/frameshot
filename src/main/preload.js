const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    platform: process.platform,

    // 窗口控制
    closeWindow: () => ipcRenderer.send("window-control", "close"),
    minimizeWindow: () => ipcRenderer.send("window-control", "minimize"),
    toggleWindow: () => ipcRenderer.send("window-control", "toggle"),

    // 原生方法
    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppVersion: () => ipcRenderer.invoke("get-app-version"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),
    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
    openConfirmDialog: () => ipcRenderer.invoke("open-confirm-dialog"),
    showErrorBox: (message) => ipcRenderer.invoke("show-error-box", message),
    showMessageBox: (message) => ipcRenderer.invoke("show-message-box", message),
    openExternal: (url) => ipcRenderer.invoke("open-external", url),

    // 文件读写
    getFilePath: (file) => webUtils.getPathForFile(file),
    getSiblingImages: (folder) => ipcRenderer.invoke("get-sibling-images", folder),
    trashFile: (path) => ipcRenderer.invoke("trash-file", path),
    deleteFile: (path) => ipcRenderer.invoke("delete-file", path),

    // 双击文件启动应用
    getFileToOpen: () => ipcRenderer.invoke("get-file-to-open"),
    onFileOpened: (callback) => ipcRenderer.on("file-opened", callback),

    // 图片处理
    convertImage: (input, format) => ipcRenderer.invoke("convert-image", input, format),
    cropImage: (input, cropRect) => ipcRenderer.invoke("crop-image", input, cropRect),
});
