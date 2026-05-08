import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import fs from "fs";
import path from "path";
import sharp from "sharp";

// Sharp支持的所有图片格式
const imageFormats = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "heic", "avif", "tiff", "raw"];
const imageRegex = new RegExp(`\\.(${imageFormats.join("|")})$`, "i");

/** 原生基础方法 */
ipcMain.handle("get-file-to-open", () => global.fileToOpen);
ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));

/** 原生提示信息弹窗 */
ipcMain.handle("show-message-box", (event, message) => {
    dialog.showMessageBox({ title: "提示信息", message });
});

/** 原生错误信息弹窗 */
ipcMain.handle("show-error-box", (event, message) => {
    dialog.showErrorBox("错误信息", message);
});

/** 原生文件选择对话框 (图片文件单选) */
ipcMain.handle("open-file-dialog", () => {
    return dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: imageFormats }],
    });
});

/** 原生确认对话框 */
ipcMain.handle("open-confirm-dialog", () => {
    return dialog.showMessageBoxSync({
        type: "question",
        title: "确认信息",
        message: "确定删除这张图片吗?",
        buttons: ["取消", "确定"],
        defaultId: 1,
    });
});

/** 获取同级目录的所有图片 */
ipcMain.handle("get-sibling-images", async (event, file) => {
    return fs
        .readdirSync(path.dirname(file), { withFileTypes: true })
        .filter((entry) => entry.isFile() && imageRegex.test(entry.name))
        .map((entry) => {
            const imagePath = path.join(entry.parentPath, entry.name);
            const ext = path.extname(entry.name).slice(1).toLowerCase();
            const { size, mtimeMs } = fs.statSync(imagePath);
            return {
                name: entry.name,
                path: imagePath,
                mtime: mtimeMs,
                format: ext,
                size,
            };
        });
});

/** 转换图片格式并保存 */
ipcMain.handle("convert-image", async (event, inputFile, outFormat) => {
    const parsedPath = path.parse(inputFile);
    const outputFile = path.join(parsedPath.dir, `${parsedPath.name}_converted.${outFormat}`);

    if (outFormat === "png") {
        await sharp(inputFile).png().toFile(outputFile);
    } else if (outFormat === "jpg" || outFormat === "jpeg") {
        await sharp(inputFile).jpeg({ quality: 96 }).toFile(outputFile);
    } else {
        throw new Error("不支持的输出格式");
    }
    return outputFile;
});

/** 裁剪图片并保存到同级目录 */
ipcMain.handle("crop-image", async (event, inputFile, cropRect) => {
    const { x, y, width, height } = cropRect;
    const parsedPath = path.parse(inputFile);
    const outputFile = path.join(parsedPath.dir, `${parsedPath.name}_cropped${parsedPath.ext}`);

    await sharp(inputFile).extract({ left: x, top: y, width, height }).toFile(outputFile);
    return outputFile;
});

/** 将文件移除到回收站 */
ipcMain.handle("trash-file", async (event, file) => {
    try {
        await shell.trashItem(file);
        return true;
    } catch (e) {
        return false;
    }
});

/** 彻底删除文件 */
ipcMain.handle("delete-file", async (event, file) => {
    if (fs.existsSync(file)) {
        fs.unlinkSync(file);
    }
});

/** 窗口控制 */
ipcMain.on("window-control", (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) return;

    switch (action) {
        case "close":
            win.close();
            break;
        case "minimize":
            win.minimize();
            break;
        case "toggle":
            win.isMaximized() ? win.unmaximize() : win.maximize();
            break;
    }
});
