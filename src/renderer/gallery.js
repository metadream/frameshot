import { $, formatBytes, nextFrame } from "../main/utils.js";
import preview from "./preview.js";

const gallery = $(".gallery");
const fileInfo = $(".file-info");
const imageInfo = $(".image-info");
const scaleInfo = $(".scale-info");
const sortBtn = $("#sort-btn");

/** 缩略图区域 */
export default new class Gallery {

    thumbItems = [];
    currentIndex = -1;

    constructor() {
        // 点击空白区域取消选择
        gallery.addEventListener("click", e => {
            if (e.target === e.currentTarget) {
                this.#unselect();
            }
        });

        // TODO 按字段排序
        sortBtn.onclick = () => {
            this.#sortBy("size");
        }

        // 方向键切换
        document.addEventListener("keyup", e => {
            switch (e.key) {
                case "Enter":
                    const item = this.thumbItems[this.currentIndex];
                    preview.open(item);
                    break;
                case "ArrowLeft":
                    this.#selectIndex(--this.currentIndex);
                    e.altKey ? preview.compare(-1) : preview.slide(-1);
                    break;
                case "ArrowRight":
                    this.#selectIndex(++this.currentIndex);
                    e.altKey ? preview.compare(1) : preview.slide(1);
                    break;
            }
        });

        preview.onSlide = (item) => {
            if (this.currentIndex !== item.index) {
                this.#selectIndex(item.index);
            }
        };

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
        this.#unselect();
        this.observer.disconnect();
        this.thumbItems.length = 0;
        this.currentIndex = -1;
        gallery.innerHTML = "";

        const fragment = document.createDocumentFragment();
        const images = await electron.readImages(folder);
        let index = 0;

        for (const path of images) {
            const item = $(`<div class="thumb"></div>`);
            item.index = index++;
            Object.assign(item, await image.getMetadata(path));

            item.addEventListener("click", async () => {
                this.#selectIndex(item.index);
            });

            const thumb = $("<img/>");
            thumb.addEventListener("click", () => {
                preview.open(item);
            });

            item.append(thumb);
            fragment.append(item);
            this.thumbItems.push(item);
        }

        gallery.append(fragment);
        nextFrame(() => {
            gallery.querySelectorAll("img:not([src])").forEach(img => {
                this.observer.observe(img);
            });
        });
    }

    /** 加载(或创建)缩略图 */
    async #loadThumbnail(thumb) {
        if (thumb.src) return;
        const item = thumb.parentNode;
        thumb.src = await image.createThumbnail(item.original);
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
            behavior: "smooth",
            block: "nearest",
            inline: "nearest"
        });

        // 更新标题栏
        const { width, height, size, original } = item;
        const filename = original.split(/[\\/]/).pop();
        fileInfo.innerHTML = `${index + 1}/${total}　|　${filename}`;
        imageInfo.innerHTML = `${width}×${height}　|　${formatBytes(size)}`;
        scaleInfo.innerHTML = `69%`;
    }

    /** 取消选中状态 */
    #unselect() {
        const selected = gallery.querySelector(".selected");
        if (selected) selected.classList.remove("selected");
        fileInfo.innerHTML = "";
        imageInfo.innerHTML = "";
        scaleInfo.innerHTML = "";
    }

    #sortBy(field = "name", order = "asc") {
        this.thumbItems.sort((a, b) => {
            let av = a[field];
            let bv = b[field];
            let result = 0;
            if (!av && !av) return result;

            if (!av) result = 1;
            else if (!bv) result = -1;
            else {
                switch (field) {
                    case "mtime":
                    case "size":
                    case "resolution":
                        result = av - bv;
                        break;
                    case "format":
                    case "name":
                        av = av.toLowerCase();
                        bv = bv.toLowerCase();
                        result = av.localeCompare(bv);
                        break;
                }
            }
            return order === "asc" ? result : -result;
        });

        // 直接移动DOM元素进行排序
        this.thumbItems.forEach((item, index) => {
            item.index = index;
            gallery.append(item);
        });
    }

}