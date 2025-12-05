import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import "./ipc.js";

const appPath = app.getAppPath();
const appIcon = path.join(appPath, `assets/build/icon.${process.platform === "win32" ? "ico" : "png"}`);
const preload = path.join(appPath, "src/main/preload.js");

app.whenReady().then(() => {
    Menu.setApplicationMenu(null);

    const mainWindow = new BrowserWindow({
        icon: appIcon,
        frame: false,
        show: false,
        width: 900,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload
        }
    });

    mainWindow.loadFile("index.html");
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.maximize();
});