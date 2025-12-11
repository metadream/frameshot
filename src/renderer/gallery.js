import { $, formatBytes, formatDate, nextFrame } from "../main/utils.js";
import preview from "./preview.js";

const gallery = $(".gallery");
const fileInfo = $(".file-info");
const imageInfo = $(".image-info");
const scaleInfo = $(".scale-info");
const gridBtn = $("#grid-btn");
const listBtn = $("#list-btn");
const sortBtn = $("#sort-btn");
const sortMenu = $(".sort-menu");

let layoutMode = await electron.getConfig("layout_mode");
let sortMode = await electron.getConfig("sort_mode");

/** 缩略图区域 */
export default new class Gallery {

    galleryItems = [];
    currentIndex = -1;

    constructor() {
        // 点击空白区域取消选择
        gallery.addEventListener("click", e => {
            if (!e.target.closest(".gallery-item")) {
                this.#unselect();
            }
        });

        // 布局切换按钮
        gridBtn.onclick = listBtn.onclick = e => {
            layoutMode = e.currentTarget.dataset.mode;
            this.#setLayoutMode(layoutMode);
            electron.updateConfig("layout_mode", layoutMode);
        }

        // 排序菜单按钮
        sortBtn.onpointerenter = sortMenu.onpointerenter = () => {
            clearTimeout(sortBtn.hideTimer);
            sortMenu.classList.add("show");
        }
        sortBtn.onpointerleave = sortMenu.onpointerleave = () => {
            sortBtn.hideTimer = setTimeout(() => sortMenu.classList.remove("show"), 200)
        }

        // 排序菜单功能绑定
        const sortItems = sortMenu.querySelectorAll("span");
        sortItems.forEach(item => {
            const field = item.dataset.field;
            const icon = item.querySelector("i");

            // 设置启动后的排序选项
            if (field === sortMode[0]) {
                icon.className = sortMode[1];
            }

            // 点击菜单项切换排序方式
            item.onclick = () => {
                const sort = !icon.className || icon.className === "desc"
                    ? "asc" : "desc";
                sortMode = [field, sort];

                this.#setSortMode(sortMode);
                sortItems.forEach(v => v.querySelector("i").removeAttribute("class"));
                icon.className = sort;
                electron.updateConfig("sort_mode", sortMode);
            }
        });

        // 方向键切换
        document.addEventListener("keydown", e => {
            switch (e.key) {
                case "Enter":
                    preview.open(this.galleryItems[this.currentIndex]);
                    break;
                case "ArrowUp":
                case "ArrowLeft":
                    e.preventDefault();
                    this.#selectIndex(--this.currentIndex);
                    e.altKey ? preview.compare(-1) : preview.slide(-1);
                    break;
                case "ArrowDown":
                case "ArrowRight":
                    e.preventDefault();
                    this.#selectIndex(++this.currentIndex);
                    e.altKey ? preview.compare(1) : preview.slide(1);
                    break;
                case "Delete":
                    const selectedItem = this.galleryItems[this.currentIndex];
                    // electron.deleteFile(selectedItem.original);
                    // electron.deleteFile(selectedItem.thumbnail);
                    selectedItem.remove();

                    this.galleryItems.splice(this.currentIndex, 1);
                    this.#selectIndex(this.currentIndex);

                    // TODO 删除最后一张时预览图无法滑动到上一张
                    this.currentIndex == this.galleryItems.length
                        ? preview.slide(-1) : preview.slide(1);
                    break;
            }
        });

        // 监听预览区滑动事件：切换选中状态
        preview.onSlide = item => {
            const index = item.index();
            if (this.currentIndex !== index) {
                this.#selectIndex(index);
            }
        };

        // 监听预览区缩放事件：在标题栏显示缩放比例
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

    /** 读取目录并渲染画廊展示区 */
    async render(folder) {
        // 重置初始化
        this.#unselect();
        this.observer.disconnect();
        this.galleryItems.length = 0;
        this.currentIndex = -1;
        gallery.innerHTML = "";

        // 读取目录下的图片并构建元素
        const images = await electron.readImages(folder);
        for (const path of images) {
            // 创建展示项
            const item = $(`<div class="gallery-item"></div>`);
            Object.assign(item, await image.getMetadata(path));

            item.innerHTML = `<img/>
                <div class="filename">${item.name}</div>
                <div style="width:50px">${item.format}</div>
                <div style="width:100px">${item.width} × ${item.height}</div>
                <div style="width:90px">${formatBytes(item.size)}</div>
                <div style="width:90px">${formatDate(item.mtime)}</div>`;

            // 获取在兄弟节点中的索引
            item.index = function() {
                let index = 0;
                let node = this.previousElementSibling;
                while (node) {
                    index++;
                    node = node.previousElementSibling;
                }
                return index;
            };

            // 点击设置选中状态
            item.addEventListener("click", async () => {
                this.#selectIndex(item.index());
            });

            // 双击打开预览
            item.addEventListener("dblclick", () => {
                preview.open(item);
            });

            // 添加到画廊容器
            gallery.append(item);
            this.galleryItems.push(item);
        }

        // 观察缩略图是否进入可视区
        nextFrame(() => {
            gallery.querySelectorAll("img:not([src])").forEach(img => {
                this.observer.observe(img);
            });
        });

        // 设置启动后的排序结果
        this.#setLayoutMode(layoutMode);
        this.#setSortMode(sortMode);
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
        const total = this.galleryItems.length;
        if (index < 0) index = 0;
        if (index > total - 1) index = total - 1;
        this.currentIndex = index;

        // 设置选中状态
        this.#unselect();
        const item = this.galleryItems[index];
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
        imageInfo.innerHTML = `${width} × ${height}　|　${formatBytes(size)}`;
    }

    /** 取消选中状态 */
    #unselect() {
        const selected = gallery.querySelector(".selected");
        if (selected) selected.classList.remove("selected");
        fileInfo.innerHTML = "";
        imageInfo.innerHTML = "";
        scaleInfo.innerHTML = "";
    }

    #setLayoutMode(mode) {
        gallery.className = "gallery " + mode;
    }

    /** 对展示区进行排序 */
    #setSortMode(sortMode = ["name", "asc"]) {
        const field = sortMode[0];
        const order = sortMode[1];

        this.galleryItems.sort((a, b) => {
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
        gallery.append(...this.galleryItems);
    }

}