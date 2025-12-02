import { $ } from "../main/utils.js";
import thumbnail from "./thumbnail.js";

const picturePaths = await electron.getPicturePaths();
thumbnail.render(picturePaths);

$("#open-btn").onclick = async function() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        thumbnail.render(filePaths);
        electron.updateConfig("picture_paths", filePaths);
    }
}