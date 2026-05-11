import { Observable } from 'rxjs';
import { SessionState } from '../models/session-state.model';

/**
 * Stable interface contract for SPA ↔ BFF swap.
 *
 * All authentication logic flows through this interface.
 * Guards and interceptors delegate to it — they never make
 * independent auth decisions.
 */
export interface IAuthService {
  /** Observable stream of the current session state. */
  sessionState$: Observable<SessionState>;

  /**
   * Initiate login flow. Redirects to Keycloak authorization endpoint.
   * @param returnUrl - Relative path to redirect to after login (must start with "/").
   */
  login(returnUrl?: string): void;

  /** Revoke tokens, clear local state, broadcast logout, redirect to Keycloak end-session. */
  logout(): Promise<void>;

  /**
   * Returns the current access token, or null if unavailable or max session lifetime exceeded.
   * This is the single choke point for all token consumers.
   */
  getAccessToken(): string | null;

  /**
   * Ensure tokens are fresh. Triggers refresh if tokens are stale or near expiry.
   * Clears stale flag on failure to prevent interceptor deadlock.
   */
  refreshIfNeeded(): Promise<void>;

  /**
   * Handle a 401 response. Delegates to refreshIfNeeded() and returns
   * the new access token on success, or null on failure.
   */
  handleUnauthorized(): Promise<string | null>;
}
