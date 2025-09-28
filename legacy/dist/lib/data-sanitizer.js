/**
 * Data sanitizer to prevent sensitive information from being logged
 */
export class DataSanitizer {
    static SENSITIVE_KEYS = [
        'apitoken',
        'api_token',
        'token',
        'password',
        'secret',
        'key',
        'auth',
        'authorization',
    ];
    /**
     * Sanitize data by masking sensitive values
     */
    static sanitize(data) {
        if (typeof data !== 'object' || data === null) {
            return data;
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitize(item));
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = this.SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive));
            if (isSensitive && (typeof value === 'string' || typeof value === 'number')) {
                // Only mask primitive values, not objects
                sanitized[key] = this.maskSensitive(String(value));
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitize(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    static maskSensitive(value) {
        if (value.length <= 4) {
            return '***';
        }
        return `***${value.slice(-4)}`;
    }
}
