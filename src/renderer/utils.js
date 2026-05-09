/** 图片排序 */
export function sortImageItems(imageItems, sortMode) {
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

/** 文件字节格式化 */
export function formatBytes(bytes) {
    if (!bytes || bytes < 1) return "0";
    const unit = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB"];
    const base = Math.min(unit.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const scale = Math.max(0, base);
    return parseFloat((bytes / Math.pow(1024, base)).toFixed(scale)) + " " + unit[base];
}

/** 提示信息 */
export function toast(message) {
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
