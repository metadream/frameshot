import crypto from "crypto";
import fs from "fs";
import path from "path";
import heicConvert from "heic-convert";
import sharp from "sharp";

/** 判断是否为 HEIC/HEIF 扩展名（大小写不敏感） */
export function isHeifExt(ext) {
    return /^\.(heic|heif)$/i.test(ext);
}

/** 将 HEIC/HEIF buffer 解码为 JPEG buffer */
export function decodeHeifToJpeg(buffer) {
    return heicConvert({ buffer, format: "JPEG", quality: 0.96 });
}

/** 内存解码预览缓存上限（按字节与张数双重限制，防止占用过大内存） */
const HEIF_CACHE_MAX_BYTES = 64 * 1024 * 1024;
const HEIF_CACHE_MAX_ITEMS = 20;
const heifCache = new Map();
let heifCacheBytes = 0;

/** 磁盘缓存上限（重启应用后仍然生效的会话级缓存） */
const HEIF_DISK_MAX_BYTES = 512 * 1024 * 1024;
const HEIF_DISK_MAX_FILES = 200;

/** 计算缓存键：路径 + 修改时间 + 大小的 MD5 */
function cacheKey(filePath, stat) {
    return crypto.createHash("md5").update(`${filePath}|${stat.mtimeMs}|${stat.size}`).digest("hex");
}

/** 读取磁盘缓存预览，不存在时返回 null */
async function readDiskCache(dir, key) {
    try {
        return await fs.promises.readFile(path.join(dir, `${key}.jpg`));
    } catch {
        return null;
    }
}

/** 原子写入磁盘缓存并清理超额文件 */
async function writeDiskCache(dir, key, buffer) {
    try {
        await fs.promises.mkdir(dir, { recursive: true });
        const target = path.join(dir, `${key}.jpg`);
        const tmp = `${target}.tmp`;
        await fs.promises.writeFile(tmp, buffer);
        await fs.promises.rename(tmp, target);
        await pruneDiskCache(dir);
    } catch {
        // 缓存写入失败不影响主流程
    }
}

/** 按文件数与字节数上限淘汰最旧的磁盘缓存 */
async function pruneDiskCache(dir) {
    let entries;
    try {
        entries = await fs.promises.readdir(dir);
    } catch {
        return;
    }
    if (entries.length === 0) return;

    const stats = (
        await Promise.all(
            entries.map(async (name) => {
                try {
                    const s = await fs.promises.stat(path.join(dir, name));
                    return { name, mtime: s.mtimeMs, size: s.size };
                } catch {
                    return null;
                }
            }),
        )
    ).filter(Boolean);

    const bytes = stats.reduce((sum, f) => sum + f.size, 0);
    if (stats.length <= HEIF_DISK_MAX_FILES && bytes <= HEIF_DISK_MAX_BYTES) return;

    stats.sort((a, b) => a.mtime - b.mtime);
    let count = stats.length;
    let remaining = bytes;
    for (const f of stats) {
        if (count <= HEIF_DISK_MAX_FILES && remaining <= HEIF_DISK_MAX_BYTES) break;
        try {
            await fs.promises.unlink(path.join(dir, f.name));
            count--;
            remaining -= f.size;
        } catch {
            // 忽略单个文件删除失败
        }
    }
}

/** 内存 LRU 淘汰超限条目 */
function trimMemoryCache() {
    while (heifCache.size > HEIF_CACHE_MAX_ITEMS || heifCacheBytes > HEIF_CACHE_MAX_BYTES) {
        const oldestKey = heifCache.keys().next().value;
        const oldest = heifCache.get(oldestKey);
        if (!oldest.done) break;
        heifCache.delete(oldestKey);
        heifCacheBytes -= oldest.done.length;
    }
}

/**
 * 带内存 + 磁盘缓存与并发去重的 HEIC/HEIF 预览解码。
 * 键为路径 + 修改时间 + 大小的哈希，同一张图只解码一次；
 * 解码结果先落磁盘（跨会话生效）再常驻内存 LRU，两层均按上限淘汰。
 * @param {string} filePath
 * @param {string|null} cacheDir 磁盘缓存目录，传 null 仅使用内存缓存
 */
export async function decodeHeifToJpegCached(filePath, cacheDir = null) {
    const stat = fs.statSync(filePath);
    const key = cacheKey(filePath, stat);

    const hit = heifCache.get(key);
    if (hit) {
        heifCache.delete(key);
        heifCache.set(key, hit);
        return hit.done || hit.pending;
    }

    if (cacheDir) {
        const disk = await readDiskCache(cacheDir, key);
        if (disk) {
            heifCache.set(key, { done: disk });
            heifCacheBytes += disk.length;
            trimMemoryCache();
            return disk;
        }
    }

    const entry = {};
    heifCache.set(key, entry);
    entry.pending = decodeHeifToJpeg(await fs.promises.readFile(filePath)).then(
        (done) => {
            entry.done = done;
            heifCacheBytes += done.length;
            trimMemoryCache();
            if (cacheDir) writeDiskCache(cacheDir, key, done);
            return done;
        },
        (err) => {
            heifCache.delete(key);
            throw err;
        },
    );
    return entry.pending;
}

/**
 * 将图片源解码为 sharp 可处理的输入。
 * HEIC/HEIF 通过 heic-convert 解码为 PNG buffer；其余格式返回原文件路径。
 */
export async function decodeToSharpInput(filePath) {
    if (isHeifExt(path.extname(filePath))) {
        const buffer = await fs.promises.readFile(filePath);
        return heicConvert({ buffer, format: "PNG" });
    }
    return filePath;
}

/** 转换图片为指定格式（仅支持 jpg/png） */
export async function convertImage(inputFile, outFormat, outputFile) {
    const format = outFormat.toLowerCase();
    if (format !== "png" && format !== "jpg" && format !== "jpeg") {
        throw new Error("Unsupported output format");
    }

    const source = await decodeToSharpInput(inputFile);
    let pipeline = sharp(source);
    if (!isHeifExt(path.extname(inputFile))) {
        pipeline = pipeline.keepMetadata();
    }

    if (format === "png") {
        pipeline = pipeline.png();
    } else {
        pipeline = pipeline.jpeg({ quality: 96 });
    }
    await pipeline.toFile(outputFile);
    return outputFile;
}

/** 裁剪图片并保存 */
export async function cropImage(inputFile, cropRect, outputFile) {
    const { x, y, width, height } = cropRect;
    const isHeif = isHeifExt(path.extname(inputFile));
    const source = await decodeToSharpInput(inputFile);

    let pipeline = sharp(source).extract({ left: x, top: y, width, height });
    if (!isHeif) {
        pipeline = pipeline.keepMetadata();
    }

    if (isHeif) {
        pipeline = pipeline.jpeg({ quality: 96 });
    } else {
        const ext = path.extname(inputFile).toLowerCase();
        if (ext === ".jpg" || ext === ".jpeg") {
            pipeline = pipeline.jpeg({ quality: 96 });
        } else if (ext === ".webp") {
            pipeline = pipeline.webp({ quality: 96 });
        } else if (ext === ".png") {
            pipeline = pipeline.png();
        }
    }
    await pipeline.toFile(outputFile);
    return outputFile;
}
