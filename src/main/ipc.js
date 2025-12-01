import { app, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const imageExts = ["avif", "bmp", "gif", "heic", "jpg", "jpeg", "png", "raw", "svg", "tiff", "webp"];
const imageExpr = new RegExp(`\\.(${imageExts.join("|")})$`, "i");

ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("get-desktop", () => app.getPath("desktop"));
ipcMain.handle("open-file-dialog", () => openFileDialog());
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));
ipcMain.handle("get-thumbnail", async (event, filePath) => {
    const buffer = await sharp(filePath).resize(128, 128, { fit: 'inside' }).toBuffer();
    return buffer;
});

ipcMain.handle("read-file-paths", async (event, filePaths) => {
    const dirs = [];
    const images = [];

    if (filePaths && filePaths.length) {
        for (const filePath of filePaths) {
            if (!fs.existsSync(filePath)) continue;

            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                dirs.push(filePath);

                let files = fs.readdirSync(filePath);
                files = files.filter(file => imageExpr.test(file));
                files = files.map(file => path.join(filePath, file));
                images.push(...files);
            } else {
                images.push(filePath);
            }
        }
    }
    return { dirs, images };
});

function openFileDialog() {
    return dialog.showOpenDialog({
        properties: ["openFile", "openDirectory", "multiSelections"],
        filters: [
            { name: "Image Files", extensions: imageExts },
            { name: "All Files", extensions: ["*"] }
        ]
    });
}