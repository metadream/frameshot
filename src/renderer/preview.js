import { $ } from "../main/utils.js";

const container = $(".preview");

/** 预览区域 */
export default new class Preview {

    constructor() {
        container.addEventListener("click", e => {
            container.classList.remove("show");
        });

        // document.addEventListener("keyup", e => {
        //     e.preventDefault();
        //     switch (e.code) {
        //         case "ArrowLeft":
        //             console.log("left")
        //             break;
        //         case "ArrowRight":
        //             console.log("right")
        //             break;
        //     }
        // });
    }

    render(thumbnail) {
        container.classList.add("show");
        container.innerHTML = `<img src="${thumbnail.src}"/>`;
    }
}