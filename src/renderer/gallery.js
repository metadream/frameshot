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
            switch (e.code) {
                case "ArrowLeft":
                    this.#selectIndex(--this.currentIndex);
                    break;
                case "ArrowRight":
                    this.#selectIndex(++this.currentIndex);
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
        gallery.innerHTML = "";

        const fragment = document.createDocumentFragment();
        const images = await electron.readImages(folder);

        images.forEach((url, index) => {
            const item = $(`<div class="thumb"><img data-original-src="${url}"/></div>`);
            item.index = index++;

            this.thumbItems.push(item);
            this.#bindEvents(item);
            fragment.append(item);
        });

        gallery.append(fragment);
        requestAnimationFrame(() => {
            gallery.querySelectorAll('img[data-original-src]:not([src])').forEach(img => {
                this.observer.observe(img);
            });
        });
    }

    /** 加载(或创建)缩略图 */
    async #loadThumbnail(img) {
        if (img.src) return;

        // 设置元数据
        const metadata = await image.createThumbnail(img.dataset.originalSrc);
        const item = img.parentNode;
        item.width = metadata.width;
        item.height = metadata.height;
        item.size = metadata.size;
        item.original = metadata.original;

        // 加载缩略图
        img.src = metadata.thumbnail;
        img.onload = () => {
            img.classList.add('loaded');
        };
    }

    /** 绑定缩略图事件 */
    #bindEvents(item) {
        // 单击选中
        item.addEventListener("click", async () => {
            this.#selectIndex(item.index);
        });

        // 双击预览
        const thumbnail = item.querySelector("img");
        thumbnail.addEventListener("dblclick", () => {
            preview.render(thumbnail);
        });
    }

    /** 根据索引选中缩略图 */
    #selectIndex(index) {
        // 索引边界判断
        if (index < 0) {
            this.currentIndex = 0;
            return;
        }
        if (index > this.thumbItems.length - 1) {
            this.currentIndex = this.thumbItems.length - 1;
            return;
        }

        // 设置选中状态
        this.#unselect();
        this.currentIndex = index;
        const item = this.thumbItems[index];
        item.classList.add("selected");

        // 更新标题栏
        const { width, height, size, original } = item;
        const filename = original.split(/[\\/]/).pop();
        infoBar.innerHTML = `${width}×${height}　|　${formatBytes(size)}　|　${filename}`;
    }

    /** 取消选中状态 */
    #unselect() {
        const selected = gallery.querySelector(".selected");
        if (selected) selected.classList.remove("selected");
    }

}