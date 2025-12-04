import { app, dialog, ipcMain, shell } from "electron";
import { getConfig, updateConfig } from "./config.js";
import fs from "fs";
import path from "path";
import sharp from "sharp";

const imageTypes = ["avif", "bmp", "gif", "heic", "jpg", "jpeg", "png", "raw", "svg", "tiff", "webp"];
const imageExpr = new RegExp(`\\.(${imageTypes.join("|")})$`, "i");

ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("get-picture-paths", () => getConfig("picture_paths") || [app.getPath("pictures")]);
ipcMain.handle("get-temp-path", () => app.getPath("temp"));
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));
ipcMain.handle("update-config", (event, key, value) => updateConfig(key, value));

/** 打开原生文件选择对话框 (支持文件和目录多选) */
ipcMain.handle("open-file-dialog", () => {
    return dialog.showOpenDialog({
        properties: ["openFile", "openDirectory", "multiSelections"],
        filters: [
            { name: "Image Files", extensions: imageTypes },
            { name: "All Files", extensions: ["*"] }
        ]
    });
});

/** 将路径数组解析为纯目录和目录下包含的图片 */
ipcMain.handle("read-file-paths", async (event, filePaths) => {
    const folders = [];
    const images = [];

    if (filePaths && filePaths.length) {
        for (const filePath of filePaths) {
            if (fs.existsSync(filePath)) {
                fs.statSync(filePath).isDirectory()
                    ? folders.push(filePath) : images.push(filePath);
            }
        }
    }
    return { folders, images };
});

ipcMain.handle("build-tree-data", async (event, folders) => {
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

// const files = fs.readdirSync(filePath)
//                 .filter(file => imageExpr.test(file))
//                 .map(file => path.join(filePath, file));
// images.push(...files);

/** 创建缩略图 */
ipcMain.handle("create-thumbnail", async (event, filePath) => {
    const buffer = await sharp(filePath).resize(128, 128, { fit: 'inside' }).toBuffer();
    return buffer;
});