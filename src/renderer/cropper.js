export class ImageCropper {
    constructor({ image, container, ratio = 1, ratioWidth, ratioHeight, onSave }) {
        this.image = image;
        this.container = container;
        this.ratio = ratio;
        this.ratioWidth = ratioWidth;
        this.ratioHeight = ratioHeight;
        this.onSave = onSave;
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
            z-index: 998;`;

        // 创建裁剪框
        this.cropBox = document.createElement("div");
        this.cropBox.style.cssText = `
            position: absolute; border: 2px solid #fff; box-sizing: border-box;
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);`;

        // 添加四个角的手柄
        ["nw", "ne", "sw", "se"].forEach((dir) => {
            const handle = document.createElement("div");
            handle.className = `crop-handle ${dir}`;
            handle.style.cssText = `
                position: absolute; width: 12px; height: 12px; background: #fff;
                border-radius: 50%; border: 2px solid #333;
                cursor: ${dir}-resize;`;
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

        // 保存按钮（固定在裁剪框左上角）
        if (this.onSave) {
            const btn = document.createElement("button");
            btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`;
            btn.style.cssText = `
                position: absolute; top: 4px; left: 4px; z-index: 999;
                width: 24px; height: 24px; padding: 0;
                background: rgba(0,0,0,0.35); color: #fff;
                border: 0; border-radius: 4px;
                cursor: pointer; display: flex; align-items: center; justify-content: center;
                opacity: 0.65; transition: opacity 0.15s;`;
            btn.onmouseenter = () => {
                btn.style.opacity = "1";
            };
            btn.onmouseleave = () => {
                btn.style.opacity = "0.7";
            };
            btn.onclick = this.onSave;
            this.cropBox.appendChild(btn);
        }

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
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;

        // 计算图片在可视区内的可见区域
        const visibleLeft = Math.max(0, imgLeft);
        const visibleTop = Math.max(0, imgTop);
        const visibleRight = Math.min(containerWidth, imgLeft + imgWidth);
        const visibleBottom = Math.min(containerHeight, imgTop + imgHeight);

        const visibleWidth = visibleRight - visibleLeft;
        const visibleHeight = visibleBottom - visibleTop;

        // 如果图片完全不可见，使用可视区大小
        if (visibleWidth <= 0 || visibleHeight <= 0) {
            return;
        }

        // 自适应充满：保持比例，在可见区域内最大化裁剪框
        // 横向图片以宽度为基准（宽度填满），纵向图片以高度为基准（高度填满）
        let width = visibleWidth;
        let height = width / this.ratio;
        if (height > visibleHeight) {
            height = visibleHeight;
            width = height * this.ratio;
        }

        // 居中于可见区域
        const left = visibleLeft + (visibleWidth - width) / 2;
        const top = visibleTop + (visibleHeight - height) / 2;

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

        const imgRect = this.image.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();

        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;
        const cropWidth = parseFloat(this.cropBox.style.width);
        const cropHeight = parseFloat(this.cropBox.style.height);

        // 同时受图片边界和可视区边界约束（取交集，即更严格的那个）
        const minLeft = Math.max(imgLeft, 0);
        const maxLeft = Math.min(imgLeft + imgWidth - cropWidth, containerRect.width - cropWidth);
        const minTop = Math.max(imgTop, 0);
        const maxTop = Math.min(imgTop + imgHeight - cropHeight, containerRect.height - cropHeight);

        left = Math.max(minLeft, Math.min(left, maxLeft));
        top = Math.max(minTop, Math.min(top, maxTop));

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

        // 限制边界：计算最大允许尺寸（同时受图片和可视区约束）
        const imgRect = this.image.getBoundingClientRect();
        const containerRect = this.container.getBoundingClientRect();
        const imgLeft = imgRect.left - containerRect.left;
        const imgTop = imgRect.top - containerRect.top;
        const imgWidth = imgRect.width;
        const imgHeight = imgRect.height;

        let maxWidth, maxHeight;
        switch (this.resizeDir) {
            case "se":
                maxWidth = Math.min(imgLeft + imgWidth - anchorX, containerRect.width - anchorX);
                maxHeight = Math.min(imgTop + imgHeight - anchorY, containerRect.height - anchorY);
                break;
            case "sw":
                maxWidth = Math.min(anchorX - imgLeft, anchorX);
                maxHeight = Math.min(imgTop + imgHeight - anchorY, containerRect.height - anchorY);
                break;
            case "ne":
                maxWidth = Math.min(imgLeft + imgWidth - anchorX, containerRect.width - anchorX);
                maxHeight = Math.min(anchorY - imgTop, anchorY);
                break;
            case "nw":
                maxWidth = Math.min(anchorX - imgLeft, anchorX);
                maxHeight = Math.min(anchorY - imgTop, anchorY);
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

        // 限制最小尺寸，保证保存按钮不被挤出
        const MIN_INNER = 36;
        let minW = MIN_INNER,
            minH = minW / ratio;
        if (minH < MIN_INNER) {
            minH = MIN_INNER;
            minW = minH * ratio;
        }

        let finalWidth = newWidth;
        let finalHeight = newHeight;

        if (newWidth < minW || newHeight < minH) {
            if (newWidth < minW) {
                finalWidth = minW;
                finalHeight = finalWidth / ratio;
            } else {
                finalHeight = minH;
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
        const minLeft = Math.max(imgLeft, 0);
        const minTop = Math.max(imgTop, 0);
        if (newLeft < minLeft) newLeft = minLeft;
        if (newTop < minTop) newTop = minTop;

        // 统一约束：确保宽和高同时满足边界，避免顺序约束导致的累积误差
        const maxW = Math.min(imgLeft + imgWidth - newLeft, containerRect.width - newLeft);
        const maxH = Math.min(imgTop + imgHeight - newTop, containerRect.height - newTop);
        if (finalWidth > maxW || finalHeight > maxH) {
            if (maxW / ratio <= maxH) {
                finalWidth = maxW;
                finalHeight = finalWidth / ratio;
            } else {
                finalHeight = maxH;
                finalWidth = finalHeight * ratio;
            }
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

    /** 获取裁剪数据（包含原图路径和裁剪区域） */
    getCropData() {
        const rect = this.getCropRect();
        return {
            src: this.image.src,
            ...rect,
        };
    }

    /** 获取原图裁剪区域（精确保持比例，无±1px误差） */
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

        const scaleX = this.image.naturalWidth / imgDisplayWidth;
        const scaleY = this.image.naturalHeight / imgDisplayHeight;

        const rawWidth = cropWidth * scaleX;
        const rawHeight = cropHeight * scaleY;

        let finalWidth, finalHeight;

        if (this.ratioWidth && this.ratioHeight) {
            // 在保持精确比例的前提下，找到最接近原始值的整数宽高
            // 高度必须是 ratioHeight 的整数倍，以确保 width = height * ratioWidth / ratioHeight 为整数
            const baseH = Math.round(rawHeight / this.ratioHeight);
            let bestW = 0,
                bestH = 0,
                bestErr = Infinity;

            for (let d = -1; d <= 1; d++) {
                const h = (baseH + d) * this.ratioHeight;
                if (h <= 0) continue;
                const w = (h / this.ratioHeight) * this.ratioWidth;
                const err = Math.abs(w - rawWidth) + Math.abs(h - rawHeight);
                if (err < bestErr) {
                    bestErr = err;
                    bestW = w;
                    bestH = h;
                }
            }

            // 也尝试以宽度为基准
            const baseW = Math.round(rawWidth / this.ratioWidth);
            for (let d = -1; d <= 1; d++) {
                const w = (baseW + d) * this.ratioWidth;
                if (w <= 0) continue;
                const h = (w / this.ratioWidth) * this.ratioHeight;
                const err = Math.abs(w - rawWidth) + Math.abs(h - rawHeight);
                if (err < bestErr) {
                    bestErr = err;
                    bestW = w;
                    bestH = h;
                }
            }

            finalWidth = bestW;
            finalHeight = bestH;
        } else {
            finalWidth = Math.round(rawWidth);
            finalHeight = Math.round(rawHeight);
        }

        return {
            x: Math.round((cropLeft - imgLeft) * scaleX),
            y: Math.round((cropTop - imgTop) * scaleY),
            width: finalWidth,
            height: finalHeight,
        };
    }

    /** 销毁 */
    destroy() {
        this.layer?.remove();
        document.onmousemove = null;
        document.onmouseup = null;
    }
}
