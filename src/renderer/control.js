import { ImageViewer } from "./viewer.js";
import { ImageCropper } from "./cropper.js";

// 界面元素
const welcome = document.querySelector("#welcome");
const imageElement = document.querySelector("main>img");
const fileCount = document.querySelector("#file-count");
const fileName = document.querySelector("#file-name");
const fileSize = document.querySelector("#file-size");
const dimensions = document.querySelector("#dimensions");

// 全局变量
let imageIndex = 0;
let imageItems = null;
let imageMeta = null;
let sortMode = ["name", "asc"];

// 图片预览组件
const imageViewer = new ImageViewer("#image-viewer");
imageElement.addEventListener("load", function () {
    welcome.remove();
    document.querySelector("#refresh-btn").disabled = false;
    document.querySelector("#sort-btn").disabled = false;
    document.querySelector("#convert-btn").disabled = false;
    document.querySelector("#crop-btn").disabled = false;
    dimensions.innerHTML = `${this.naturalWidth} × ${this.naturalHeight}`;
});

// 菜单初始化
initMenus();
bindSortEvents();
bindConvertEvents();
bindCropEvents();

// 按钮事件：模拟Mac交通灯
document.querySelector("#close-btn").onclick = () => electron.closeWindow();
document.querySelector("#minimize-btn").onclick = () => electron.minimizeWindow();
document.querySelector("#maximize-btn").onclick = () => electron.toggleWindow();
document.querySelector("#open-btn").onclick = openFile;
document.querySelector("#welcome-open-btn").onclick = openFile;

// 按钮事件：刷新图片列表
document.querySelector("#refresh-btn").onclick = async () => {
    await loadImageItems(imageMeta.path);
    toast("Refresh successful");
};

// 全局按键绑定
document.addEventListener("keydown", async (e) => {
    e.preventDefault();
    switch (e.key) {
        // 上下方向键切换原图
        case "ArrowUp":
        case "ArrowDown":
            imageViewer.toggleImage();
            break;

        // 左右方向键切换到上一张/下一张
        case "ArrowLeft":
            slideImage(-1);
            break;
        case "ArrowRight":
            slideImage(+1);
            break;

        // 删除键删除图片
        // Windows/Linux: Delete; MacOS: Backspace
        case "Backspace":
        case "Delete":
            if (e.key === "Backspace" && electron.platform !== "darwin") return;

            const choice = await electron.openConfirmDialog();
            if (choice) {
                const success = await electron.trashFile(imageMeta.path);
                if (success) {
                    // 删除成功后滑动到下一张
                    imageItems.splice(imageIndex, 1);
                    slideImage(0);
                } else {
                    electron.showErrorBox("Delete failed: " + imageMeta.path);
                }
            }
    }
});

/** 打开图片 */
export function openImage(imagePath) {
    imageElement.src = imagePath;
    loadImageItems(imagePath);
}

/** 打开本地图片 */
async function openFile() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        openImage(filePaths[0]);
    }
}

/** 拖入文件打开 */
document.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "link";
});
document.addEventListener("dragenter", (e) => {
    e.preventDefault();
    document.body.classList.add("drag-over");
});
document.addEventListener("dragleave", (e) => {
    document.body.classList.remove("drag-over");
});
document.addEventListener("drop", (e) => {
    e.preventDefault();
    document.body.classList.remove("drag-over");

    const filePath = electron.getFilePath(e.dataTransfer.files[0]);
    if (/\.(jpg|jpeg|png|gif|bmp|webp|svg|heic|avif|tiff|raw)$/i.test(filePath)) {
        openImage(filePath);
    } else {
        toast("Unsupported file type");
    }
});

/** 加载同级图片 */
async function loadImageItems(file) {
    imageItems = await electron.getSiblingImages(file);
    sortImageItems(); // 排序

    imageIndex = imageItems.findIndex((f) => f.path === file);
    imageMeta = imageItems[imageIndex];
    updateTitleBar(); // 更新标题栏信息
}

/** 切换前后图片 */
function slideImage(direction) {
    imageIndex += direction;
    if (imageIndex > imageItems.length - 1) {
        imageIndex = 0;
    } else if (imageIndex < 0) {
        imageIndex = imageItems.length - 1;
    }
    imageMeta = imageItems[imageIndex];
    imageElement.src = imageMeta.path;
    updateTitleBar();

    if (direction > 0 && imageIndex === imageItems.length - 1) {
        toast("Last Image");
    } else if (direction < 0 && imageIndex === 0) {
        toast("First Image");
    }
}

/** 更新标题栏信息 */
function updateTitleBar() {
    fileCount.innerText = `${imageIndex + 1}/${imageItems.length}`;
    fileName.innerText = imageMeta.name;
    fileSize.innerText = formatBytes(imageMeta.size);
}

