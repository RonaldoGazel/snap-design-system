import { WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

import { extractErrorMessage } from './request-state';

/**
 * Signals that a page component must expose for centralized error handling.
 *
 * Every admin page that uses handleHttpError should have these signals.
 */
export interface ErrorSignals {
  errorMessage: WritableSignal<string | null>;
  errorSeverity: WritableSignal<'error' | 'warn'>;
  /** showRetry or showReload — controls the retry/reload button visibility */
  showRetry: WritableSignal<boolean>;
  /** Optional: set to true to show the forbidden view */
  forbidden?: WritableSignal<boolean>;
  /** Optional: set to true to show the not-found view */
  notFound?: WritableSignal<boolean>;
}

/**
 * Configuration for the error handler, scoped to a specific admin domain.
 */
export interface ErrorHandlerConfig {
  /** i18n key prefix for this domain (e.g. 'admin.users', 'admin.roles') */
  i18nPrefix: string;
  /** TranslateService instance for looking up i18n keys */
  translate: TranslateService;
}

/**
 * Centralized HTTP error handler for admin page components.
 *
 * Replaces the duplicated `private handleError()` methods across all
 * admin pages with a single, consistent implementation.
 *
 * Handles:
 *   - 403 → sets forbidden signal
 *   - 404 → sets notFound signal
 *   - 400/422 → extracts message safely (no [Object Object])
 *   - 409 → extracts message, sets warn severity
 *   - 503 → service unavailable with retry
 *   - 0/other → network error with retry
 *
 * Usage:
 * ```ts
 * private readonly errorHandler = createErrorHandler(
 *   { errorMessage, errorSeverity, showRetry, forbidden, notFound },
 *   { i18nPrefix: 'admin.users', translate: this.translate },
 * );
 *
 * // In subscribe error callback:
 * error: (err) => this.errorHandler(err)
 * ```
 */
export function createErrorHandler(
  signals: ErrorSignals,
  config: ErrorHandlerConfig,
): (err: HttpErrorResponse) => void {
  return (err: HttpErrorResponse): void => {
    if (err.status === 403) {
      if (signals.forbidden) {
        signals.forbidden.set(true);
      } else {
        signals.errorMessage.set('Forbidden');
        signals.errorSeverity.set('error');
        signals.showRetry.set(false);
      }
      return;
    }

    if (err.status === 404) {
      if (signals.notFound) {
        signals.notFound.set(true);
      } else {
        signals.errorMessage.set('Not found');
        signals.errorSeverity.set('error');
        signals.showRetry.set(false);
      }
      return;
    }

    if (err.status === 400 || err.status === 422) {
      const message = extractErrorMessage(
        err,
        config.translate.instant(`${config.i18nPrefix}.error.badRequest`),
      );
      signals.errorMessage.set(message);
      signals.errorSeverity.set('error');
      signals.showRetry.set(false);
      return;
    }

    if (err.status === 409) {
      const message = extractErrorMessage(
        err,
        config.translate.instant(`${config.i18nPrefix}.error.badRequest`),
      );
      signals.errorMessage.set(message);
      signals.errorSeverity.set('warn');
      signals.showRetry.set(false);
      return;
    }

    if (err.status === 503) {
      signals.errorMessage.set(
        config.translate.instant(`${config.i18nPrefix}.error.serviceUnavailable`),
      );
      signals.errorSeverity.set('warn');
      signals.showRetry.set(true);
      return;
    }

    // Network error (status 0) or unknown
    signals.errorMessage.set(
      config.translate.instant(`${config.i18nPrefix}.error.networkError`),
    );
    signals.errorSeverity.set('error');
    signals.showRetry.set(true);
  };
}
