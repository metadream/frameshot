import { openImage } from "./control.js";

// 非Mac上设置窗体圆角边框
if (electron.platform !== "darwin") {
    document.body.classList.add("rounded-border");
}

// 监听应用启动后再从文件打开事件
electron.onFileOpened(async (event, fileToOpen) => {
    openImage(fileToOpen);
});
