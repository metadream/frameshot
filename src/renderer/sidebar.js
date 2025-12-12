import { $ } from "../main/utils.js";
import { Tree } from "./tree.js";
import gallery from "./gallery.js";

const sidebar = $("aside");
const dragger = $(".dragger");
const closeBtn = $("#close-btn");
const minimizeBtn = $("#minimize-btn");
const maximizeBtn = $("#maximize-btn");
const openBtn = $("#open-btn");
const toggleBtn = $("#toggle-btn");
const showSidebar = await electron.getConfig("show_sidebar");

/** 侧边栏区域 */
export default new class Sidebar {

    constructor() {
        // 构建目录树
        this.tree = new Tree(".folders");
        this.tree.onClickNode = nodeData => {
            gallery.render(nodeData.path);
        }
        this.tree.onLoadNodes = async (nodeData) => {
            return await electron.readFolder(nodeData.path);
        }

        // 模拟Mac交通灯按钮
        closeBtn.onclick = () => electron.closeWindow();
        minimizeBtn.onclick = () => electron.minimizeWindow();
        maximizeBtn.onclick = () => electron.toggleWindow();

        // 打开文件夹按钮
        openBtn.onclick = async () => {
            const { filePaths } = await electron.openFileDialog();
            if (filePaths && filePaths.length >= 1) {
                this.render(filePaths);
                gallery.render(filePaths[0])
                electron.updateConfig("picture_folders", filePaths);
            }
        }

        // 切换侧边栏按钮
        toggleBtn.onclick = function() {
            sidebar.style.transition = "all .2s"
            sidebar.classList.toggle("hidden");
            sidebar.ontransitionend = function() {
                sidebar.style.transition = null;
            }
            electron.updateConfig("show_sidebar", !sidebar.classList.contains("hidden"));
        }

        showSidebar ? sidebar.classList.remove("hidden") : sidebar.classList.add("hidden");

        // 拖动侧边栏把手
        dragger.onmousedown = function(e) {
            const clientX = e.clientX;
            const offsetLeft = dragger.offsetLeft;
            document.body.classList.add("dragging");

            document.onmousemove = function(e) {
                const distance = offsetLeft + (e.clientX - clientX);
                sidebar.style.width = distance + "px";
                return false;
            };

            document.onmouseup = function() {
                document.onmousemove = null;
                document.onmouseup = null;
                document.body.classList.remove("dragging");
            };
            return false;
        }
    }

    /** 渲染侧边栏和展示区 */
    async render(folders) {
        const roots = await electron.readFolders(folders);
        this.tree.render(roots);
    }
}