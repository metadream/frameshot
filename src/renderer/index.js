import sidebar from "./sidebar.js";

// 非Mac上设置窗体圆角边框
if (electron.platform !== "darwin") {
    document.body.classList.add("rounded-border");
}

// 监听直接打开文件的情况
electron.onFileOpened((event, filePath) => {
    console.log("filePath=============", filePath);
});

// 打开默认文件夹
const defaultFolders = await electron.getDefaultFolders();
sidebar.render(defaultFolders);