window.$ = function(selector) {
    selector = selector.replace("/\n/mg", "").trim();
    if (selector.startsWith("<")) {
        return document.createRange().createContextualFragment(selector).firstChild;
    }
    return document.querySelector(selector);
}

$("#open-btn").onclick = async function() {
    const { canceled, filePaths } = await electron.openFileDialog();
    if (!canceled && filePaths && filePaths.length >= 1) {
        console.log(filePaths);

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