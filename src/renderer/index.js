import sidebar from "./sidebar.js";

// 非Mac上设置窗体圆角边框
if (electron.platform !== "darwin") {
    document.body.classList.add("rounded-border");
}

// 监听直接打开文件事件
electron.onFileOpened(async (event, fileToOpen) => {
    const folder = await electron.getDirectory(fileToOpen);
    sidebar.render([folder]);
});

// 启动后打开文件夹
const fileToOpen = await electron.getFileToOpen();
if (fileToOpen) {
    // 如果存在双击打开的文件则打开该文件所在文件夹
    const folder = await electron.getDirectory(fileToOpen);
    sidebar.render([folder]);
} else {
    // 否则打开应用配置中的默认文件夹
    const folders = await electron.getConfig("picture_folders");
    sidebar.render(folders);
}