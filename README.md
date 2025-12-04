# Image-Scope

- 侧边栏显示目录，原本存在后被删除测试
- 无图片时显示背景图
- 点击缩略图动画弹出原图
- 原图缩放
- 预览界面：上一张下一张 ;缩略图界面：上下左右选中
- 自定义标题栏（图标细线条）：列表/宫格，排序：时间/名称/相似度？
- 重新选择文件后缩略图失去选中样式
- 右键打开文件选择当前app
- 拖动文件到窗体？
- 复制粘贴

- 窗体圆角边框 —— windows 测试

<svg class="folder-icon" viewBox="0 0 24 24" fill="#666">
    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"></path>
</svg>

```json
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
```