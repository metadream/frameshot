import { app, BrowserWindow, Menu, protocol } from "electron";
import { IMAGE_FORMATS, PROTOCOL } from "./formats.js";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import heicConvert from "heic-convert";
import "./ipc.js";

const appPath = app.getAppPath();
const appIcon = path.join(appPath, `assets/build/icon.${process.platform === "win32" ? "ico" : "png"}`);
const preload = path.join(appPath, "src/main/preload.js");
let mainWindow = null;

// 注册自定义协议（必须在 app ready 之前）
protocol.registerSchemesAsPrivileged([
    { scheme: PROTOCOL, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

/** 确保应用始终运行一个实例 */
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.quit();
} else {
    // 如果尝试启动第二个实例，则显示第一个并传递参数
    app.on("second-instance", (event, argv) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();

            const files = getFilesFromArgs(argv);
            if (files.length > 0) {
                mainWindow.webContents.send("file-opened", files[0]);
            }
        }
    });

    // MacOS 处理双击打开文件的情况
    app.on("open-file", (event, filePath) => {
        event.preventDefault();

        // 如果应用已启动直接发送给渲染进程
        if (mainWindow) {
            mainWindow.webContents.send("file-opened", filePath);
        } else {
            global.fileToOpen = filePath;
        }
    });

    // Electron初始化完成时创建主窗口
    app.whenReady().then(() => {
        // 注册图片预览协议：浏览器不支持的格式通过Sharp解码后返回JPEG
        protocol.handle(PROTOCOL, async (request) => {
            try {
                let filePath = decodeURIComponent(request.url.slice(`${PROTOCOL}://`.length));

                // 确保 Windows 盘符格式正确
                if (process.platform === "win32") {
                    filePath = filePath.replace(/^\//, "").replace(/^([A-Za-z])\//, "$1:/");
                } else if (!filePath.startsWith("/")) {
                    // 浏览器会将 frameshot:///path 标准化为 frameshot://path（去掉空 authority），补回前导 /
                    filePath = "/" + filePath;
                }

                // 检查文件扩展名是否在支持的格式列表中
                const ext = path.extname(filePath).toLowerCase();
                const format = IMAGE_FORMATS.find((v) => v.extension === ext);
                if (!format) {
                    return new Response("Unsupported format", { status: 415 });
                }

                // 如果格式支持 MIME 类型，则直接读取文件返回
                const buffer = await fs.promises.readFile(filePath);
                if (format.mime !== null) {
                    return new Response(buffer, { headers: { "Content-Type": format.mime } });
                }

                // 否则转换为 JPEG 格式返回
                const output = await (ext === ".heic" || ext === ".heif"
                    ? heicConvert({ buffer, format: "JPEG", quality: 0.9 })
                    : sharp(buffer).jpeg({ quality: 90 }).toBuffer());
                return new Response(output, { headers: { "Content-Type": "image/jpeg" } });
            } catch (err) {
                console.error("Preview image error:", err);
                return new Response(null, { status: 404 });
            }
        });
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
            preload,
        },
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

/** 从启动参数中提取文件路径 */
function getFilesFromArgs(argv) {
    const files = [];
    const args = argv.slice(1); // 去掉第一个参数（通常是应用路径）

    args.forEach((arg) => {
        if (arg !== "." && !arg.startsWith("-") && !arg.includes("electron") && !arg.includes(app.getAppPath())) {
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
