import { $ } from "../main/utils.js";
import preview from "./preview.js";

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const container = $(".gallery");
const infoBar = $(".info-bar");

/** 缩略图区域 */
export default new class Gallery {

    thumbnails = [];
    currentIndex = -1;

    constructor() {
        container.addEventListener("click", e => {
            if (e.target === e.currentTarget) {
                this.#unselect();
                infoBar.innerHTML = "";
            }
        });

        document.addEventListener("keyup", e => {
            switch (e.code) {
                case "ArrowLeft":
                    this.#selectIndex(--this.currentIndex);
                    break;
                case "ArrowRight":
                    this.#selectIndex(++this.currentIndex);
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
            this.currentIndex = 0;
            return;
        }
        if (index > this.thumbnails.length - 1) {
            this.currentIndex = this.thumbnails.length - 1;
            return;
        }

        this.#unselect();
        this.currentIndex = index;
        const item = this.thumbnails[index];
        item.classList.add("selected");

        const filename = item.url.split(/[\\/]/).pop();
        infoBar.innerHTML = `2000x3000　|　1.4MB　|　${filename}`;
    }

    async render(folder) {
        this.observer.disconnect();
        container.innerHTML = "";

        const fragment = document.createDocumentFragment();
        const images = await electron.readImages(folder);
        let index = 0;
        images.forEach(url => {
            const item = $(`<div class="thumb"><img data-original="${url}"/></div>`);
            item.url = url;
            item.index = index++;
            this.thumbnails.push(item);
            this.#bindEvents(item);
            fragment.append(item);
        });

        container.append(fragment);
        requestAnimationFrame(() => {
            container.querySelectorAll('img[data-original]:not([src])').forEach(img => {
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
        const selected = container.querySelector(".selected");
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

}