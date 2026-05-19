// ---------------------------------------------------------------------------
// Application Constants
// ---------------------------------------------------------------------------

// -- File Upload -----------------------------------------------------------

/** Allowed file extensions for attachment uploads. */
export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx', '.jpg', '.png', '.gif'] as const;

/** Allowed MIME types for attachment uploads. */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
] as const;

/** Maximum file size in bytes (50 MB). */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 52 428 800

/** Human-readable maximum file size label. */
export const MAX_FILE_SIZE_LABEL = '50 MB';

// -- Password Complexity ---------------------------------------------------

/**
 * Password must contain at least 8 characters, including:
 *  - 1 uppercase letter
 *  - 1 lowercase letter
 *  - 1 digit
 *  - 1 special character
 */
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

/** Minimum password length (kept in sync with PASSWORD_REGEX). */
export const MIN_PASSWORD_LENGTH = 8;

// -- Storage Keys ----------------------------------------------------------

/** localStorage key for the authentication token. */
export const STORAGE_KEY_TOKEN = 'snap_apolo_token';

/** localStorage key for the current user object. */
export const STORAGE_KEY_USER = 'snap_apolo_user';

// -- API -------------------------------------------------------------------

/**
 * Base URL for the backend API.
 * In production this should come from environment configuration;
 * the constant serves as the default / fallback.
 */
export const API_BASE_URL = '/api';
