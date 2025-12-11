import sidebar from "./sidebar.js";

// 通知主进程渲染进程已就绪
electron.renderReady();

// 非Mac上设置窗体圆角边框
if (electron.platform !== "darwin") {
    document.body.classList.add("rounded-border");
}

// 监听直接打开文件的情况
electron.onFileOpened(async (event, filePath) => {
    const folder = await electron.getFolder(filePath);
    sidebar.render([folder]);
});

// 打开默认文件夹
const pictureFolders = await electron.getConfig("picture_folders");
sidebar.render(pictureFolders);