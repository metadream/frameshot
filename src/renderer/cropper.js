export class ImageCropper {
    constructor({ image, container, ratio = 1 }) {
        this.image = image;
        this.container = container;
        this.ratio = ratio;
        this.cropBox = null;
        this.layer = null;
        this.isDragging = false;
        this.isResizing = false;
        this.startPos = { x: 0, y: 0 };
        this.startRect = { left: 0, top: 0, width: 0, height: 0 };
        this.resizeDir = null;

        this.init();
    }

    init() {
        // 创建裁剪层
        this.layer = document.createElement("div");
        this.layer.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            z-index: 999;
        `;

        // 创建裁剪框
        this.cropBox = document.createElement("div");
        this.cropBox.style.cssText = `
            position: absolute; border: 2px solid #fff; box-sizing: border-box;
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
        `;

        // 添加四个角的手柄
        ["nw", "ne", "sw", "se"].forEach((dir) => {
            const handle = document.createElement("div");
            handle.className = `crop-handle ${dir}`;
            handle.style.cssText = `
                position: absolute; width: 12px; height: 12px; background: #fff;
                border-radius: 50%; border: 2px solid #333;
                cursor: ${dir}-resize;
            `;
            // 定位手柄
            if (dir.includes("n")) handle.style.top = "-6px";
            if (dir.includes("s")) handle.style.bottom = "-6px";
            if (dir.includes("w")) handle.style.left = "-6px";
            if (dir.includes("e")) handle.style.right = "-6px";

            handle.onmousedown = (e) => this.startResize(e, dir);
            this.cropBox.appendChild(handle);
        });

        this.layer.appendChild(this.cropBox);
        this.container.appendChild(this.layer);

        // 初始化裁剪框位置和大小
        this.initCropBox();

        // 绑定事件
        this.cropBox.onmousedown = (e) => this.startDrag(e);
        document.onmousemove = (e) => this.onMouseMove(e);
        document.onmouseup = () => this.onMouseUp();

        this.layer.onmousemove = (e) => {
            const cropRect = this.cropBox.getBoundingClientRect();
            const isInsideCropBox =
                e.clientX >= cropRect.left &&
                e.clientX <= cropRect.right &&
                e.clientY >= cropRect.top &&
                e.clientY <= cropRect.bottom;

            if (isInsideCropBox) {
                if (e.target.classList?.contains("crop-handle")) {
                    this.layer.style.cursor = "";
                } else {
                    this.layer.style.cursor = "move";
                }
            } else {
                this.layer.style.cursor = "default";
            }
        };
    }

    initCropBox() {
        const imgRect = this.image.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;

        // 初始大小：图片的80%，保持比例
        let width = imgWidth * 0.8;
        let height = width / this.ratio;
        if (height > imgHeight) {
            height = imgHeight * 0.8;
            width = height * this.ratio;
        }

        // 居中
        const left = imgLeft + (imgWidth - width) / 2;
        const top = imgTop + (imgHeight - height) / 2;

        Object.assign(this.cropBox.style, {
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
        });
    }

    startDrag(e) {
        if (e.target !== this.cropBox) return;
        this.isDragging = true;
        this.startPos = { x: e.clientX, y: e.clientY };
        this.startRect = {
            left: parseFloat(this.cropBox.style.left),
            top: parseFloat(this.cropBox.style.top),
        };
        e.preventDefault();
    }

    startResize(e, dir) {
        this.isResizing = true;
        this.resizeDir = dir;
        this.startPos = { x: e.clientX, y: e.clientY };
        this.startRect = {
            left: parseFloat(this.cropBox.style.left),
            top: parseFloat(this.cropBox.style.top),
            width: parseFloat(this.cropBox.style.width),
            height: parseFloat(this.cropBox.style.height),
        };
        e.preventDefault();
        e.stopPropagation();
    }

    onMouseMove(e) {
        if (this.isDragging) this.handleDrag(e);
        if (this.isResizing) this.handleResize(e);
    }

    handleDrag(e) {
        const dx = e.clientX - this.startPos.x;
        const dy = e.clientY - this.startPos.y;

        let left = this.startRect.left + dx;
        let top = this.startRect.top + dy;

        // 限制边界
        const imgRect = this.image.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;
        const cropWidth = parseFloat(this.cropBox.style.width);
        const cropHeight = parseFloat(this.cropBox.style.height);

        left = Math.max(imgLeft, Math.min(left, imgLeft + imgWidth - cropWidth));
        top = Math.max(imgTop, Math.min(top, imgTop + imgHeight - cropHeight));

        this.cropBox.style.left = `${left}px`;
        this.cropBox.style.top = `${top}px`;
    }
    handleResize(e) {
        const dx = e.clientX - this.startPos.x;

        let { left, top, width, height } = this.startRect;
        const ratio = this.ratio;

        // 计算锚点位置（固定点）
        let anchorX, anchorY;
        switch (this.resizeDir) {
            case "se":
                anchorX = left;
                anchorY = top;
                break;
            case "sw":
                anchorX = left + width;
                anchorY = top;
                break;
            case "ne":
                anchorX = left;
                anchorY = top + height;
                break;
            case "nw":
                anchorX = left + width;
                anchorY = top + height;
                break;
        }

        // 根据鼠标移动计算新宽度
        let newWidth = this.resizeDir === "se" || this.resizeDir === "ne" ? width + dx : width - dx;
        let newHeight = newWidth / ratio;

        // 限制边界：计算最大允许尺寸
        const imgRect = this.image.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;

        let maxWidth, maxHeight;
        switch (this.resizeDir) {
            case "se":
                maxWidth = imgLeft + imgWidth - anchorX;
                maxHeight = imgTop + imgHeight - anchorY;
                break;
            case "sw":
                maxWidth = anchorX - imgLeft;
                maxHeight = imgTop + imgHeight - anchorY;
                break;
            case "ne":
                maxWidth = imgLeft + imgWidth - anchorX;
                maxHeight = anchorY - imgTop;
                break;
            case "nw":
                maxWidth = anchorX - imgLeft;
                maxHeight = anchorY - imgTop;
                break;
        }

        if (newWidth > maxWidth || newHeight > maxHeight) {
            if (maxWidth / ratio <= maxHeight) {
                newWidth = maxWidth;
                newHeight = newWidth / ratio;
            } else {
                newHeight = maxHeight;
                newWidth = newHeight * ratio;
            }
        }

        // 限制最小尺寸，并重新计算位置
        const minWidth = 20;
        const minHeight = minWidth / ratio;

        let finalWidth = newWidth;
        let finalHeight = newHeight;

        if (newWidth < minWidth || newHeight < minHeight) {
            if (newWidth < minWidth) {
                finalWidth = minWidth;
                finalHeight = finalWidth / ratio;
            } else {
                finalHeight = minHeight;
                finalWidth = finalHeight * ratio;
            }
        }

        // 根据锚点和最终尺寸计算位置
        let newLeft, newTop;
        switch (this.resizeDir) {
            case "se":
                newLeft = anchorX;
                newTop = anchorY;
                break;
            case "sw":
                newLeft = anchorX - finalWidth;
                newTop = anchorY;
                break;
            case "ne":
                newLeft = anchorX;
                newTop = anchorY - finalHeight;
                break;
            case "nw":
                newLeft = anchorX - finalWidth;
                newTop = anchorY - finalHeight;
                break;
        }

        // 再次检查边界（因为最小尺寸限制后可能超出边界）
        if (newLeft < imgLeft) {
            newLeft = imgLeft;
        }
        if (newTop < imgTop) {
            newTop = imgTop;
        }
        if (newLeft + finalWidth > imgLeft + imgWidth) {
            finalWidth = imgLeft + imgWidth - newLeft;
            finalHeight = finalWidth / ratio;
        }
        if (newTop + finalHeight > imgTop + imgHeight) {
            finalHeight = imgTop + imgHeight - newTop;
            finalWidth = finalHeight * ratio;
        }

        Object.assign(this.cropBox.style, {
            left: `${newLeft}px`,
            top: `${newTop}px`,
            width: `${finalWidth}px`,
            height: `${finalHeight}px`,
        });
    }

    onMouseUp() {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeDir = null;
    }

    /** 获取原图裁剪区域 */
    getCropRect() {
        const imgRect = this.image.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgDisplayWidth = imgRect.width;
        const imgDisplayHeight = imgRect.height;

        const cropLeft = parseFloat(this.cropBox.style.left);
        const cropTop = parseFloat(this.cropBox.style.top);
        const cropWidth = parseFloat(this.cropBox.style.width);
        const cropHeight = parseFloat(this.cropBox.style.height);

        // 转换为原图坐标
        const scaleX = this.image.naturalWidth / imgDisplayWidth;
        const scaleY = this.image.naturalHeight / imgDisplayHeight;

        return {
            x: Math.round((cropLeft - imgLeft) * scaleX),
            y: Math.round((cropTop - imgTop) * scaleY),
            width: Math.round(cropWidth * scaleX),
            height: Math.round(cropHeight * scaleY),
        };
    }

    /** 保存裁剪图片 */
    async save() {
        const rect = this.getCropRect();
        const canvas = document.createElement("canvas");
        canvas.width = rect.width;
        canvas.height = rect.height;
        const ctx = canvas.getContext("2d");

        const img = new Image();
        img.src = this.image.src;
        await new Promise((resolve) => (img.onload = resolve));

        ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
        return canvas.toBlob((blob) => blob, "image/png");
    }

    /** 销毁 */
    destroy() {
        this.layer?.remove();
        document.onmousemove = null;
        document.onmouseup = null;
    }
}
