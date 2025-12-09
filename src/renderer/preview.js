import { $, nextFrame } from "../main/utils.js";

const container = $("main");
const Zoom = { MIN_SCALE: 2, MAX_SCALE: 20, STEP: 1.2 };

/** 预览区域 */
export default new class Preview {

    constructor() {
        this.#resetViewport();
        this.#createShadeMask();

        // 监听窗体大小变化
        window.addEventListener("resize", () => {
            this.#resetViewport();
            this.currentZone && this.currentZone.adaptViewport();
        });

        // 监听全局按键
        window.addEventListener("keyup", e => {
            if (e.key === "Escape") this.close();
        });
    }

    /** 打开预览区 */
    async open(thumbItem) {
        if (!this.currentZone) {
            this.#loadSiblingItems(thumbItem);
            this.currentZone = await this.#createPreviewZone(thumbItem);
            this.currentZone.adaptViewport(true);
            this.shadeMask.fadeIn();
        }
    }

    /** 关闭预览区 */
    close() {
        if (this.currentZone) {
            this.currentZone.restore();
            this.currentZone = null;
            this.shadeMask.fadeOut();
        }
    }

    /** 左右滑动相邻图片 */
    async slide(direction) {
        if (!this.currentZone) return;

        // 判断获取上一张还是下一张
        const { prevItem, nextItem } = this;
        const siblingItem = direction > 0 ? nextItem : prevItem;
        if (!siblingItem) return;

        this.onSlide && this.onSlide(siblingItem);
        this.#loadSiblingItems(siblingItem);

        // 将当前预览区滑走并移除
        this.#slidePreviewZone(direction, true);
        // 创建新的预览区并以隐藏方式设置到视口外
        this.currentZone = await this.#createPreviewZone(siblingItem);
        this.currentZone.style.display = "none";
        this.currentZone.adaptViewport();
        this.#slidePreviewZone(-direction);

        // 将新的预览区滑入视口内
        this.currentZone.style.display = "block";
        nextFrame(() => this.#slidePreviewZone(direction));
    }

    /** 保持缩放无动画切换相邻图片 */
    async compare(direction) {
        if (!this.currentZone) return;

        // 判断获取上一张还是下一张
        const { prevItem, nextItem } = this;
        const siblingItem = direction > 0 ? nextItem : prevItem;
        if (!siblingItem) return;

        this.onSlide && this.onSlide(siblingItem);
        this.#loadSiblingItems(siblingItem);

        const previewZone = await this.#createPreviewZone(siblingItem);
        this.#copyZoneProperties(this.currentZone, previewZone);
        this.currentZone.remove();
        this.currentZone = previewZone;
    }

    /** 动态滑动预览区 */
    #slidePreviewZone(direction, isRemove) {
        const { viewport, currentZone } = this;
        const { width } = viewport;
        direction > 0 ? currentZone.transX -= width : currentZone.transX += width;
        currentZone.scale = currentZone.initScale;
        currentZone.transform();

        // 滑动结束后移除元素
        if (isRemove) {
            currentZone.ontransitionend = () => currentZone.remove();
        }
    }

    /** 加载相邻图片（同时设置方向图标可见行） */
    #loadSiblingItems(currentItem) {
        const { prevIcon, nextIcon } = this.shadeMask;
        this.prevItem = currentItem.previousSibling;
        this.nextItem = currentItem.nextSibling;
        prevIcon.style.visibility = this.prevItem ? "visible" : "hidden";
        nextIcon.style.visibility = this.nextItem ? "visible" : "hidden";
    }

    /** 创建预览区 */
    async #createPreviewZone(thumbItem) {
        const thumb = thumbItem.querySelector("img");
        await this.#ensureThumbLoaded(thumb);

        const self = this;
        const previewZone = $(`<div class="preview-zone"></div>`);

        // 定义初始位置
        previewZone.position = function() {
            const rect = thumb.getBoundingClientRect();
            const relativeX = rect.left - self.viewport.left;
            const relativeY = rect.top - self.viewport.top;
            const { width, height } = rect;
            this.style.left = relativeX + "px";
            this.style.top = relativeY + "px";
            this.style.width = width + "px";
            this.style.height = height + "px";
            return { relativeX, relativeY, width, height };
        }

        // 缩放动画
        previewZone.transform = function(x, y, s) {
            this.calcScaleRatio();
            this.style.transform = `
                translate(${x ?? this.transX}px, ${y ?? this.transY}px) 
                scale(${s ?? this.scale})`;
        }

        previewZone.calcScaleRatio = function() {
            if (this.naturalWidth) {
                const rate = this.scale * this.initWidth / this.naturalWidth;
                self.onScale && self.onScale(rate.toFixed(2));
            }
        }

        // 自适应视口大小
        previewZone.adaptViewport = function(delay) {
            const { width, height, ratio } = self.viewport;
            const { initWidth, initHeight, centerX, centerY, aspectRatio } = this;

            this.scale = aspectRatio > ratio ? width / initWidth : height / initHeight;
            this.initScale = this.scale;
            this.minScale = this.scale / Zoom.MIN_SCALE;
            this.maxScale = this.scale * Zoom.MAX_SCALE;
            this.initX = this.transX = width / 2 - centerX;
            this.initY = this.transY = height / 2 - centerY;
            delay ? nextFrame(() => this.transform()) : this.transform();
        }

        // 还原到缩略图状态
        previewZone.restore = function() {
            this.position();
            this.transform(0, 0, 1);
            this.ontransitionend = () => this.remove();
            self.onScale && self.onScale(0);
        }

        // 判断拖动边界
        previewZone.checkBoundary = function() {
            this.style.cursor = this.scale <= this.initScale ? "zoom-in" : "zoom-out";
            const { initWidth, initHeight } = this;
            const width = initWidth * this.scale;
            const height = initHeight * this.scale;
            const bound = {
                x1: this.initX, x2: this.initX,
                y1: this.initY, y2: this.initY
            }
            if (width > self.viewport.width) {
                bound.x1 = width / 2 - this.centerX;
                bound.x2 = bound.x1 - (width - self.viewport.width);
            }
            if (height > self.viewport.height) {
                bound.y1 = height / 2 - this.centerY;
                bound.y2 = bound.y1 - (height - self.viewport.height);
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
                this.transform();
            }
        }

        // 拖动图片
        previewZone.addEventListener("pointerdown", function(e) {
            e.preventDefault();
            this.style.transition = "none";
            this.style.cursor = "grab";
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.isDragging = false;

            this.onpointermove = function(e) {
                this.isDragging = true;
                this.style.cursor = "grabbing";
                this.offsetX = e.clientX - this.startX;
                this.offsetY = e.clientY - this.startY;
                this.transform(this.transX + this.offsetX, this.transY + this.offsetY, null);
            }

            this.onpointerup = this.onpointerout = function(e) {
                this.transX += this.offsetX ?? 0;
                this.transY += this.offsetY ?? 0;
                this.style.transition = "all .3s";
                this.onpointermove = null;

                // 点击图片缩放
                if (e.type == "pointerup") {
                    if (!this.isDragging) {
                        const { width, height } = self.viewport;
                        this.transX = width - this.centerX - e.clientX;
                        this.transY = height - this.centerY - e.clientY;
                        this.scale = this.scale <= this.initScale ? this.scale *= 2 : this.initScale;
                        this.transform();
                    }
                    this.checkBoundary();
                }
            }
        });

        // 鼠标滚轮缩放
        previewZone.addEventListener("wheel", function(e) {
            this.scale = e.wheelDelta > 0
                ? this.scale *= Zoom.STEP : this.scale /= Zoom.STEP;
            if (this.scale > this.maxScale) this.scale = this.maxScale;
            if (this.scale < this.minScale) this.scale = this.minScale;

            this.transform();
            this.checkBoundary();
        }, { passive: true });

        // 绑定必要的属性
        const { relativeX, relativeY, width, height } = previewZone.position();
        previewZone.initWidth = width;
        previewZone.initHeight = height;
        previewZone.centerX = relativeX + width / 2;
        previewZone.centerY = relativeY + height / 2;
        previewZone.aspectRatio = width / height;

        // 克隆缩略图到预览区
        const image = thumb.cloneNode(true);
        image.src = thumbItem.original;
        image.onload = () => {
            if (!previewZone.naturalWidth) {
                previewZone.naturalWidth = image.naturalWidth;
                previewZone.calcScaleRatio();
            }
        }
        previewZone.append(image);

        this.shadeMask.append(previewZone);
        return previewZone;
    }

    /** 确保缩略图已加载 */
    #ensureThumbLoaded(thumb) {
        return new Promise((resolve, reject) => {
            if (thumb.width) return resolve();
            const onLoad = () => {
                resolve();
                thumb.removeEventListener("load", onLoad);
                thumb.removeEventListener("error", onError);
            };
            const onError = () => {
                reject();
                thumb.removeEventListener("load", onLoad);
                thumb.removeEventListener("error", onError);
            };
            thumb.addEventListener("load", onLoad);
            thumb.addEventListener("error", onError);
        });
    }

    /** 复制预览区属性以保持原位置和缩放状态 */
    #copyZoneProperties(source, target) {
        const style = source.getAttribute("style");
        const {
            initScale, minScale, maxScale, scale,
            centerX, centerY, initX, initY, transX, transY
        } = source;

        target.setAttribute("style", style);
        target.initScale = initScale;
        target.minScale = minScale;
        target.maxScale = maxScale;
        target.scale = scale;
        target.centerX = centerX;
        target.centerY = centerY;
        target.initX = initX;
        target.initY = initY;
        target.transX = transX;
        target.transY = transY;
    }

    /** 重置视口属性 */
    #resetViewport() {
        const rect = container.getBoundingClientRect();
        this.viewport = {
            left: rect.left,
            top: rect.top,
            width: container.clientWidth,
            height: container.clientHeight,
            ratio: container.clientWidth / container.clientHeight
        }
    }

    /** 创建遮罩层 */
    #createShadeMask() {
        this.shadeMask = $(`<div class="shade-mask">
            <svg class="icon-prev" viewBox="0 0 60 60"><path d="M29 43l-3 3-16-16 16-16 3 3-13 13 13 13z"/></svg>
            <svg class="icon-next" viewBox="0 0 60 60"><path d="m31 43 3 3 16-16-16-16-3 3 13 13Z"/></svg>
        </div>`);

        this.shadeMask.prevIcon = this.shadeMask.querySelector(".icon-prev");
        this.shadeMask.nextIcon = this.shadeMask.querySelector(".icon-next");
        container.append(this.shadeMask);

        this.shadeMask.fadeIn = function() {
            this.style.display = "flex";
            nextFrame(() => this.style.background = "rgba(0, 0, 0, .8)");
        }

        this.shadeMask.fadeOut = function() {
            this.style.background = "rgba(0, 0, 0, 0)";
            this.ontransitionend = () => {
                this.ontransitionend = null;
                this.style.display = "none";
            }
        }

        this.shadeMask.addEventListener("pointerup", e => {
            const { target } = e;
            if (this.currentZone.contains(target)) return;

            const { prevIcon, nextIcon } = this.shadeMask;
            if (prevIcon.contains(target)) {
                this.slide(-1);
            } else if (nextIcon.contains(target)) {
                this.slide(1);
            } else {
                this.close();
            }
        });
    }

}