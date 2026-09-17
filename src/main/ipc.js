import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { execFileSync } from "child_process";
import { SUPPORTED_EXTS, isSupportedExt } from "./protocol.js";
import { convertImage, cropImage, isHeifExt } from "./decode.js";
import fs from "fs";
import path from "path";

/** 原生基础方法 */
ipcMain.handle("get-file-to-open", () => global.fileToOpen);
ipcMain.handle("get-app-name", () => app.getName());
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-app-path", () => app.getAppPath());
ipcMain.handle("open-external", (event, url) => shell.openExternal(url));

/** 原生提示信息弹窗 */
ipcMain.handle("show-message-box", (event, message) => {
    dialog.showMessageBox({ title: "Information", message });
});

/** 原生错误信息弹窗 */
ipcMain.handle("show-error-box", (event, message) => {
    dialog.showErrorBox("Error Message", message);
});

/** 原生确认对话框，网络卷提示将永久删除 */
ipcMain.handle("open-confirm-dialog", (event, file) => {
    const network = isNetworkVolume(file);
    return dialog.showMessageBoxSync({
        type: "question",
        title: "Confirmation",
        message: network
            ? "This file is on a network volume. It will be permanently deleted without recycle bin. Continue?"
            : "Are you sure to move this image to the recycle bin?",
        buttons: ["No", "Yes"],
        defaultId: 1,
        cancelId: 0,
    });
});

/** 原生文件选择对话框 (图片文件单选) */
ipcMain.handle("open-file-dialog", () => {
    return dialog.showOpenDialog({
        properties: ["openFile"],
        filters: [{ name: "Images", extensions: SUPPORTED_EXTS }],
    });
});

/** 获取同级目录的所有图片 */
ipcMain.handle("get-sibling-images", async (event, file) => {
    return fs
        .readdirSync(path.dirname(file), { withFileTypes: true })
        .filter((entry) => entry.isFile() && isSupportedExt(entry.name))
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
    return convertImage(inputFile, outFormat, outputFile);
});

/** 裁剪图片并保存到同级目录 */
ipcMain.handle("crop-image", async (event, inputFile, cropRect) => {
    const parsedPath = path.parse(inputFile);
    const ext = parsedPath.ext.toLowerCase();
    const outputFile = path.join(parsedPath.dir, `${parsedPath.name}_cropped${isHeifExt(ext) ? ".jpg" : ext}`);
    return cropImage(inputFile, cropRect, outputFile);
});

/** 移入回收站；网络卷无回收站时退回彻底删除 */
ipcMain.handle("trash-file", async (event, file) => {
    try {
        await shell.trashItem(file);
        return true;
    } catch (e) {
        try {
            if (fs.existsSync(file)) fs.unlinkSync(file);
            return true;
        } catch (err) {
            return false;
        }
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
            app.exit(0);
            break;
        case "minimize":
            win.minimize();
            break;
        case "toggle":
            win.isMaximized() ? win.unmaximize() : win.maximize();
            break;
    }
});

/** 网络文件系统类型集合（无本地回收站语义） */
const NETWORK_FS = new Set(["smbfs", "cifs", "nfs", "nfs4", "afpfs"]);

/** 判断文件是否位于网络文件系统（如 SMB）上 */
function isNetworkVolume(file) {
    try {
        let best = null;
        for (const line of listMounts().split("\n")) {
            const match = line.match(/^.*?\son\s(.+?)\s\(([^,()]+)/);
            if (!match) continue;
            const point = match[1];
            const type = match[2].toLowerCase();
            if (file === point || file.startsWith(point + "/")) {
                if (!best || point.length > best.point.length) best = { point, type };
            }
        }
        return best ? NETWORK_FS.has(best.type) : false;
    } catch (e) {
        return false;
    }
}

/** 执行 mount 命令获取挂载点列表（内部分隔字符避免空白挂载点） */
function listMounts() {
    for (const cmd of ["/sbin/mount", "/bin/mount", "mount"]) {
        try {
            return execFileSync(cmd, { encoding: "utf8", timeout: 5000 });
        } catch (e) {
            // 尝试下一个命令
        }
    }
    return "";
}
