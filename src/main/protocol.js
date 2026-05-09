// 协议名称
export const PROTOCOL = "frameshot";

// sharp 支持的所有图片格式
// prettier-ignore
export const SUPPORTED_FORMATS = [
    { extension: ".jpg", mime: "image/jpeg" },
    { extension: ".jpeg", mime: "image/jpeg" },
    { extension: ".png", mime: "image/png" },
    { extension: ".webp", mime: "image/webp" },
    { extension: ".gif", mime: "image/gif" },
    { extension: ".avif", mime: "image/avif" },
    { extension: ".bmp", mime: "image/bmp" },
    { extension: ".svg", mime: "image/svg+xml" },
    { extension: ".heic", mime: null },
    { extension: ".heif", mime: null },
    { extension: ".tiff", mime: null },
    { extension: ".raw", mime: null },
];

// 支持的图片扩展名数组（不包含 . 前缀）
export const SUPPORTED_EXTS = SUPPORTED_FORMATS.map((v) => v.extension.replace(/^\./, ""));

// 支持的图片扩展名正则表达式
export const SUPPORTED_REGX = new RegExp(`\\.(${SUPPORTED_EXTS.join("|")})$`, "i");

// 浏览器不支持的图片扩展名正则表达式（mime 值为 null 的扩展名）
export const BROWSER_UNSUPPORTED_REGX = new RegExp(
    `\\.(${SUPPORTED_FORMATS.filter((v) => !v.mime)
        .map((v) => v.extension.replace(/^\./, ""))
        .join("|")})$`,
    "i",
);

/** 判断路径是否为支持的图片扩展名 */
export function isSupportedExt(path) {
    return SUPPORTED_REGX.test(path);
}

/** 根据后缀名获取图片格式元数据 */
export function getSupportedFormat(ext) {
    return SUPPORTED_FORMATS.find((v) => v.extension === ext.toLowerCase());
}

/** 将协议 URL 转换为文件系统路径 */
export function toFileSystemPath(url) {
    let filePath = decodeURIComponent(url.slice(`${PROTOCOL}://`.length));

    // 确保 Windows 盘符格式正确
    if (process.platform === "win32") {
        filePath = filePath.replace(/^\//, "").replace(/^([A-Za-z])\//, "$1:/");
    } else if (!filePath.startsWith("/")) {
        // 浏览器会将 frameshot:///path 标准化为 frameshot://path（去掉空 authority），补回前导 /
        filePath = "/" + filePath;
    }
    return filePath;
}

/** 将文件系统路径转换为协议 URL */
export function toProtocolUrl(path) {
    path = path.replace(/\\/g, "/");
    path = path.startsWith("/") ? path : "/" + path;
    const protocol = BROWSER_UNSUPPORTED_REGX.test(path) ? PROTOCOL : "file";
    return `${protocol}://${path}`;
}
