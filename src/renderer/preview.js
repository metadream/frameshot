import { $ } from "../main/utils.js";

const preview = $(".preview");

/** 预览区域 */
export default new class Preview {

    constructor() {
        preview.addEventListener("click", e => {
            preview.classList.remove("opened");
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
        preview.classList.add("opened");
        preview.innerHTML = `<img src="${thumbnail.src}"/>`;
    }
}