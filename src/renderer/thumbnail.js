import { $ } from "../main/utils.js";
import preview from "./preview.js";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const infoBar = $(".info-bar");
const thumbElements = [];
let currentIndex = -1;

export default new class Thumbnail {
    constructor() {
        this.container = $(".thumbnails");
        this.container.addEventListener("click", e => {
            if (e.target === e.currentTarget) {
                this.#unselect();
                infoBar.innerHTML = "";
            }
        });

        document.addEventListener("keyup", e => {
            switch (e.code) {
                case "ArrowLeft":
                    this.#selectIndex(--currentIndex);
                    break;
                case "ArrowRight":
                    this.#selectIndex(++currentIndex);
                    break;
            }
        })

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

    #selectIndex(index) {
        if (index < 0) {
            currentIndex = 0;
            return;
        }
        if (index > thumbElements.length - 1) {
            currentIndex = thumbElements.length - 1;
            return;
        }

        this.#unselect();
        currentIndex = index;
        const item = thumbElements[index];
        item.classList.add("selected");

        const filename = item.url.split(/[\\/]/).pop();
        infoBar.innerHTML = `2000x3000　|　1.4MB　|　${filename}`;
    }

    async render(filePaths) {
        this.observer.disconnect();
        this.container.innerHTML = "";

        const fragment = document.createDocumentFragment();
        const entry = await electron.readFilePaths(filePaths);
        let index = 0;
        entry.images.forEach(url => {
            const item = $(`<div class="thumb"><img data-original="${url}"/></div>`);
            item.url = url;
            item.index = index++;
            thumbElements.push(item);
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
            this.#selectIndex(item.index);
        });

        const thumbnail = item.querySelector("img");
        thumbnail.addEventListener("dblclick", () => {
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