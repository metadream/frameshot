import { app, dialog, ipcMain, shell } from "electron";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const imageTypes = ["avif", "bmp", "gif", "heic", "jpg", "jpeg", "png", "raw", "svg", "tiff", "webp"];
const imageExpr = new RegExp(`\\.(${imageTypes.join("|")})$`, "i");

ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("get-picture-path", () => app.getPath("pictures"));
ipcMain.handle("get-temp-path", () => app.getPath("temp"));
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));

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
    const dirs = [];
    const images = [];

    if (filePaths && filePaths.length) {
        for (const filePath of filePaths) {
            if (!fs.existsSync(filePath)) continue;

            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                dirs.push(filePath);
                const files = fs.readdirSync(filePath)
                                .filter(file => imageExpr.test(file))
                                .map(file => path.join(filePath, file));
                images.push(...files);
            } else {
                images.push(filePath);
            }
        }
    }
    return { dirs, images };
});

/** 创建缩略图 */
ipcMain.handle("create-thumbnail", async (event, filePath) => {
    const buffer = await sharp(filePath).resize(128, 128, { fit: 'inside' }).toBuffer();
    return buffer;
});