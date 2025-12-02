import { $ } from "../main/utils.js";
import preview from "./preview.js";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const appName = await electron.getAppName();

export default new class Thumbnail {
    constructor() {
        this.container = $("main");
        this.container.addEventListener("click", e => {
            if (e.target === e.currentTarget) {
                this.#unselect();
                document.title = appName;
            }
        });

        this.observer = new IntersectionObserver(entries => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    await this.#loadImage(img);
                    this.observer.unobserve(img);
                }
            });
        }, {
            rootMargin: "50px",
            threshold: 0.1
        });
    }

    async render(filePaths) {
        this.observer.disconnect();
        this.container.innerHTML = "";

        const fragment = document.createDocumentFragment();
        const entry = await electron.readFilePaths(filePaths);
        entry.images.forEach(url => {
            const item = $(`<div class="thumb"><img data-original="${url}"/></div>`);
            item.url = url;
            this.#bindEvents(item);
            fragment.append(item);
        });

        this.container.append(fragment);
        requestAnimationFrame(() => {
            this.container.querySelectorAll('img[data-original]:not([src])').forEach(img => {
                this.observer.observe(img);
            });
        });
    }

    #bindEvents(item) {
        item.addEventListener("click", async () => {
            this.#unselect();
            item.classList.add("selected");

            const filename = item.url.split(/[\\/]/).pop();
            document.title = appName + "  |  " + filename;
        });

        const thumbnail = item.querySelector("img");
        thumbnail.addEventListener("click", () => {
            preview.render(thumbnail);
        });
    }

    #unselect() {
        const selected = this.container.querySelector(".selected");
        if (selected) selected.classList.remove("selected");
    }

    async #loadImage(img) {
        if (img.src) return;
        img.src = await this.#createThumbnail(img.dataset.original);
        img.onload = () => {
            img.classList.add('loaded');
        };
    }

    async #createThumbnail(filePath) {
        // const buffer = await electron.getThumbnail(filePath);
        const randomInt = Math.floor(Math.random() * 2001) + 1000;
        await delay(randomInt);
        return filePath;
    }

    destroy() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }
}