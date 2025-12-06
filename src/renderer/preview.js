import { $ } from "../main/utils.js";

const container = $("main");
const Zoom = { MIN_SCALE: 2, MAX_SCALE: 10, STEP: 1.2 };

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
            if (e.code === "Esc") this.close();
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
                this.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
            });
        }

        previewZone.adaptViewport = function() {
            const { width, height, ratio } = self.viewport;
            const { initWidth, initHeight, centerX, centerY, aspectRatio } = this;

            const scale = aspectRatio > ratio ? width / initWidth : height / initHeight;
            const transX = width / 2 - centerX;
            const transY = height / 2 - centerY;
            this.transform(transX, transY, scale);
        }

        previewZone.restore = function() {
            this.position();
            this.transform(0, 0, 1);
            this.ontransitionend = () => this.remove();
        }

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
            const { shadeMask } = this;
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