import { openImage } from "./control.js";

// 显示应用名称和版本
document.querySelector("#file-count").innerText =
    `${await electron.getAppName()} v${await electron.getAppVersion()}`;

// 非Mac上设置窗体圆角边框
if (electron.platform !== "darwin") {
    document.body.classList.add("rounded-border");
}

// 监听应用启动后再从文件打开事件
electron.onFileOpened(async (event, fileToOpen) => {
    openImage(fileToOpen);
});

// 检查启动时是否有通过"打开方式"传入的文件
const fileToOpen = await electron.getFileToOpen();
if (fileToOpen) {
    openImage(fileToOpen);
}
