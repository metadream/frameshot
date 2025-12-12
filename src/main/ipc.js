import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { getConfig, updateConfig } from "./config.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";

// Sharp支持的所有图片格式
const imageFormats = /\.(avif|gif|heic|jpeg|jpg|png|raw|svg|tiff|webp)$/i;
// 可保持相同格式输出的位图格式
const rasterFormats = /\.(avif|heic|jpeg|jpg|png|raw|tiff|webp)$/i;
// 无法保持格式输出时使用的默认格式
const fallbackFormat = ".png";
// 缩略图临时缓存目录路径
const tempPath = path.join(app.getPath("temp"), app.getName());
fs.mkdirSync(tempPath, { recursive: true });

ipcMain.handle("get-file-to-open", () => global.fileToOpen);
ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));
ipcMain.handle("get-parent-folder", (event, file) => path.dirname(file));
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

/**
 * 读取多文件夹是否含子目录
 * 返回结构：[{ name, path, hasChildren }]
 */
ipcMain.handle("read-folders", async (event, folders) => {
    const nodes = [];
    for (const folder of folders) {
        if (fs.existsSync(folder)) {
            const node = { name: path.basename(folder), path: folder };
            const entries = fs.readdirSync(folder, { withFileTypes: true })
                              .filter(entry => entry.isDirectory());
            node.hasChildren = entries.length > 0;
            nodes.push(node);
        }
    }
    return nodes;
});

/**
 * 读取文件夹的子目录及子目录是否还包含孙目录
 * 返回结构：[{ name, path, hasChildren }]
 */
ipcMain.handle("read-folder", async (event, folder) => {
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder, { withFileTypes: true })
             .filter(entry => entry.isDirectory())
             .map(entry => {
                 const fullPath = path.join(entry.parentPath, entry.name);
                 const hasChildren = fs.readdirSync(fullPath, { withFileTypes: true })
                                       .some(child => child.isDirectory());
                 return {
                     name: entry.name,
                     path: fullPath,
                     hasChildren
                 };
             });
});

/** 读取单个文件夹下所有图片文件 */
ipcMain.handle("read-images", async (event, folder) => {
    if (!fs.existsSync(folder)) return [];
    return fs.readdirSync(folder, { withFileTypes: true })
             .filter(entry => entry.isFile() && imageFormats.test(entry.name))
             .map(entry => path.join(entry.parentPath, entry.name))
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