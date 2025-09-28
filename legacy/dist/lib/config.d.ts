import { ConfigSchema } from './validation.js';
export type TogglConfig = typeof ConfigSchema.infer;
export declare function setConfigPath(path: string | undefined): void;
export declare function configExists(): boolean;
export declare function loadConfig(): null | TogglConfig;
export declare function saveConfig(config: TogglConfig): void;
export declare function deleteConfig(): void;
export declare function getConfigFilePath(): string;
