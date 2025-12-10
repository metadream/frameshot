import path from "path";
import fs from "fs";
import { app } from "electron";

// 配置文件路径
const configPath = app.getPath("userData");
const configFile = path.join(configPath, "config.json");

// 默认配置项
const config = {
    show_sidebar: true,
    layout_mode: "grid",
    picture_folders: [app.getPath("pictures")],
    sort_mode: ["name", "asc"]
}
// 自动加载配置
loadConfig();

/** 根据配置项获取值 */
export function getConfig(key) {
    return config[key];
}

/** 更新配置文件的某项 */
export function updateConfig(key, value) {
    config[key] = value;
    saveConfig(config);
}

/** 加载配置文件 (不存在则创建) */
function loadConfig() {
    try {
        if (fs.existsSync(configFile)) {
            const customConfig = JSON.parse(fs.readFileSync(configFile, "utf-8"));
            Object.assign(config, customConfig);
        } else {
            saveConfig(config);
        }
    } catch (e) {
    }
}

/** 保存配置数据到文件 */
function saveConfig(data) {
    try {
        fs.writeFileSync(configFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
        console.error("Save config failed: ", e);
    }
}