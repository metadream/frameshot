import { $ } from "../main/utils.js";
import thumbnail from "./thumbnail.js";

const dragger = $(".dragger");
const sidebar = $('aside');
const openBtn = $('#open-btn');
const toggleBtn = $('#toggle-btn');
const closeBtn = $("#close-btn");
const minimizeBtn = $("#minimize-btn");
const maximizeBtn = $("#maximize-btn");
const infoBar = $(".infos");

const picturePaths = await electron.getPicturePaths();
thumbnail.render(picturePaths);

closeBtn.onclick = () => electron.closeWindow();
minimizeBtn.onclick = () => electron.minimizeWindow();
maximizeBtn.onclick = () => electron.toggleWindow();
infoBar.ondblclick = () => electron.toggleWindow();

openBtn.onclick = async function() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        thumbnail.render(filePaths);
        electron.updateConfig("picture_paths", filePaths);
    }
}

toggleBtn.onclick = function() {
    sidebar.style.transition = "all .2s"
    sidebar.classList.toggle("hidden");
    sidebar.ontransitionend = function() {
        sidebar.style.transition = null;
    }
}

dragger.onmousedown = function(e) {
    const clientX = e.clientX;
    const offsetLeft = dragger.offsetLeft;
    dragger.classList.add("dragging");

    document.onmousemove = function(e) {
        const distance = offsetLeft + (e.clientX - clientX);
        sidebar.style.width = distance + "px";
        return false;
    };

    document.onmouseup = function() {
        document.onmousemove = null;
        document.onmouseup = null;
        dragger.classList.remove("dragging");
    };
    return false;
};