/** 图片排序 */
function sortImageItems() {
    const field = sortMode[0];
    const order = sortMode[1];

    imageItems.sort((a, b) => {
        let av = a[field];
        let bv = b[field];
        let result = 0;
        if (!av && !bv) return result;

        if (!av) result = 1;
        else if (!bv) result = -1;
        else {
            switch (field) {
                case "mtime":
                case "size":
                case "resolution":
                    result = Number(av) - Number(bv);
                    break;
                case "format":
                    av = String(av).toLowerCase();
                    bv = String(bv).toLowerCase();
                    result = av.localeCompare(bv);
                    break;
                case "name":
                    av = String(av);
                    bv = String(bv);
                    const isChinese = (str) => /^[\u4e00-\u9fa5]/.test(str);
                    const aIsChinese = isChinese(av);
                    const bIsChinese = isChinese(bv);

                    if (!aIsChinese && bIsChinese) {
                        result = -1; // 英文在前
                    } else if (aIsChinese && !bIsChinese) {
                        result = 1; // 中文在后
                    } else {
                        result = av.localeCompare(bv, "zh");
                    }
                    break;
            }
        }
        return order === "asc" ? result : -result;
    });
}

/** 显示和隐藏菜单 */
function initMenus() {
    const menus = document.querySelectorAll("menu");
    for (const menu of menus) {
        const btn = menu.querySelector("button");
        const items = menu.querySelector(".menu-items");
        btn.onpointerenter = items.onpointerenter = () => {
            if (!btn.disabled) {
                clearTimeout(btn.hideTimer);
                items.classList.add("show");
            }
        };
        btn.onpointerleave = items.onpointerleave = () => {
            btn.hideTimer = setTimeout(() => items.classList.remove("show"), 200);
        };
    }
}

/** 绑定排序菜单事件 */
function bindSortEvents() {
    const menuItems = document.querySelectorAll("#sort-items>span");
    menuItems.forEach((item) => {
        const field = item.dataset.field;
        const icon = item.querySelector("i");

        // 设置启动后的排序选项
        if (field === sortMode[0]) {
            icon.className = sortMode[1];
        }
        // 切换排序方式
        item.onclick = () => {
            const sort = !icon.className || icon.className === "desc" ? "asc" : "desc";
            sortMode = [field, sort];

            menuItems.forEach((v) => v.querySelector("i").removeAttribute("class"));
            icon.className = sort;
            sortImageItems();
        };
    });
}

/** 绑定格式转换菜单事件 */
function bindConvertEvents() {
    const menuItems = document.querySelectorAll("#convert-items>span");
    menuItems.forEach((item) => {
        item.onclick = async () => {
            const format = item.dataset.format;
            const outputFile = await electron.convertImage(imageMeta.path, format);
            toast(`Converted: ${outputFile}`);
        };
    });
}

/** 绑定裁剪菜单事件 */
function bindCropEvents() {
    const menuItems = document.querySelectorAll("#crop-items>span");
    let cropper = null;

    menuItems.forEach((item) => {
        item.onclick = () => {
            // 点击已激活的裁剪菜单时销毁
            if (cropper) {
                cropper.destroy();
                cropper = null;
                return;
            }

            const ratio = item.dataset.ratio;
            const [w, h] = ratio.split(":").map(Number);
            const container = document.querySelector("main");

            // 创建裁剪工具
            cropper = new ImageCropper({
                image: imageElement,
                container,
                ratio: w / h,
                ratioWidth: w,
                ratioHeight: h,
            });

            // 绑定快捷键：Enter保存，Esc取消
            const keyHandler = async (e) => {
                if (e.key === "Enter") {
                    const cropRect = cropper.getCropRect();
                    const outputFile = await electron.cropImage(imageMeta.path, cropRect);
                    toast(`Cropped: ${outputFile}`);
                    cropper.destroy();
                    cropper = null;
                    document.removeEventListener("keydown", keyHandler);
                } else if (e.key === "Escape") {
                    cropper.destroy();
                    cropper = null;
                    document.removeEventListener("keydown", keyHandler);
                }
            };
            document.addEventListener("keydown", keyHandler);
        };
    });
}

/** 文件字节格式化 */
function formatBytes(bytes) {
    if (!bytes || bytes < 1) return "0";
    const unit = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB"];
    const base = Math.min(unit.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const scale = Math.max(0, base);
    return parseFloat((bytes / Math.pow(1024, base)).toFixed(scale)) + " " + unit[base];
}

/** 提示信息 */
function toast(message) {
    const $toast = document.createElement("div");
    $toast.className = "toast";
    $toast.innerText = message;
    document.body.append($toast);

    $toast.classList.add("bounce-in");
    setTimeout(() => {
        $toast.classList.add("bounce-out");
        $toast.onanimationend = () => $toast.remove();
    }, 3000);
}
