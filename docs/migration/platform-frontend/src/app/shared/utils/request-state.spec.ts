import { describe, it, expect, vi } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError, Subject, Subscription } from 'rxjs';

import {
  createRequestState,
  executeRequest,
  resetRequestState,
  isLoading,
  isError,
  hasData,
} from './request-state';

function makeHttpError(status: number, detail?: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status,
    statusText: 'Error',
    error: detail ? { detail } : undefined,
  });
}

describe('RequestState utility', () => {
  describe('createRequestState', () => {
    it('should return idle state', () => {
      const state = createRequestState<string>();
      expect(state()).toEqual({ status: 'idle', data: null, error: null, retryable: false });
    });
  });

  describe('executeRequest — success lifecycle', () => {
    it('should transition idle → loading → success and store data', () => {
      const state = createRequestState<string>();
      const data$ = new Subject<string>();

      executeRequest(state, data$.asObservable());

      expect(state().status).toBe('loading');
      expect(state().data).toBeNull();

      data$.next('result');
      data$.complete();

      expect(state()).toEqual({ status: 'success', data: 'result', error: null, retryable: false });
    });
  });

  describe('executeRequest — error lifecycle', () => {
    it('should map 403 to Forbidden, not retryable', () => {
      const state = createRequestState<string>();
      executeRequest(state, throwError(() => makeHttpError(403)));
      expect(state()).toEqual({ status: 'error', data: null, error: 'Forbidden', retryable: false });
    });

    it('should map 404 to Not found, not retryable', () => {
      const state = createRequestState<string>();
      executeRequest(state, throwError(() => makeHttpError(404)));
      expect(state()).toEqual({ status: 'error', data: null, error: 'Not found', retryable: false });
    });

    it('should map 400 to err.error.detail, not retryable', () => {
      const state = createRequestState<string>();
      executeRequest(state, throwError(() => makeHttpError(400, 'Bad field')));
      expect(state()).toEqual({ status: 'error', data: null, error: 'Bad field', retryable: false });
    });

    it('should map 422 to err.error.detail, not retryable', () => {
      const state = createRequestState<string>();
      executeRequest(state, throwError(() => makeHttpError(422, 'Validation failed')));
      expect(state()).toEqual({
        status: 'error',
        data: null,
        error: 'Validation failed',
        retryable: false,
      });
    });

    it('should map 409 to err.error.detail, not retryable', () => {
      const state = createRequestState<string>();
      executeRequest(state, throwError(() => makeHttpError(409, 'Conflict detected')));
      expect(state()).toEqual({
        status: 'error',
        data: null,
        error: 'Conflict detected',
        retryable: false,
      });
    });

    it('should map 503 to Service unavailable, retryable', () => {
      const state = createRequestState<string>();
      executeRequest(state, throwError(() => makeHttpError(503)));
      expect(state()).toEqual({
        status: 'error',
        data: null,
        error: 'Service unavailable',
        retryable: true,
      });
    });

    it('should map status 0 (network error) to Network error, retryable', () => {
      const state = createRequestState<string>();
      executeRequest(state, throwError(() => makeHttpError(0)));
      expect(state()).toEqual({
        status: 'error',
        data: null,
        error: 'Network error',
        retryable: true,
      });
    });
  });

  describe('executeRequest — double-submission guard', () => {
    it('should return Subscription.EMPTY and make no state change when already loading', () => {
      const state = createRequestState<string>();
      const pending$ = new Subject<string>();

      executeRequest(state, pending$.asObservable());
      expect(state().status).toBe('loading');

      const spy = vi.fn();
      const sub = executeRequest(state, of('ignored').pipe(/* tap would fire */ ), {
        onSuccess: spy,
      });

      expect(sub).toBe(Subscription.EMPTY);
      expect(spy).not.toHaveBeenCalled();
      expect(state().status).toBe('loading');
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback on success', () => {
      const state = createRequestState<number>();
      const onSuccess = vi.fn();

      executeRequest(state, of(42), { onSuccess });

      expect(onSuccess).toHaveBeenCalledWith(42);
    });

    it('should call onError callback on error', () => {
      const state = createRequestState<string>();
      const onError = vi.fn();
      const err = makeHttpError(500);

      executeRequest(state, throwError(() => err), { onError });

      expect(onError).toHaveBeenCalledWith(err);
    });
  });

  describe('resetRequestState', () => {
    it('should return state to idle', () => {
      const state = createRequestState<string>();
      executeRequest(state, of('data'));
      expect(state().status).toBe('success');

      resetRequestState(state);

      expect(state()).toEqual({ status: 'idle', data: null, error: null, retryable: false });
    });
  });

  describe('derived signals', () => {
    it('isLoading should return true only when status is loading', () => {
      const state = createRequestState<string>();
      const loading = isLoading(state);

      expect(loading()).toBe(false);

      const pending$ = new Subject<string>();
      executeRequest(state, pending$.asObservable());
      expect(loading()).toBe(true);

      pending$.next('done');
      pending$.complete();
      expect(loading()).toBe(false);
    });

    it('isError should return true only when status is error', () => {
      const state = createRequestState<string>();
      const error = isError(state);

      expect(error()).toBe(false);

      executeRequest(state, throwError(() => makeHttpError(500)));
      expect(error()).toBe(true);
    });

    it('hasData should return true only when data is not null', () => {
      const state = createRequestState<string>();
      const data = hasData(state);

      expect(data()).toBe(false);

      executeRequest(state, of('value'));
      expect(data()).toBe(true);
    });
  });
});
