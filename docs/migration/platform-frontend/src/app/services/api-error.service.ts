import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { extractErrorCode, extractErrorMessage } from '../shared/utils/request-state';

/**
 * Structured error parsed from backend API responses.
 *
 * Backend services use two error shapes:
 *   identity-service:   { error: { code, message, details } }
 *   permission-service: { error, message, request_id }
 *
 * This interface normalizes both into a single shape.
 */
export interface ApiError {
  /** Machine-readable error code (e.g. "USER_ALREADY_EXISTS", "VALIDATION_ERROR") */
  code: string;
  /** Human-readable message from the backend */
  message: string;
  /** HTTP status code */
  status: number;
}

/**
 * Maps backend error codes to i18n translation keys.
 *
 * Components can use these keys with a translation service to display
 * localized error messages. Keys follow the pattern: errors.<code>
 */
const ERROR_CODE_TO_I18N: Record<string, string> = {
  // Identity-service user errors
  USER_ALREADY_EXISTS: 'errors.userAlreadyExists',
  USERNAME_TAKEN: 'errors.usernameTaken',
  EMAIL_TAKEN: 'errors.emailTaken',
  USER_CREATION_FAILED: 'errors.userCreationFailed',

  // Password policy errors
  PASSWORD_TOO_SHORT: 'errors.passwordTooShort',
  PASSWORD_NEEDS_SPECIAL_CHAR: 'errors.passwordNeedsSpecialChar',
  PASSWORD_NEEDS_UPPERCASE: 'errors.passwordNeedsUppercase',
  PASSWORD_NEEDS_LOWERCASE: 'errors.passwordNeedsLowercase',
  PASSWORD_NEEDS_DIGIT: 'errors.passwordNeedsDigit',
  PASSWORD_IN_HISTORY: 'errors.passwordInHistory',
  PASSWORD_IS_USERNAME: 'errors.passwordIsUsername',
  PASSWORD_POLICY_VIOLATION: 'errors.passwordPolicyViolation',

  // Authorization errors
  ORGANIZATION_ACCESS_DENIED: 'errors.organizationAccessDenied',
  CROSS_ORG_WRITE_DENIED: 'errors.crossOrgWriteDenied',

  // Generic
  VALIDATION_ERROR: 'errors.validationError',
  NOT_FOUND: 'errors.notFound',
  CONFLICT: 'errors.conflict',
  INVALID_CLEARANCE_LEVEL: 'errors.invalidClearanceLevel',
};

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  /**
   * Parse an HttpErrorResponse into a structured ApiError.
   *
   * Delegates to the shared extractErrorCode/extractErrorMessage utilities
   * which handle all backend error shapes (identity-service, permission-service,
   * FastAPI validation errors).
   */
  parse(error: HttpErrorResponse): ApiError {
    return {
      code: extractErrorCode(error) ?? `HTTP_${error.status}`,
      message: extractErrorMessage(error),
      status: error.status,
    };
  }

  /**
   * Get the i18n translation key for an error code.
   * Returns a generic key if no specific mapping exists.
   */
  getTranslationKey(error: ApiError): string {
    return ERROR_CODE_TO_I18N[error.code] ?? `errors.${error.code}`;
  }

  /**
   * Get a user-friendly display message for an error.
   * Falls back to the backend message if no i18n mapping exists.
   */
  getDisplayMessage(error: ApiError): string {
    // For now, return the backend message directly.
    // When an i18n service is integrated, this should look up the translation key.
    return error.message;
  }
}
