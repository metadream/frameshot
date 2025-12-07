import { $, formatBytes } from "../main/utils.js";
import preview from "./preview.js";

const gallery = $(".gallery");
const infoBar = $(".info-bar");

/** 缩略图区域 */
export default new class Gallery {

    thumbItems = [];
    currentIndex = -1;

    constructor() {
        // 点击空白区域取消选择
        gallery.addEventListener("click", e => {
            if (e.target === e.currentTarget) {
                this.#unselect();
                infoBar.innerHTML = "";
            }
        });

        // 方向键切换
        document.addEventListener("keyup", e => {
            switch (e.key) {
                case "Enter":
                    const item = this.thumbItems[this.currentIndex];
                    preview.open(item);
                    break;
                case "ArrowLeft":
                    if (e.altKey) {
                        console.log('Alt + 左箭头 被按下');
                    } else {
                        this.#selectIndex(--this.currentIndex);
                        preview.slidePrevious();
                    }
                    break;
                case "ArrowRight":
                    if (e.altKey) {
                        console.log('Alt + 右箭头 被按下');
                    } else {
                        this.#selectIndex(++this.currentIndex);
                        preview.slideNext();
                    }
                    break;
            }
        })

        // 可视区内懒加载缩略图
        this.observer = new IntersectionObserver(entries => {
            entries.forEach(async entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    await this.#loadThumbnail(img);
                    this.observer.unobserve(img);
                }
            });
        }, {
            rootMargin: "50px",
            threshold: 0.1
        });
    }

    /** 读取目录下的图片并渲染缩略图 */
    async render(folder) {
        this.observer.disconnect();
        this.thumbItems.length = 0;
        this.currentIndex = -1;
        gallery.innerHTML = "";

        const fragment = document.createDocumentFragment();
        const images = await electron.readImages(folder);
        images.forEach((path, index) => {
            const item = $(`<div class="thumb"></div>`);
            item.index = index++;
            item.addEventListener("click", async () => {
                this.#selectIndex(item.index);
            });

            const thumb = $('<img/>');
            thumb.metadata = { original: path };
            thumb.addEventListener("click", () => {
                preview.open(item);
            });

            item.append(thumb);
            fragment.append(item);
            this.thumbItems.push(item);
        });

        gallery.append(fragment);
        requestAnimationFrame(() => {
            gallery.querySelectorAll('img:not([src])').forEach(img => {
                this.observer.observe(img);
            });
        });
    }

    /** 加载(或创建)缩略图 */
    async #loadThumbnail(thumb) {
        if (thumb.src) return;

        // 设置元数据
        const { original } = thumb.metadata;
        Object.assign(thumb.metadata, await image.createThumbnail(original));

        // 加载缩略图
        thumb.src = thumb.metadata.thumbnail;
    }

    /** 根据索引选中缩略图 */
    #selectIndex(index) {
        // 索引边界判断
        if (index < 0) {
            this.currentIndex = 0;
            return;
        }
        const total = this.thumbItems.length;
        if (index > total - 1) {
            this.currentIndex = this.thumbItems.length - 1;
            return;
        }

        // 设置选中状态
        this.#unselect();
        this.currentIndex = index;
        const item = this.thumbItems[index];
        item.classList.add("selected");

        // 将选中项置于可见区域
        item.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        });

        // 更新标题栏
        const { metadata } = item.querySelector("img");
        const { width, height, size, original } = metadata;
        const filename = original.split(/[\\/]/).pop();
        infoBar.innerHTML = `${index + 1}/${total}　|　${width}×${height}　|　${formatBytes(size)}　|　${filename}`;
    }

    /** 取消选中状态 */
    #unselect() {
        const selected = gallery.querySelector(".selected");
        if (selected) selected.classList.remove("selected");
    }

}