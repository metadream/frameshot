import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import "./ipc.js";

const appPath = app.getAppPath();
const appIcon = path.join(appPath, `assets/build/icon.${process.platform === "win32" ? "ico" : "png"}`);
const preload = path.join(appPath, "src/main/preload.js");
let mainWindow;

app.whenReady().then(() => {
    createWindow();
});

function createWindow() {
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
        icon: appIcon,
        frame: false,
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

    mainWindow.on("closed", function() {
        mainWindow = null;
    });

    mainWindow.maximize();
}