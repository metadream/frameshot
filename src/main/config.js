import path from "path";
import fs from "fs";
import { app } from "electron";

const configPath = app.getPath('userData');
const configFile = path.join(configPath, 'config.json');

export function getConfig(key) {
    const config = loadConfig();
    return config[key];
}

export function loadConfig() {
    try {
        if (fs.existsSync(configFile)) {
            const data = fs.readFileSync(configFile, 'utf-8');
            return JSON.parse(data);
        }
        return {};
    } catch (e) {
        return {};
    }
}

export function updateConfig(key, value) {
    const config = loadConfig();
    config[key] = value;
    saveConfig(config);
}

export function saveConfig(config) {
    try {
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {
        console.error("Save config failed: ", e);
    }
}