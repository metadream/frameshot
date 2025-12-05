import { $ } from "../main/utils.js";

const container = $("main");

/** 预览区域 */
export default new class Preview {

    constructor() {
        this.#createShadeMask();

        window.addEventListener('keyup', e => {
            if (e.code === "Esc") this.close();
        });
    }

    #createShadeMask() {
        this.shadeMask = $(`<div class="shade-mask">
            <svg class="icon-prev" viewBox="0 0 60 60"><path d="M29 43l-3 3-16-16 16-16 3 3-13 13 13 13z"/></svg>
            <svg class="icon-next" viewBox="0 0 60 60"><path d="m31 43 3 3 16-16-16-16-3 3 13 13Z"/></svg>
        </div>`);

        this.shadeMask.fadeIn = function() {
            this.ontransitionend = null;
            this.style.display = 'flex';
            setTimeout(() => this.style.background = 'rgba(0, 0, 0, .8)');
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

        container.append(this.shadeMask);
    }

    open(item) {
        this.shadeMask.fadeIn();
    }

    close() {
        this.shadeMask.fadeOut();
    }

}