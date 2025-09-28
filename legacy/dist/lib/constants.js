/**
 * Application constants used throughout the codebase.
 * Centralizes magic numbers and repeated values for better maintainability.
 */
// Time conversion constants
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3600;
export const MILLISECONDS_PER_SECOND = 1000;
// API and validation constants
export const MIN_API_TOKEN_LENGTH = 32;
export const MAX_DESCRIPTION_LENGTH = 200;
export const MAX_SEARCH_PAGE_SIZE = 1000;
// Cache configuration constants
export const DEFAULT_CACHE_MAX_ENTRIES = 1000;
export const DEFAULT_CACHE_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const CACHE_FILE_SYNC_DEBOUNCE_MS = 1000;
// HTTP status codes
export const HTTP_STATUS = {
    FORBIDDEN: 403,
    TOO_MANY_REQUESTS: 429,
    UNAUTHORIZED: 401
};
// Date constants
export const TOGGL_FOUNDED_YEAR = 2006;
export const TOGGL_FOUNDED_DATE = '2006-01-01';
// Time formatting constants
export const TIME_FORMAT_PADDING_LENGTH = 2;
export const TIME_FORMAT_PAD_CHAR = '0';
export const DEFAULT_TIME_FORMAT = '00:00:00';
