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

/** 缩略图展示区 */
export default new class Gallery {

    galleryItems = [];
    selectedItem = null;

    constructor() {
        // 点击空白区域取消选择
        gallery.addEventListener("click", e => {
            if (!e.target.closest(".gallery-item")) {
                this.#unselect();
            }
        });

        // 切换并保存布局方式
        gridBtn.onclick = listBtn.onclick = e => {
            layoutMode = e.currentTarget.dataset.mode;
            this.#setLayoutMode(layoutMode);
            electron.updateConfig("layout_mode", layoutMode);
        }

        // 显示和隐藏排序菜单
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

            // 切换并保存排序方式
            item.onclick = () => {
                const sort = !icon.className || icon.className === "desc" ? "asc" : "desc";
                sortMode = [field, sort];

                sortItems.forEach(v => v.querySelector("i").removeAttribute("class"));
                icon.className = sort;
                this.#setSortMode(sortMode);
                electron.updateConfig("sort_mode", sortMode);
            }
        });

        // 按键绑定
        document.addEventListener("keydown", async e => {
            switch (e.key) {
                // 回车键打开预览
                case "Enter":
                    preview.open(this.selectedItem);
                    break;

                // 左上方向键切换上一张
                case "ArrowUp":
                case "ArrowLeft":
                    e.preventDefault();
                    this.#moveItem(-1);
                    e.altKey ? preview.compare(-1) : preview.slide(-1);
                    break;

                // 右下方向键切换下一张
                case "ArrowDown":
                case "ArrowRight":
                    e.preventDefault();
                    this.#moveItem(1);
                    e.altKey ? preview.compare(1) : preview.slide(1);
                    break;

                // 删除键删除图片
                // Windows/Linux: Delete; MacOS: Fn+Backspace
                case "Delete":
                    const choice = await electron.openConfirmDialog();
                    if (choice) {
                        const { selectedItem } = this;
                        const success = await electron.trashFile(selectedItem.original);

                        if (success) {
                            electron.deleteFile(selectedItem.thumbnail);

                            // 如果不是最后一张则滑动到下一张
                            // 否则关闭预览，选中上一张
                            const index = selectedItem.index();
                            if (index < this.galleryItems.length - 1) {
                                preview.slide(1);
                            } else {
                                preview.close();
                                this.#moveItem(-1);
                            }

                            // 移除元素和缓存数据
                            selectedItem.remove();
                            this.galleryItems.splice(index, 1);
                        }
                    }
            }
        });

        // 监听预览区滑动事件：切换选中状态
        preview.onSlide = item => {
            if (item !== this.selectedItem) {
                this.#selectItem(item);
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

    /** 读取目录并渲染展示区 */
    async render(folder) {
        // 初始化重置
        this.#unselect();
        this.observer.disconnect();
        this.galleryItems.length = 0;
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
                this.#selectItem(item);
            });

            // 双击打开预览
            item.addEventListener("dblclick", () => {
                preview.open(item);
            });

            // 添加到容器和缓存
            gallery.append(item);
            this.galleryItems.push(item);
        }

        // 观察缩略图是否进入可视区
        nextFrame(() => {
            gallery.querySelectorAll("img:not([src])").forEach(img => {
                this.observer.observe(img);
            });
        });

        // 初始化设置
        this.#setLayoutMode(layoutMode);
        this.#setSortMode(sortMode);
        this.#selectItem(this.galleryItems[0]);
    }

    /** 加载(或创建)缩略图 */
    async #loadThumbnail(thumb) {
        if (thumb.src) return;
        const item = thumb.parentNode;
        item.thumbnail = await image.createThumbnail(item.original);
        thumb.src = item.thumbnail;
    }

    /** 移动选择项 */
    #moveItem(direction) {
        if (!this.selectedItem) return;
        const { previousSibling, nextSibling } = this.selectedItem;
        const siblingItem = direction > 0 ? nextSibling : previousSibling;
        if (!siblingItem) return;
        this.#selectItem(siblingItem);
    }

    /** 选中缩略图 */
    #selectItem(item) {
        if (!item) return;
        this.#unselect();
        this.selectedItem = item;

        // 将选中项置于可见区域
        item.classList.add("selected");
        item.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest"
        });

        // 更新标题栏
        const total = this.galleryItems.length;
        const { width, height, size, original } = item;
        const filename = original.split(/[\\/]/).pop();
        fileInfo.innerHTML = `${item.index() + 1}/${total}　|　${filename}`;
        imageInfo.innerHTML = `${width} × ${height}　|　${formatBytes(size)}`;
    }

    /** 取消选中状态 */
    #unselect() {
        const selected = gallery.querySelector(".selected");
        selected && selected.classList.remove("selected");
        this.selectedItem = null;
        fileInfo.innerHTML = "";
        imageInfo.innerHTML = "";
        scaleInfo.innerHTML = "";
    }

    /** 设置布局方式 */
    #setLayoutMode(mode) {
        gallery.className = "gallery " + mode;
    }

    /** 设置排序方式 */
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