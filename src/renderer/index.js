import { $ } from "../main/utils.js";
import thumbnail from "./thumbnail.js";
import { Tree } from "./tree.js";

const dragger = $(".dragger");
const sidebar = $('aside');
const openBtn = $('#open-btn');
const sidebarBtn = $('#sidebar-btn');
const closeBtn = $("#close-btn");
const minimizeBtn = $("#minimize-btn");
const maximizeBtn = $("#maximize-btn");
const header = $("header");

const picturePaths = await electron.getDefaultFolders();
thumbnail.render(picturePaths);

const entry = await electron.readFilePaths(picturePaths);
console.log(entry.folders);
const data = await electron.buildTreeData(entry.folders);
console.log(data);

const tree = new Tree('.folders');
tree.render(data);

closeBtn.onclick = () => electron.closeWindow();
minimizeBtn.onclick = () => electron.minimizeWindow();
maximizeBtn.onclick = () => electron.toggleWindow();

if (electron.platform !== "darwin") {
    document.body.classList.add("rounded-border");
}

openBtn.onclick = async function() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        thumbnail.render(filePaths);
        electron.updateConfig("picture_folders", filePaths);
    }
}

sidebarBtn.onclick = function() {
    sidebar.style.transition = "all .2s"
    sidebar.classList.toggle("hidden");
    sidebar.ontransitionend = function() {
        sidebar.style.transition = null;
    }
}

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
};