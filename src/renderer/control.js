import { ImageViewer } from "./viewer.js";

// 界面元素
const imageElement = document.querySelector("main>img");
const convertBtn = document.querySelector("#convert-btn");
const sortBtn = document.querySelector("#sort-btn");
const sortMenu = document.querySelector(".sort-menu");
const fileInfo = document.querySelector(".file-info");
const imageInfo = document.querySelector(".image-info");

// 全局变量
let imageIndex = 0;
let imageItems = null;
let imageMeta = null;
let sortMode = ["name", "asc"];

// 图片预览组件
const imageViewer = new ImageViewer("main");
imageViewer.onImageLoaded = () => {
    convertBtn.disabled = false;
};

// 按钮事件：模拟Mac交通灯
document.querySelector("#close-btn").onclick = () => electron.closeWindow();
document.querySelector("#minimize-btn").onclick = () => electron.minimizeWindow();
document.querySelector("#maximize-btn").onclick = () => electron.toggleWindow();

// 按钮事件：打开本地图片
document.querySelector("#open-btn").onclick = async () => {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        openImage(filePaths[0]);
    }
};

/** 按钮事件：转换图片格式 */
convertBtn.onclick = async (e) => {
    const outputFile = await electron.convertImage(imageMeta.path, "jpg");
    toast(`图片已保存: ${outputFile}`);
};

// 鼠标事件：显示和隐藏排序菜单
sortBtn.onpointerenter = sortMenu.onpointerenter = () => {
    clearTimeout(sortBtn.hideTimer);
    sortMenu.classList.add("show");
};
sortBtn.onpointerleave = sortMenu.onpointerleave = () => {
    sortBtn.hideTimer = setTimeout(() => sortMenu.classList.remove("show"), 200);
};
bindSortEvents();

// 全局按键绑定
document.addEventListener("keydown", async (e) => {
    e.preventDefault();
    switch (e.key) {
        // 回车键切换原图
        case "Enter":
            imageViewer.toggleImage();
            break;

        // 取消键关闭窗口
        case "Escape":
            electron.closeWindow();
            break;

        // 左、上方向键切换到上一张
        case "ArrowUp":
        case "ArrowLeft":
            slideImage(-1);
            break;

        // 右、下方向键切换到下一张
        case "ArrowDown":
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
                    electron.showErrorBox("Delete image failed: " + imageMeta.path);
                }
            }
    }
});

/** 打开图片 */
export function openImage(imagePath) {
    imageElement.src = imagePath;
    loadImageItems(imagePath);
}

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
    const { name, size, width, height } = imageMeta;
    fileInfo.innerHTML = `${imageIndex + 1}/${imageItems.length}　|　${name}`;
    imageInfo.innerHTML = `${width} × ${height}　|　${formatBytes(size)}`;
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

/** 绑定排序菜单事件 */
function bindSortEvents() {
    const sortItems = sortMenu.querySelectorAll("span");
    sortItems.forEach((item) => {
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

            sortItems.forEach((v) => v.querySelector("i").removeAttribute("class"));
            icon.className = sort;
            sortImageItems();
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
