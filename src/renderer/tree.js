import { $ } from "../main/utils.js";

/** 树形组件 */
export class Tree {

    onClickNode = null;  // 点击节点名称触发事件
    onLoadNodes = null;  // 展开子节点触发事件

    constructor(selector) {
        this.root = $(`<ul class="tree-root"></ul>`);
        $(selector).append(this.root);
    }

    /** 渲染整棵树 */
    render(data) {
        this.root.innerHTML = "";
        if (data && data.length) data.forEach(nd => {
            this.root.append(this.createNode(nd));
        });
    }

    /** 创建树节点 { name, path, children, hasChildren }*/
    createNode(nodeData) {
        const treeNode = $(`<li class="tree-node"></li>`)
        const treeItem = $(`<div class="tree-item"></div>`)
        const nodeIcon = $(`<svg class="tree-node-icon" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`);
        const nodeName = $(`<span class="tree-node-name">${nodeData.name}</span>`);

        // 点击节点名称切换样式、触发事件
        nodeName.addEventListener("click", e => {
            e.stopPropagation();
            const allItems = this.root.querySelectorAll(".tree-item");
            allItems.forEach(el => el.classList.remove("active"));
            treeItem.classList.add("active");
            this.onClickNode && this.onClickNode(nodeData);
        });

        // 创建小图标
        const toggleIcon = this.createToggleIcon(treeNode, nodeData);
        treeItem.append(toggleIcon);
        treeItem.append(nodeIcon);
        treeItem.append(nodeName);
        treeNode.append(treeItem);

        // 创建子节点
        if (nodeData.children && nodeData.children.length > 0) {
            const ul = $(`<ul class="tree-children" style="max-height:0"></ul>`)
            treeNode.append(ul);

            nodeData.children.forEach(child => {
                ul.append(this.createNode(child));
            });
        }
        return treeNode;
    }

    /** 创建展开/收缩图标 */
    createToggleIcon(treeNode, nodeData) {
        const toggleIcon = $(`<div class="tree-toggle-icon"></div`);

        // hasChildren: 节点数据中有子节点但未获取具体值
        // children: 节点数据中已经包含具体的子节点
        if (nodeData.hasChildren || (nodeData.children && nodeData.children.length > 0)) {
            toggleIcon.append($(`<svg viewBox="0 0 24 24" fill="#666"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"></path></svg>`));
            toggleIcon.classList.add("collapsed");

            toggleIcon.addEventListener("click", async e => {
                e.stopPropagation();

                let treeChildren = treeNode.querySelector(".tree-children");
                if (!treeChildren) {
                    treeChildren = $(`<ul class="tree-children" style="max-height:0"></ul>`);
                    treeNode.append(treeChildren);
                }

                if (toggleIcon.classList.contains("collapsed")) {
                    toggleIcon.classList.remove("collapsed");
                    toggleIcon.classList.add("expanded");

                    // 对于有子节点但未加载数据的情况
                    if (treeChildren.children.length === 0 && this.onLoadNodes) {
                        const childData = await this.onLoadNodes(nodeData);
                        if (childData && childData.length > 0) {
                            childData.forEach(nd => treeChildren.append(this.createNode(nd)));
                        }
                    }

                    treeChildren.style.maxHeight = treeChildren.scrollHeight + "px";
                    setTimeout(() => {
                        treeChildren.style.maxHeight = "none";
                    }, 300);
                } else {
                    toggleIcon.classList.remove("expanded");
                    toggleIcon.classList.add("collapsed");
                    treeChildren.style.maxHeight = treeChildren.scrollHeight + "px";

                    setTimeout(() => {
                        treeChildren.style.maxHeight = "0";
                    }, 0);
                }
            });
        } else {
            toggleIcon.classList.add("hidden");
        }
        return toggleIcon;
    }

}