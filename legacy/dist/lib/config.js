import * as fs from 'node:fs';
import * as os from 'node:os';
import { join } from 'node:path';
import { ConfigSchema } from './validation.js';
const CONFIG_FILE = '.togrc';
// Allow overriding config path for testing
let configPath;
export function setConfigPath(path) {
    configPath = path;
}
function getConfigPath() {
    return configPath || join(os.homedir(), CONFIG_FILE);
}
export function configExists() {
    return fs.existsSync(getConfigPath());
}
export function loadConfig() {
    try {
        const configPath = getConfigPath();
        if (!fs.existsSync(configPath)) {
            return null;
        }
        const data = fs.readFileSync(configPath, 'utf8');
        const parsed = JSON.parse(data);
        // Use assertion for validation - let caller handle errors
        return ConfigSchema.assert(parsed);
    }
    catch {
        return null;
    }
}
export function saveConfig(config) {
    const configPath = getConfigPath();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}
export function deleteConfig() {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
    }
}
export function getConfigFilePath() {
    return `~/${CONFIG_FILE}`;
}
