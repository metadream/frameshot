export function $(selector) {
    selector = selector.replace("/\n/mg", "").trim();
    if (selector.startsWith("<")) {
        return document.createRange().createContextualFragment(selector).firstChild;
    }
    return document.querySelector(selector);
}

export function formatBytes(bytes) {

}