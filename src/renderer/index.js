import { $ } from "../main/utils.js";
import thumbnail from "./thumbnail.js";

const defaultPath = await electron.getPicturePath();
thumbnail.render([defaultPath]);

$("#open-btn").onclick = async function() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        thumbnail.render(filePaths);
    }
}