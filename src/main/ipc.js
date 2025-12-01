import { app, dialog, ipcMain } from "electron";
import sharp from "sharp";

ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("get-desktop", () => app.getPath("desktop"));
ipcMain.handle("open-file-dialog", () => openFileDialog());
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));
ipcMain.handle("get-thumbnail", async (event, filePath) => {
    const buffer = await sharp(filePath).resize(128, 128, { fit: 'inside' }).toBuffer();
    return buffer;
})

function openFileDialog() {
    return dialog.showOpenDialog({
        properties: ["openFile", "openDirectory", "multiSelections"],
        filters: [{
            name: "Image Files", extensions: [
                "avif", "bmp", "gif", "heic", "jpg", "jpeg", "png", "raw", "svg", "tiff", "webp"
            ]
        }, {
            name: "All Files", extensions: ["*"]
        }]
    });
}