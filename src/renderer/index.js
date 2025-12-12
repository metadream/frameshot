import sidebar from "./sidebar.js";
import gallery from "./gallery.js";
import preview from "./preview.js";

// 非Mac上设置窗体圆角边框
if (electron.platform !== "darwin") {
    document.body.classList.add("rounded-border");
}

// 监听应用启动后再从文件打开事件
electron.onFileOpened(async (event, fileToOpen) => {
    const folder = await electron.getParentFolder(fileToOpen);
    await sidebar.render([folder]);

    gallery.render(folder).then(() => {
        const item = gallery.galleryItems.find(v => v.original === fileToOpen);
        gallery.selectItem(item);
        preview.change(item);
    });
});

// 启动后打开文件夹
const fileToOpen = await electron.getFileToOpen();
if (fileToOpen) {
    // 如果存在双击打开的文件则打开该文件所在文件夹
    const folder = await electron.getParentFolder(fileToOpen);
    await sidebar.render([folder]);

    gallery.render(folder).then(() => {
        const item = gallery.galleryItems.find(v => v.original === fileToOpen);
        gallery.selectItem(item);
        preview.open(item, false);
    })
} else {
    // 否则打开应用配置中的默认文件夹
    const folders = await electron.getConfig("picture_folders");
    sidebar.render(folders);
    gallery.render(folders[0]);
}