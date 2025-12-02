import { $ } from "../main/utils.js";

export default new class Preview {
    constructor() {
        this.container = $(".preview");
        this.container.addEventListener("click", e => {
            this.container.classList.remove("show");
        });

        document.addEventListener("keyup", e => {
            e.preventDefault();
            switch (e.code) {
                case "ArrowLeft":
                    console.log("left")
                    break;
                case "ArrowRight":
                    console.log("right")
                    break;
            }
        });
    }

    render(thumbnail) {
        this.container.classList.add("show");
        this.container.innerHTML = `<img src="${thumbnail.src}"/>`;
    }
}