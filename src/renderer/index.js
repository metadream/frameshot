import { $ } from "../main/utils.js";
import thumbnail from "./thumbnail.js";

const dragger = $(".dragger");
const sidebar = $('aside');
const openBtn = $('#open-btn');

const picturePaths = await electron.getPicturePaths();
thumbnail.render(picturePaths);

openBtn.onclick = async function() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        thumbnail.render(filePaths);
        electron.updateConfig("picture_paths", filePaths);
    }
}

dragger.onmousedown = function(e) {
    const clientX = e.clientX;
    const offsetLeft = dragger.offsetLeft;

    document.onmousemove = function(e) {
        const distance = offsetLeft + (e.clientX - clientX);
        sidebar.style.width = distance + "px";
        return false;
    };

    document.onmouseup = function() {
        document.onmousemove = null;
        document.onmouseup = null;
    };
    return false;
};