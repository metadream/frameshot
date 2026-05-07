export class ImageViewer {
    transX = 0;
    transY = 0;
    scale = 1;

    constructor(container, options) {
        this.options = Object.assign({ maxScale: 20, scaleStep: 0.2 }, options);
        this.container = typeof container === "string" ? document.querySelector(container) : container;
        this.container.style.cssText = `
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            user-select: none;`;

        this.image = this.container.querySelector("img");
        this.image.style.cssText = `max-width: 100%; max-height: 100%; -webkit-user-drag: none;`;
        this.image.onwheel = (e) => this.scaleImage(e);
        this.image.onpointerdown = (e) => this.dragImages(e);
        this.image.onload = (e) => {
            // 原图可放大倍数
            this.origScale = this.image.naturalWidth / this.image.clientWidth;
            this.checkBoundary();
        };

        this.resetViewport();
        window.addEventListener("resize", () => {
            this.resetImage();
        });
    }

    /** 切换原图 */
    toggleImage() {
        this.scale = this.scale > 1 ? 1 : this.origScale;
        this.transformImage();
        this.checkBoundary();
    }

    /** 拖动图像 */
    dragImages(e) {
        if (e.button !== 0) return;
        this.image.style.cursor = "grab";
        this.isDragging = false;

        let startX = e.clientX;
        let startY = e.clientY;
        let offsetX = 0;
        let offsetY = 0;

        document.onpointermove = (e) => {
            this.image.style.cursor = "grabbing";
            this.isDragging = true;
            offsetX = e.clientX - startX;
            offsetY = e.clientY - startY;
            this.transformImage(this.transX + offsetX, this.transY + offsetY, null);
        };

        document.onpointerup = () => {
            document.onpointermove = null;
            document.onpointerup = null;
            this.transX += offsetX;
            this.transY += offsetY;

            if (this.isDragging) {
                this.checkBoundary();
            } else {
                // 点击切换原图
                const { width, height } = this.viewport;
                this.transX = width - this.centerX - e.clientX;
                this.transY = height - this.centerY - e.clientY;
                this.toggleImage();
            }
        };
        return false;
    }

    /** 缩放图像 */
    scaleImage(e) {
        // 防止页面滚动条跟随滚动
        e.preventDefault();

        // 缩放图像
        const { maxScale, scaleStep } = this.options;
        const step = e.wheelDelta > 0 ? scaleStep : 0 - scaleStep;
        this.scale *= 1 + step;
        this.scale = Math.max(1, Math.min(this.scale, maxScale));
        this.transformImage();
        this.checkBoundary();
    }

    /** 检查位移边界 */
    checkBoundary() {
        this.resetCursor();
        const { width, height } = this.image.getBoundingClientRect();
        const bound = { x1: 0, x2: 0, y1: 0, y2: 0 };

        if (width > this.viewport.width) {
            bound.x1 = width / 2 - this.centerX;
            bound.x2 = bound.x1 - (width - this.viewport.width);
        }
        if (height > this.viewport.height) {
            bound.y1 = height / 2 - this.centerY;
            bound.y2 = bound.y1 - (height - this.viewport.height);
        }

        let outOfBounds = false;
        if (this.transX > bound.x1) {
            this.transX = bound.x1;
            outOfBounds = true;
        }
        if (this.transX < bound.x2) {
            this.transX = bound.x2;
            outOfBounds = true;
        }
        if (this.transY > bound.y1) {
            this.transY = bound.y1;
            outOfBounds = true;
        }
        if (this.transY < bound.y2) {
            this.transY = bound.y2;
            outOfBounds = true;
        }
        if (outOfBounds) {
            this.transformImage();
        }
    }

    /** 重置容器和图像中心点 */
    resetViewport() {
        this.viewport = this.container.getBoundingClientRect();
        const imgRect = this.image.getBoundingClientRect();
        this.centerX = imgRect.x - this.viewport.x + imgRect.width / 2;
        this.centerY = imgRect.y - this.viewport.y + imgRect.height / 2;
    }

    /** 重置图像 */
    resetImage() {
        this.transX = 0;
        this.transY = 0;
        this.scale = 1;
        this.transformImage();
        this.resetViewport();
    }

    /** 重置光标样式 */
    resetCursor() {
        if (this.scale > 1) {
            this.image.style.cursor = "zoom-out";
        } else if (this.origScale > 1) {
            this.image.style.cursor = "zoom-in";
        } else {
            this.image.style.cursor = "default";
        }
    }

    /** 转换图像 */
    transformImage(x, y, s) {
        this.image.style.transform = `
                translate(${x ?? this.transX}px, ${y ?? this.transY}px)
                scale(${s ?? this.scale})`;
    }
}
