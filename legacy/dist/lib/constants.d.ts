/**
 * Application constants used throughout the codebase.
 * Centralizes magic numbers and repeated values for better maintainability.
 */
export declare const SECONDS_PER_MINUTE = 60;
export declare const SECONDS_PER_HOUR = 3600;
export declare const MILLISECONDS_PER_SECOND = 1000;
export declare const MIN_API_TOKEN_LENGTH = 32;
export declare const MAX_DESCRIPTION_LENGTH = 200;
export declare const MAX_SEARCH_PAGE_SIZE = 1000;
export declare const DEFAULT_CACHE_MAX_ENTRIES = 1000;
export declare const DEFAULT_CACHE_MAX_FILE_SIZE_BYTES: number;
export declare const CACHE_FILE_SYNC_DEBOUNCE_MS = 1000;
export declare const HTTP_STATUS: {
    readonly FORBIDDEN: 403;
    readonly TOO_MANY_REQUESTS: 429;
    readonly UNAUTHORIZED: 401;
};
export declare const TOGGL_FOUNDED_YEAR = 2006;
export declare const TOGGL_FOUNDED_DATE = "2006-01-01";
export declare const TIME_FORMAT_PADDING_LENGTH = 2;
export declare const TIME_FORMAT_PAD_CHAR = "0";
export declare const DEFAULT_TIME_FORMAT = "00:00:00";
