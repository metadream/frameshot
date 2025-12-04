import path from "path";
import fs from "fs";
import { app } from "electron";

// 配置文件路径
const configPath = app.getPath("userData");
const configFile = path.join(configPath, "config.json");

/** 根据配置项获取值 */
export function getConfig(key) {
    const config = loadConfig();
    return config[key];
}

/** 加载配置文件为JSON对象 */
export function loadConfig() {
    try {
        if (fs.existsSync(configFile)) {
            const data = fs.readFileSync(configFile, "utf-8");
            return JSON.parse(data);
        }
        return {};
    } catch (e) {
        return {};
    }
}

/** 更新配置文件的某项 */
export function updateConfig(key, value) {
    const config = loadConfig();
    config[key] = value;
    saveConfig(config);
}

/** 保存配置数据到文件 */
export function saveConfig(config) {
    try {
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf-8");
    } catch (e) {
        console.error("Save config failed: ", e);
    }
}