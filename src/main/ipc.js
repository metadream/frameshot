import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { getConfig, updateConfig } from "./config.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";

// Sharp 支持的所有图片格式
const imageFormats = /\.(avif|gif|heic|jpeg|jpg|png|raw|svg|tiff|webp)$/i;
// 可保持相同格式的位图列表
const rasterFormats = /\.(avif|heic|jpeg|jpg|png|raw|tiff|webp)$/i;
// 当无法保持格式时使用的默认输出格式
const fallbackFormat = ".png";
// 临时缓存目录路径
const tempPath = path.join(app.getPath("temp"), app.getName());
fs.mkdirSync(tempPath, { recursive: true });

ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));

ipcMain.handle("get-config", (event, key) => getConfig(key));
ipcMain.handle("update-config", (event, key, value) => updateConfig(key, value));

/** 打开原生文件选择对话框 (支持目录多选) */
ipcMain.handle("open-file-dialog", () => {
    return dialog.showOpenDialog({
        properties: ["openDirectory", "multiSelections"]
    });
});

/** 打开原生确认对话框 */
ipcMain.handle("open-confirm-dialog", () => {
    return dialog.showMessageBoxSync({
        type: "question",
        title: "Confirm Message",
        message: "Are you sure to delete this image?",
        buttons: ["Cancel", "Confirm"],
        defaultId: 1
    });
});

/** 将文件夹数组构建成树形组件所需数据结构 (限制读取深度) */
ipcMain.handle("read-folders", async (event, folders, maxDepth = 0) => {
    return folders
    .filter(p => fs.existsSync(p) && fs.statSync(p).isDirectory())
    .map(dir => {
        const build = (p, depth) => {
            const node = { name: path.basename(p), path: p };

            if (maxDepth === 0 || depth < maxDepth) {
                const children = fs.readdirSync(p)
                                   .map(item => path.join(p, item))
                                   .filter(fullPath => fs.statSync(fullPath).isDirectory())
                                   .map(child => build(child, depth + 1))
                                   .sort((a, b) => a.name.localeCompare(b.name));
                if (children.length > 0) node.children = children;
            }
            return node;
        };
        return build(dir, 0);
    });
});

/** 读取单个目录下所有图片文件 */
ipcMain.handle("read-images", async (event, folder) => {
    return fs.readdirSync(folder)
             .map(p => path.join(folder, p))
             .filter(p => fs.existsSync(p) && fs.statSync(p).isFile() && imageFormats.test(p))
             .sort((a, b) => a.localeCompare(b));
});

/** 将文件移除到回收站 */
ipcMain.handle("trash-file", async (event, filePath) => {
    try {
        await shell.trashItem(filePath);
        return true;
    } catch (e) {
        return false;
    }
});

/** 彻底删除文件 */
ipcMain.handle("delete-file", async (event, filePath) => {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
});

/** 获取图片元数据 */
ipcMain.handle("get-metadata", async (event, inputPath) => {
    const { format, width, height } = await sharp(inputPath).metadata();
    const { size, mtimeMs } = fs.statSync(inputPath);
    return {
        original: inputPath,
        name: path.basename(inputPath),
        mtime: mtimeMs,
        resolution: width * height,
        size, format, width, height
    };
});

/** 如果不存在则创建缩略图并缓存到系统临时目录 */
ipcMain.handle("create-thumbnail", async (event, inputPath) => {
    const fileKey = crypto.createHash("md5").update(inputPath).digest("hex");
    const ext = path.extname(inputPath).toLowerCase();
    const outputFormat = rasterFormats.test(ext) ? ext : fallbackFormat;
    const outputPath = path.join(tempPath, fileKey + outputFormat);

    if (!fs.existsSync(outputPath)) {
        await sharp(inputPath)
        .resize(256, 256, { fit: "inside", withoutEnlargement: true })
        .toFile(outputPath);
    }
    return outputPath;
});

/** 窗口控制 */
ipcMain.on("window-control", (event, action) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) switch (action) {
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