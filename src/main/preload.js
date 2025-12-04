const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electron", {
    closeWindow: () => ipcRenderer.send('window-control', 'close'),
    minimizeWindow: () => ipcRenderer.send('window-control', 'minimize'),
    toggleWindow: () => ipcRenderer.send('window-control', 'toggle'),

    platform: process.platform,
    getAppName: () => ipcRenderer.invoke("get-app-name"),
    getAppPath: () => ipcRenderer.invoke("get-app-path"),
    getPicturePaths: () => ipcRenderer.invoke("get-picture-paths"),
    getTempPath: () => ipcRenderer.invoke("get-temp-path"),
    getFilePath: file => webUtils.getPathForFile(file),

    openFileDialog: () => ipcRenderer.invoke("open-file-dialog"),
    openExternal: url => ipcRenderer.invoke("open-external", url),
    readFilePaths: paths => ipcRenderer.invoke("read-file-paths", paths),
    buildTreeData: folders => ipcRenderer.invoke("build-tree-data", folders),
    updateConfig: (key, value) => ipcRenderer.invoke("update-config", key, value)
});

contextBridge.exposeInMainWorld("image", {
    createThumbnail: path => ipcRenderer.invoke("create-thumbnail", path)
});