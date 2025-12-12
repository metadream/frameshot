# FrameShot

- 右键菜单：预览、转换为：png/jpg、复制到、移动到 、删除
- 相似度？

- 大图片预览卡顿 如果使用ontransitionend，compare情况下无法加载原图
- 访问smb目录卡顿: tree loading

双击打开图片太慢（需先加载缩略图、再滚动到指定item才能打开）
如果第一个应用没有打开预览，第二次无法预览
默认选中侧边栏第一个目录

```
ipcMain.handle("read-folders", async (event, folders, maxDepth = 0) => {
    return folders.map(folder => {
        const build = (p, depth) => {
            const node = { name: path.basename(p), path: p };

            if (maxDepth === 0 || depth < maxDepth) {
                const entries = fs.readdirSync(p, { withFileTypes: true })
                                  .filter(entry => entry.isDirectory())
                                  .map(entry => build(path.join(p, entry.name), depth + 1))
                                  .sort((a, b) => a.name.localeCompare(b.name));
                if (entries.length > 0) {
                    node.children = entries;
                }
            }
            return node;
        };
        return build(folder, 0);
    });
});
```