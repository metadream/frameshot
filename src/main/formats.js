// Sharp 支持的所有图片格式
// mime:null 表示浏览器不支持该格式
export const IMAGE_FORMATS = [
    {
        extension: ".jpg",
        mime: "image/jpeg",
    },
    {
        extension: ".jpeg",
        mime: "image/jpeg",
    },
    {
        extension: ".png",
        mime: "image/png",
    },
    {
        extension: ".webp",
        mime: "image/webp",
    },
    {
        extension: ".gif",
        mime: "image/gif",
    },
    {
        extension: ".avif",
        mime: "image/avif",
    },
    {
        extension: ".bmp",
        mime: "image/bmp",
    },
    {
        extension: ".svg",
        mime: "image/svg+xml",
    },
    {
        extension: ".heic",
        mime: null,
    },
    {
        extension: ".heif",
        mime: null,
    },
    {
        extension: ".tiff",
        mime: null,
    },
    {
        extension: ".raw",
        mime: null,
    },
];

export const IMAGE_EXTS = IMAGE_FORMATS.map((v) => v.extension.replace(/^\./, ""));
export const IMAGE_EXT_REGEX = new RegExp(`\\.(${IMAGE_EXTS.join("|")})$`, "i");
export const UNSUPPORTED_EXT_REGEX = new RegExp(
    `\\.(${IMAGE_FORMATS.filter((v) => !v.mime).map((v) => v.extension.replace(/^\./, "")).join("|")})$`,
    "i",
);
export const PROTOCOL = "frameshot";
