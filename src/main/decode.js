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
