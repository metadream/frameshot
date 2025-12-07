export function $(selector) {
    selector = selector.replace("/\n/mg", "").trim();
    if (selector.startsWith("<")) {
        return document.createRange().createContextualFragment(selector).firstChild;
    }
    return document.querySelector(selector);
}

export function nextFrame(callback) {
    requestAnimationFrame(() => requestAnimationFrame(callback));
}

export function formatBytes(bytes) {
    if (!bytes || bytes < 1) return "0";
    const unit = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB"];
    const base = Math.min(unit.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    const scale = Math.max(0, base);
    return parseFloat((bytes / Math.pow(1024, base)).toFixed(scale)) + " " + unit[base];
}