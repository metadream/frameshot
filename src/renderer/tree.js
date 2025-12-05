import { $ } from "../main/utils.js";

/** 树形组件 */
export class Tree {
    constructor(selector) {
        this.root = $('<ul class="tree-root"></ul>');
        $(selector).append(this.root);
    }

    /** 渲染整棵树 */
    render(data) {
        this.root.innerHTML = "";
        if (!data || !data.length) return;

        data.forEach(item => {
            this.root.append(this.createNode(item));
        });
    }

    /** 创建树节点 */
    createNode(item, path = "") {
        const currentPath = path ? `${path}/${item.name}` : item.name;
        const treeNode = $('<li class="tree-node"></li>')
        const treeItem = $('<div class="tree-item"></div>')
        const nodeIcon = $('<svg class="tree-node-icon" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>');
        const nodeName = $(`<span class="tree-node-name">${item.name}</span>`);

        nodeName.addEventListener("click", e => {
            e.stopPropagation();
            const allItems = this.root.querySelectorAll(".tree-item");
            allItems.forEach(el => el.classList.remove("active"));
            treeItem.classList.add("active");

            this.onNodeClick && this.onNodeClick(item);
        });

        const hasChildren = item.children && item.children.length > 0;
        const toggleIcon = this.createToggleIcon(treeNode, hasChildren);
        treeItem.appendChild(toggleIcon);
        treeItem.appendChild(nodeIcon);
        treeItem.appendChild(nodeName);
        treeNode.appendChild(treeItem);

        if (item.children && item.children.length > 0) {
            const ul = $('<ul class="tree-children" style="max-height:0"></ul>')
            treeNode.append(ul);

            item.children.forEach(child => {
                ul.append(this.createNode(child, currentPath));
            });
        }
        return treeNode;
    }

    /** 创建展开/收缩图标 */
    createToggleIcon(treeNode, hasChildren) {
        const toggleIcon = $('<div class="tree-toggle-icon"></div');
        if (hasChildren) {
            toggleIcon.append($('<svg viewBox="0 0 24 24" fill="#666"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>'));
            toggleIcon.classList.add("collapsed");

            toggleIcon.addEventListener("click", function(e) {
                e.stopPropagation();

                const children = treeNode.querySelector(".tree-children");
                if (toggleIcon.classList.contains("collapsed")) {
                    toggleIcon.classList.remove("collapsed");
                    toggleIcon.classList.add("expanded");
                    children.style.maxHeight = children.scrollHeight + "px";

                    setTimeout(() => {
                        children.style.maxHeight = "none";
                    }, 300);
                } else {
                    toggleIcon.classList.remove("expanded");
                    toggleIcon.classList.add("collapsed");
                    children.style.maxHeight = children.scrollHeight + "px";

                    setTimeout(() => {
                        children.style.maxHeight = "0";
                    }, 0);
                }
            });
        } else {
            toggleIcon.classList.add("hidden");
        }
        return toggleIcon;
    }

    /** 自动点击第一个节点 */
    autoClick() {
        const firstNode = this.root.querySelector(".tree-node-name");
        firstNode && firstNode.click();
    }

}