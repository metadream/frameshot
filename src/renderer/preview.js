import { $ } from "../main/utils.js";

const container = $("main");
const Zoom = { MIN_SCALE: 2, MAX_SCALE: 20, STEP: 1.2 };

/** 预览区域 */
export default new class Preview {

    constructor() {
        this.#resetViewport();
        this.#createShadeMask();

        window.addEventListener("resize", () => {
            this.#resetViewport();
            this.currentZone && this.currentZone.adaptViewport();
        });

        window.addEventListener('keyup', e => {
            if (e.code === "Escape") this.close();
        });
    }

    open(item) {
        this.shadeMask.fadeIn();
        this.currentZone = this.#createPreviewZone(item);
        this.currentZone.adaptViewport();
    }

    close() {
        this.shadeMask.fadeOut();
        this.currentZone.restore();
    }

    #createPreviewZone(thumb) {
        const self = this;
        const previewZone = $(`<div class="preview-zone"></div>`);

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

        previewZone.transform = function(x, y, s) {
            requestAnimationFrame(() => {
                this.style.transform = `
                    translate(${x ?? this.transX}px, ${y ?? this.transY}px) 
                    scale(${s ?? this.scale})
                `;
            });
        }

        previewZone.adaptViewport = function() {
            const { width, height, ratio } = self.viewport;
            const { initWidth, initHeight, centerX, centerY, aspectRatio } = this;

            this.scale = aspectRatio > ratio ? width / initWidth : height / initHeight;
            this.initScale = this.scale;
            this.minScale = this.scale / Zoom.MIN_SCALE;
            this.maxScale = this.scale * Zoom.MAX_SCALE;
            this.initX = this.transX = width / 2 - centerX;
            this.initY = this.transY = height / 2 - centerY;
            this.transform();
        }

        previewZone.restore = function() {
            this.position();
            this.transform(0, 0, 1);
            this.ontransitionend = () => this.remove();
        }

        previewZone.checkBoundary = function() {
            this.style.cursor = this.scale <= this.initScale ? 'zoom-in' : 'zoom-out';
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

        previewZone.addEventListener('pointerdown', function(e) {
            e.preventDefault();

            this.style.transition = "none";
            this.style.cursor = "grab";
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.isDragging = false;

            this.onpointermove = function(e) {
                this.isDragging = true;
                this.offsetX = e.clientX - this.startX;
                this.offsetY = e.clientY - this.startY;
                this.style.cursor = "grabbing";
                this.transform(this.transX + this.offsetX, this.transY + this.offsetY, null);
            }

            this.onpointerup = this.onpointerout = function(e) {
                this.transX += this.offsetX ?? 0;
                this.transY += this.offsetY ?? 0;
                this.style.transition = 'all .3s';
                this.onpointermove = null;

                if (e.type == 'pointerup' && !this.isDragging) {
                    const { width, height } = self.viewport;
                    this.transX = width - this.centerX - e.clientX;
                    this.transY = height - this.centerY - e.clientY;
                    this.scale = this.scale <= this.initScale ? this.scale *= 2 : this.initScale;
                    this.transform();
                }
                this.checkBoundary();
            }
        });

        previewZone.addEventListener('wheel', function(e) {
            e.preventDefault();

            if (e.wheelDelta > 0) this.scale *= Zoom.STEP;
            else this.scale /= Zoom.STEP;
            if (this.scale > this.maxScale) this.scale = this.maxScale;
            if (this.scale < this.minScale) this.scale = this.minScale;

            this.transform();
            this.checkBoundary();
        });

        const { relativeX, relativeY, width, height } = previewZone.position();
        previewZone.initWidth = width;
        previewZone.initHeight = height;
        previewZone.centerX = relativeX + width / 2;
        previewZone.centerY = relativeY + height / 2;
        previewZone.aspectRatio = width / height;

        const image = thumb.cloneNode(true);
        image.src = thumb.metadata.original;
        previewZone.append(image);

        this.shadeMask.append(previewZone);
        return previewZone;
    }

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

    #createShadeMask() {
        this.shadeMask = $(`<div class="shade-mask">
            <svg class="icon-prev" viewBox="0 0 60 60"><path d="M29 43l-3 3-16-16 16-16 3 3-13 13 13 13z"/></svg>
            <svg class="icon-next" viewBox="0 0 60 60"><path d="m31 43 3 3 16-16-16-16-3 3 13 13Z"/></svg>
        </div>`);
        container.append(this.shadeMask);

        this.shadeMask.fadeIn = function() {
            this.ontransitionend = null;
            this.style.display = 'flex';
            requestAnimationFrame(() => this.style.background = 'rgba(0, 0, 0, .8)');
        }

        this.shadeMask.fadeOut = function() {
            this.style.background = 'rgba(0, 0, 0, 0)';
            this.ontransitionend = () => this.style.display = 'none';
        }

        this.shadeMask.addEventListener('pointerup', e => {
            const { target } = e;
            const { currentZone, shadeMask } = this;
            if (currentZone.contains(target)) return;

            const prevIcon = shadeMask.querySelector(".icon-prev");
            const nextIcon = shadeMask.querySelector(".icon-next");

            if (prevIcon.contains(target) || nextIcon.contains(target)) {
                console.log("=================prev/next")
            } else {
                this.close();
            }
        });
    }

}