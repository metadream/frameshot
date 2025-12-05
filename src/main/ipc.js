import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { getConfig, updateConfig } from "./config.js";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import sharp from "sharp";

const imageTypes = ["avif", "bmp", "gif", "heic", "jpg", "jpeg", "png", "raw", "svg", "tiff", "webp"];
const imageExpr = new RegExp(`\\.(${imageTypes.join("|")})$`, "i");
const tempPath = path.join(app.getPath("temp"), app.getName());
fs.mkdirSync(tempPath, { recursive: true });

ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));

ipcMain.handle("get-default-folders", () => getConfig("picture_folders") || [app.getPath("pictures")]);
ipcMain.handle("update-config", (event, key, value) => updateConfig(key, value));

/** 打开原生文件选择对话框 (支持目录多选) */
ipcMain.handle("open-file-dialog", () => {
    return dialog.showOpenDialog({
        properties: ["openDirectory", "multiSelections"]
    });
});

/** 将文件夹数组构建成树形组件所需数据结构 */
ipcMain.handle("read-folders", async (event, folders) => {
    return folders
    .filter(p => fs.existsSync(p) && fs.statSync(p).isDirectory())
    .map(dir => {
        const build = p => {
            const node = { name: path.basename(p), path: p };
            const children = fs.readdirSync(p)
                               .map(item => path.join(p, item))
                               .filter(fullPath => fs.statSync(fullPath).isDirectory())
                               .map(child => build(child))
                               .sort((a, b) => a.name.localeCompare(b.name));
            if (children.length > 0) node.children = children;
            return node;
        };
        return build(dir);
    });
});

/** 读取单个目录下所有图片文件 */
ipcMain.handle("read-images", async (event, folder) => {
    return fs.readdirSync(folder)
             .map(p => path.join(folder, p))
             .filter(p => fs.existsSync(p) && fs.statSync(p).isFile() && imageExpr.test(p))
             .sort((a, b) => a.localeCompare(b));
});

/** 如果不存在则创建缩略图并缓存到系统临时目录 */
ipcMain.handle("create-thumbnail", async (event, inputPath) => {
    const fileKey = crypto.createHash('md5').update(inputPath).digest('hex');
    const outputPath = path.join(tempPath, fileKey + path.extname(inputPath));

    const image = sharp(inputPath);
    const metadata = await image.metadata();
    metadata.size = fs.statSync(inputPath).size;
    metadata.original = inputPath;
    metadata.thumbnail = outputPath;

    if (!fs.existsSync(outputPath)) {
        await image
        .resize(256, 256, { fit: "inside", withoutEnlargement: true })
        .toFile(outputPath);
    }
    console.log(metadata);
    return metadata;
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