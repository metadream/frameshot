import { $ } from "../main/utils.js";

const thumbnails = $("main");

export async function list(filePaths) {
    const entry = await electron.readFilePaths(filePaths);
    console.log(entry);

    for (const url of entry.images) {
        const item = $(`<div class="thumb"><img src="${url}"/><div>`);
        thumbnails.append(item);
    }
    bindEvents();
}

function bindEvents() {
    const items = thumbnails.querySelectorAll(".thumb");
    for (const item of items) {
        item.onclick = function() {
            const selected = thumbnails.querySelector(".selected");
            if (selected) selected.classList.remove("selected");
            this.classList.add("selected");
        }
    }
}