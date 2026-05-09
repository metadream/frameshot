import { ImageViewer } from "./viewer.js";
import { ImageCropper } from "./cropper.js";
import { sortImageItems, formatBytes, toast } from "./utils.js";
import { isSupportedExt, toProtocolUrl } from "../main/protocol.js";

// 界面元素
const welcome = document.querySelector("#welcome");
const loading = document.querySelector("#loading");
const imageElement = document.querySelector("main>img");
const fileCount = document.querySelector("#file-count");
const fileName = document.querySelector("#file-name");
const fileSize = document.querySelector("#file-size");
const dimensions = document.querySelector("#dimensions");

// 图片预览组件
const imageViewer = new ImageViewer("#image-viewer");

// 全局变量
let imageItems = null; // 图片列表
let imageMeta = null; // 当前图片元数据
let imageIndex = 0; // 当前图片索引
let sortMode = ["name", "asc"]; // 排序模式
let cropper = null; // 裁剪工具
let activeRatio = null; // 当前裁剪比例

// 菜单初始化
initMenus();
bindSortEvents();
bindConvertEvents();
bindCropEvents();

// 图片加载事件
imageElement.addEventListener("load", function () {
    loading.classList.remove("show");
    document.querySelector("#refresh-btn").disabled = false;
    document.querySelector("#sort-btn").disabled = false;
    document.querySelector("#convert-btn").disabled = false;
    document.querySelector("#crop-btn").disabled = false;
    dimensions.innerHTML = `${this.naturalWidth} × ${this.naturalHeight}`;
});
imageElement.addEventListener("error", function () {
    loading.classList.remove("show");
    this.removeAttribute("src");
    toast("Failed to load image");
});

// 按钮事件：模拟Mac交通灯
document.querySelector("#close-btn").onclick = () => electron.closeWindow();
document.querySelector("#minimize-btn").onclick = () => electron.minimizeWindow();
document.querySelector("#maximize-btn").onclick = () => electron.toggleWindow();
document.querySelector("#open-btn").onclick = openFile;
document.querySelector("#welcome-open-btn").onclick = openFile;

// 按钮事件：刷新图片列表
document.querySelector("#refresh-btn").onclick = async () => {
    await loadImages(imageMeta.path);
    toast("Refresh successful");
};

// 拖入文件打开
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
    if (isSupportedExt(filePath)) {
        openImage(filePath);
    } else {
        toast("Unsupported file type");
    }
});

// 全局按键绑定
document.addEventListener("keydown", async (e) => {
    switch (e.key) {
        // 回车键切换原图
        case "Enter":
            e.preventDefault();
            imageViewer.toggleImage();
            break;

        // 上下方向键缩放
        case "ArrowUp":
            e.preventDefault();
            imageViewer.zoom(1);
            break;
        case "ArrowDown":
            e.preventDefault();
            imageViewer.zoom(-1);
            break;

        // 左右方向键切换到上一张/下一张
        case "ArrowLeft":
            e.preventDefault();
            slideImage(-1);
            break;
        case "ArrowRight":
            e.preventDefault();
            slideImage(+1);
            break;

        // 删除键删除图片
        // Windows/Linux: Delete; MacOS: Backspace
        case "Backspace":
        case "Delete":
            if (e.key === "Backspace" && electron.platform !== "darwin") return;

            e.preventDefault();
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
export function openImage(filePath) {
    welcome.remove();
    setImageSource(filePath);
    loadImages(filePath);
}

/** 打开本地图片 */
async function openFile() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        openImage(filePaths[0]);
    }
}

/** 加载同级图片 */
async function loadImages(file) {
    imageItems = await electron.getSiblingImages(file);
    activateImage(file);
}

/** 激活当前图片 */
function activateImage(file) {
    sortImageItems(imageItems, sortMode);
    imageIndex = imageItems.findIndex((f) => f.path === file);
    imageMeta = imageItems[imageIndex];
    updateTitleBar();
}

/** 根据图片格式设置协议与图片源 */
function setImageSource(filePath) {
    imageElement.src = toProtocolUrl(filePath);
    loading.classList.add("show");
}

/** 切换前后图片 */
function slideImage(direction) {
    if (imageItems === null || !imageItems.length) {
        return;
    }

    cleanupCrop();
    imageIndex += direction;
    if (imageIndex > imageItems.length - 1) {
        imageIndex = 0;
    } else if (imageIndex < 0) {
        imageIndex = imageItems.length - 1;
    }

    imageMeta = imageItems[imageIndex];
    setImageSource(imageMeta.path);
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
            activateImage(imageMeta.path);
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
    menuItems.forEach((item) => {
        item.onclick = () => {
            let [w, h] = item.dataset.ratio.split(":").map(Number);
            const isToggled = cropper && activeRatio && activeRatio.w === w && activeRatio.h === h;
            cleanupCrop();
            menuItems.forEach((el) => (el.textContent = el.dataset.ratio));

            if (isToggled) {
                [w, h] = [h, w];
                item.textContent = `${w}:${h}`;
            }
            activeRatio = { w, h };

            // 创建裁剪工具
            cropper = new ImageCropper({
                image: imageElement,
                container: document.querySelector("main"),
                ratioWidth: w,
                ratioHeight: h,
                onSave: async () => {
                    const cropRect = cropper.getCropRect();
                    const outputFile = await electron.cropImage(imageMeta.path, cropRect);
                    toast(`Cropped: ${outputFile}`);
                    cleanupCrop();
                },
            });

            document.addEventListener("keydown", cropEscHandler);
        };
    });
}

// 裁剪取消事件
function cropEscHandler(e) {
    if (e.key === "Escape") cleanupCrop();
}

// 清理裁剪状态
function cleanupCrop() {
    document.removeEventListener("keydown", cropEscHandler);
    activeRatio = null;
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
}
