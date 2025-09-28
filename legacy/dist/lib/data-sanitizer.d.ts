/**
 * Data sanitizer to prevent sensitive information from being logged
 */
export declare class DataSanitizer {
    private static readonly SENSITIVE_KEYS;
    /**
     * Sanitize data by masking sensitive values
     */
    static sanitize(data: unknown): unknown;
    private static maskSensitive;
}
