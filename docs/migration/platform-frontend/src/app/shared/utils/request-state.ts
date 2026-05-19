import { computed, signal, Signal, WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';

export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface RequestState<T> {
  status: RequestStatus;
  data: T | null;
  error: string | null;
  retryable: boolean;
}

/** Create a new RequestState signal initialized to idle. */
export function createRequestState<T>(): WritableSignal<RequestState<T>> {
  return signal<RequestState<T>>({
    status: 'idle',
    data: null,
    error: null,
    retryable: false,
  });
}

/**
 * Execute an Observable request, managing the RequestState lifecycle.
 *
 * Double-submission guard: if status is already 'loading', returns Subscription.EMPTY (no-op).
 * On success: sets status to 'success', stores data, calls onSuccess callback.
 * On error: classifies HTTP status → error message + retryable flag, calls onError callback.
 */
export function executeRequest<T>(
  state: WritableSignal<RequestState<T>>,
  request$: Observable<T>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (err: HttpErrorResponse) => void;
  },
): Subscription {
  if (state().status === 'loading') {
    return Subscription.EMPTY;
  }

  state.set({ status: 'loading', data: null, error: null, retryable: false });

  return request$.subscribe({
    next: (result) => {
      state.set({ status: 'success', data: result, error: null, retryable: false });
      options?.onSuccess?.(result);
    },
    error: (err: HttpErrorResponse) => {
      state.set(classifyError(err));
      options?.onError?.(err);
    },
  });
}

/** Reset state to idle. */
export function resetRequestState<T>(state: WritableSignal<RequestState<T>>): void {
  state.set({ status: 'idle', data: null, error: null, retryable: false });
}

/** Derived signal: true when status is 'loading'. */
export function isLoading<T>(state: Signal<RequestState<T>>): Signal<boolean> {
  return computed(() => state().status === 'loading');
}

/** Derived signal: true when status is 'error'. */
export function isError<T>(state: Signal<RequestState<T>>): Signal<boolean> {
  return computed(() => state().status === 'error');
}

/** Derived signal: true when data is not null. */
export function hasData<T>(state: Signal<RequestState<T>>): Signal<boolean> {
  return computed(() => state().data !== null);
}

/**
 * Extract a human-readable error message from an HttpErrorResponse.
 *
 * Handles all backend error shapes:
 *   - FastAPI 422 validation: { detail: [{loc, msg, type}] }
 *   - FastAPI string detail: { detail: "..." }
 *   - identity-service structured: { error: { code, message, details } }
 *   - permission-service flat: { error: "...", message: "..." }
 *
 * This is the single source of truth for error message extraction.
 * Used by classifyError internally and exported for components that
 * handle errors outside of executeRequest.
 */
export function extractErrorMessage(err: HttpErrorResponse, fallback = 'Unknown error'): string {
  const body = err.error;
  if (!body) return fallback;

  // identity-service structured: { error: { code, message, details } }
  if (body.error && typeof body.error === 'object' && 'code' in body.error) {
    return body.error.message ?? body.error.code ?? fallback;
  }

  // permission-service flat: { error: "...", message: "..." }
  if (body.error && typeof body.error === 'string' && body.message) {
    return body.message;
  }

  // FastAPI detail field
  const detail = body.detail;
  if (typeof detail === 'string') {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: string[]; msg?: string }) => {
        const field = d.loc?.slice(-1)[0] ?? '';
        const msg = d.msg ?? '';
        return field ? `${field}: ${msg}` : msg;
      })
      .join('; ');
  }

  // Plain message field
  if (typeof body.message === 'string') {
    return body.message;
  }

  return fallback;
}

/**
 * Extract the machine-readable error code from an HttpErrorResponse.
 *
 * Returns the error code string if present, or null.
 * Useful for mapping to i18n keys or special-casing specific errors.
 */
export function extractErrorCode(err: HttpErrorResponse): string | null {
  const body = err.error;
  if (!body) return null;

  // identity-service structured: { error: { code } }
  if (body.error && typeof body.error === 'object' && 'code' in body.error) {
    return body.error.code ?? null;
  }

  // permission-service flat: { error: "CODE" }
  if (body.error && typeof body.error === 'string') {
    return body.error;
  }

  // FastAPI 422 string detail is often an error code (e.g. "INVALID_CLEARANCE_LEVEL")
  if (typeof body.detail === 'string' && /^[A-Z_]+$/.test(body.detail)) {
    return body.detail;
  }

  return null;
}

function classifyError<T>(err: HttpErrorResponse): RequestState<T> {
  const base = { status: 'error' as const, data: null };

  switch (err.status) {
    case 403:
      return { ...base, error: 'Forbidden', retryable: false };
    case 404:
      return { ...base, error: 'Not found', retryable: false };
    case 400:
    case 422:
      return { ...base, error: extractErrorMessage(err, 'Invalid request'), retryable: false };
    case 409:
      return { ...base, error: extractErrorMessage(err, 'Conflict'), retryable: false };
    case 503:
      return { ...base, error: 'Service unavailable', retryable: true };
    case 0:
      return { ...base, error: 'Network error', retryable: true };
    default:
      return { ...base, error: 'Unexpected error', retryable: true };
  }
}
