import { openImage } from "./control.js";

// 显示应用名称和版本
const appName = await electron.getAppName();
const appVersion = await electron.getAppVersion();
document.querySelector("#file-count").innerText = `${appName} v${appVersion}`;

// 监听应用启动后再从文件打开事件
electron.onFileOpened(async (event, fileToOpen) => {
    openImage(fileToOpen);
});

// 检查启动时是否有通过"打开方式"传入的文件
const fileToOpen = await electron.getFileToOpen();
if (fileToOpen) {
    openImage(fileToOpen);
}
