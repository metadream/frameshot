import { $ } from "../main/utils.js";

const container = $("main");
const Zoom = { MIN_SCALE: 2, MAX_SCALE: 10, STEP: 1.2 };

/** 预览区域 */
export default new class Preview {

    constructor() {
        this.#initViewport();
        this.#createShadeMask();
        this.#createPreviewZone();

        window.addEventListener("resize", () => {
            this.#initViewport();
            this.#adaptViewport();
        });

        window.addEventListener('keyup', e => {
            if (e.code === "Esc") this.close();
        });
    }

    open(item) {
        this.shadeMask.fadeIn();
        const thumb = item.querySelector("img");
        const rect = thumb.getBoundingClientRect();
        const { left, top, width, height } = rect;
        const { viewport, previewZone } = this;
        const relativeX = left - viewport.left;
        const relativeY = top - viewport.top;

        previewZone.initWidth = width;
        previewZone.initHeight = height;
        previewZone.centerX = relativeX + width / 2;
        previewZone.centerY = relativeY + height / 2;
        previewZone.aspectRatio = width / height;

        previewZone.innerHTML = "";
        previewZone.ontransitionend = null;
        previewZone.style.left = relativeX + "px";
        previewZone.style.top = relativeY + "px";
        previewZone.style.width = width + "px";
        previewZone.style.height = height + "px";

        const image = thumb.cloneNode(true);
        image.src = item.original;
        previewZone.append(image);
        this.#adaptViewport();
    }

    close() {
        this.shadeMask.fadeOut();
        this.previewZone.transform(0, 0, 1);
        this.previewZone.ontransitionend = function() {
            this.removeAttribute("style");
        }
    }

    #initViewport() {
        const rect = container.getBoundingClientRect();
        this.viewport = {
            left: rect.left,
            top: rect.top,
            width: container.clientWidth,
            height: container.clientHeight,
            ratio: container.clientWidth / container.clientHeight
        }
    }

    #createPreviewZone() {
        this.previewZone = $(`<div class="preview-zone"></div>`);
        this.shadeMask.append(this.previewZone);

        this.previewZone.transform = function(x, y, s) {
            this.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
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

    #adaptViewport() {
        const { viewport, previewZone } = this;
        const { width, height, ratio } = viewport;
        const { initWidth, initHeight, centerX, centerY, aspectRatio } = previewZone;

        // previewZone.scale = aspectRatio > ratio ? width / initWidth : height / initHeight;
        // previewZone.initScale = previewZone.scale;
        // previewZone.minScale = previewZone.scale / Zoom.MIN_SCALE;
        // previewZone.maxScale = previewZone.scale * Zoom.MAX_SCALE;
        // previewZone.initX = previewZone.transX = width / 2 - centerX;
        // previewZone.initY = previewZone.transY = height / 2 - centerY;

        const scale = aspectRatio > ratio ? width / initWidth : height / initHeight;
        const transX = width / 2 - centerX;
        const transY = height / 2 - centerY;
        previewZone.transform(transX, transY, scale);
    }

}