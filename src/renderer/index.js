import { $ } from "../main/utils.js";
import thumbnail from "./thumbnail.js";
import { Tree } from "./tree.js";

const directoryData = [
    {
        name: "项目文档",
        children: [
            {
                name: "需求分析", children: [
                    { name: "用户需求.md" },
                    { name: "功能规格.md" }
                ]
            },
            {
                name: "设计文档", children: [
                    { name: "系统架构.md" },
                    { name: "数据库设计.md" },
                    {
                        name: "UI设计", children: [
                            { name: "首页设计.psd" },
                            { name: "用户界面.sketch" }
                        ]
                    }
                ]
            },
            {
                name: "测试报告", children: [
                    { name: "单元测试.pdf" },
                    { name: "集成测试.pdf" }
                ]
            }
        ]
    },
    {
        name: "开发代码",
        children: [
            {
                name: "前端", children: [
                    {
                        name: "src", children: [
                            { name: "components" },
                            { name: "utils" },
                            { name: "assets" }
                        ]
                    },
                    { name: "public" },
                    { name: "package.json" }
                ]
            },
            {
                name: "后端", children: [
                    {
                        name: "api", children: [
                            { name: "controllers" },
                            { name: "routes" }
                        ]
                    },
                    { name: "models" },
                    { name: "config" }
                ]
            }
        ]
    },
    {
        name: "个人资料",
        children: [
            { name: "照片" },
            {
                name: "文档", children: [
                    { name: "简历.pdf" },
                    { name: "证书" }
                ]
            }
        ]
    }
];

const tree = new Tree('.folders');
tree.render(directoryData);

const dragger = $(".dragger");
const sidebar = $('aside');
const openBtn = $('#open-btn');
const sidebarBtn = $('#sidebar-btn');
const closeBtn = $("#close-btn");
const minimizeBtn = $("#minimize-btn");
const maximizeBtn = $("#maximize-btn");
const header = $("header");

const picturePaths = await electron.getPicturePaths();
thumbnail.render(picturePaths);

closeBtn.onclick = () => electron.closeWindow();
minimizeBtn.onclick = () => electron.minimizeWindow();
maximizeBtn.onclick = () => electron.toggleWindow();
header.ondblclick = e => {
    if (e.target.closest('button')) return;
    electron.toggleWindow();
}

openBtn.onclick = async function() {
    const { filePaths } = await electron.openFileDialog();
    if (filePaths && filePaths.length >= 1) {
        thumbnail.render(filePaths);
        electron.updateConfig("picture_paths", filePaths);
    }
}

sidebarBtn.onclick = function() {
    sidebar.style.transition = "all .2s"
    sidebar.classList.toggle("hidden");
    sidebar.ontransitionend = function() {
        sidebar.style.transition = null;
    }
}

dragger.onmousedown = function(e) {
    const clientX = e.clientX;
    const offsetLeft = dragger.offsetLeft;
    document.body.classList.add("dragging");

    document.onmousemove = function(e) {
        const distance = offsetLeft + (e.clientX - clientX);
        sidebar.style.width = distance + "px";
        return false;
    };

    document.onmouseup = function() {
        document.onmousemove = null;
        document.onmouseup = null;
        document.body.classList.remove("dragging");
    };
    return false;
};