import { app, BrowserWindow, Menu } from "electron";
import path from "path";
import fs from "fs";
import "./ipc.js";

const appPath = app.getAppPath();
const appIcon = path.join(appPath, `assets/build/icon.${process.platform === "win32" ? "ico" : "png"}`);
const preload = path.join(appPath, "src/main/preload.js");

let mainWindow = null;

/** 确保应用始终运行一个实例 */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit() } else {
    // 如果尝试启动第二个实例，则显示第一个
    app.on("second-instance", (_event, _commandLine, _workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    // Electron初始化完成时创建主窗口
    app.whenReady().then(() => {
        createWindow();
    });
}

/** 创建应用程序主窗口 */
function createWindow() {
    Menu.setApplicationMenu(null);

    mainWindow = new BrowserWindow({
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

    // 加载主页面
    mainWindow.loadFile("index.html");
    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    // 默认最大化窗口
    mainWindow.maximize();

    // Windows/Linux 双击打开文件通过命令行参数传递
    const files = getFilesFromArgs(process.argv);
    if (files.length > 0) {
        global.fileToOpen = files[0];
    }
}

// MacOS 处理双击打开文件的情况
app.on("open-file", (event, filePath) => {
    event.preventDefault();

    // 如果应用已启动直接发送，否则保存路径稍后处理
    if (mainWindow) {
        mainWindow.webContents.send("file-opened", filePath);
    } else {
        global.fileToOpen = filePath;
    }
});

/** 从启动参数中提取文件路径 */
function getFilesFromArgs(argv) {
    const files = [];
    const args = argv.slice(1); // 去掉第一个参数（通常是应用路径）

    args.forEach(arg => {
        if (arg !== "." && !arg.startsWith("-") &&
            !arg.includes("electron") &&
            !arg.includes(app.getAppPath())) {

            try {
                const fullPath = path.resolve(arg);
                if (fs.statSync(fullPath).isFile()) {
                    files.push(fullPath);
                }
            } catch (error) {
                // 忽略无效路径
            }
        }
    });
    return files;
}