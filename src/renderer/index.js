import { $ } from "../main/utils.js";
import thumbnail from "./thumbnail.js";

$("#open-btn").onclick = async function() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        await thumbnail.render(filePaths);
    }
}