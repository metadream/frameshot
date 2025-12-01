import { $ } from "../main/utils.js";
import { list } from "./thumb.js";

$("#open-btn").onclick = async function() {
    const { canceled, filePaths } = await electron.openFileDialog();
    if (!canceled && filePaths && filePaths.length >= 1) {
        list(filePaths);

        // const buffer = await electron.getThumbnail(filePaths[0]);
        //
        // const blob = new Blob([buffer], { type: 'image/jpeg' });
        // const url = URL.createObjectURL(blob);
        // console.log(url);
        //
        // const thumbUrls = [url];
        // for (const url of thumbUrls) {
        //     const item = $(`<div><img src="${url}"/><div>`);
        //     $(".thumbnails").append(item);
        //     $(".thumbnails").append($(`<div><img src="${url}"/><div>`));
        //     $(".thumbnails").append($(`<div><img src="${url}"/><div>`));
        //     $(".thumbnails").append($(`<div><img src="${url}"/><div>`));
        //     $(".thumbnails").append($(`<div><img src="${url}"/><div>`));
        //     // URL.revokeObjectURL(url);
        // }
    }
}