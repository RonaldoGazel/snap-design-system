import { AuthError } from '../models/auth-errors.model';

/**
 * Logs an AuthError following the auth error logging contract.
 *
 * Includes: error.code, error.message, timestamp (ISO 8601), authSessionId (if available).
 * Excludes: tokens, headers, PII, PKCE material.
 */
export function logAuthError(error: AuthError, authSessionId?: string | null): void {
  console.error('[Auth]', {
    code: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
    ...(authSessionId && { authSessionId }),
  });
}
