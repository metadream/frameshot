import { $, formatBytes, nextFrame } from "../main/utils.js";
import preview from "./preview.js";

const gallery = $(".gallery");
const fileInfo = $(".file-info");
const imageInfo = $(".image-info");
const scaleInfo = $(".scale-info");
const sortBtn = $("#sort-btn");
const sortMenu = $(".sort-menu");

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

        sortBtn.onpointerenter = sortMenu.onpointerenter = () => {
            clearTimeout(sortBtn.hideTimer);
            sortMenu.classList.add("show");
        }
        sortBtn.onpointerleave = sortMenu.onpointerleave = () => {
            sortBtn.hideTimer = setTimeout(() => sortMenu.classList.remove("show"), 200)
        }

        const sortItems = sortMenu.querySelectorAll("span");
        sortItems.forEach(item => {
            item.onclick = () => {
                const field = item.dataset.field;
                const icon = item.querySelector("i");
                const sort = !icon.className || icon.className === "desc"
                    ? "asc" : "desc";

                this.#sortBy(field, sort);
                sortItems.forEach(v => v.querySelector("i").removeAttribute("class"));
                icon.className = sort;
            }
        });

        // 方向键切换
        document.addEventListener("keyup", e => {
            switch (e.key) {
                case "Enter":
                    let item = this.thumbItems[this.currentIndex];
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
                case "Delete":
                    const itemToDel = this.thumbItems[this.currentIndex];
                    console.log(itemToDel.original, itemToDel.thumbnail); // TODO fs.unlink

                    itemToDel.remove();
                    this.thumbItems.splice(this.currentIndex, 1);
                    this.#selectIndex(this.currentIndex);
                    break;
            }
        });

        preview.onSlide = (item) => {
            const index = item.index();
            if (this.currentIndex !== index) {
                this.#selectIndex(index);
            }
        };

        preview.onScale = ratio => {
            scaleInfo.innerHTML = ratio > 0 ? `${(ratio * 100).toFixed(0)}%` : "";
        }

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

        for (const path of images) {
            const item = $(`<div class="thumb"></div>`);
            Object.assign(item, await image.getMetadata(path));
            item.index = function() {
                let index = 0;
                let node = this.previousElementSibling;
                while (node) {
                    index++;
                    node = node.previousElementSibling;
                }
                return index;
            };

            item.addEventListener("click", async () => {
                this.#selectIndex(item.index());
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
        item.thumbnail = await image.createThumbnail(item.original);
        thumb.src = item.thumbnail;
    }

    /** 根据索引选中缩略图 */
    #selectIndex(index) {
        // 索引边界判断
        const total = this.thumbItems.length;
        if (index < 0) index = 0;
        if (index > total - 1) index = total - 1;
        this.currentIndex = index;

        // 设置选中状态
        this.#unselect();
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
            gallery.append(item);
        });
    }

}