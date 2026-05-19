import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { IAuthService } from './auth-service.interface';
import { TokenStoreService, TokenSet } from './token-store.service';
import { OidcDiscoveryService } from './oidc-discovery.service';
import { PkceService } from './pkce.service';
import { BroadcastChannelService, AuthBroadcastMessage } from './broadcast-channel.service';
import { IdleTrackerService } from './idle-tracker.service';
import { PlatformIdentityService } from './platform-identity.service';
import { SessionState, SessionStatus, UserProfile } from '../models/session-state.model';
import { AuthError } from '../models/auth-errors.model';
import { logAuthError } from '../utils/log-auth-error';
import { environment } from '../../../environments/environment';
import { RuntimeConfigService } from '../../services/runtime-config.service';

const SUPPORTED_LOCALES = ['en', 'pt-BR'];

@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly tokenStore = inject(TokenStoreService);
  private readonly oidcDiscovery = inject(OidcDiscoveryService);
  private readonly pkce = inject(PkceService);
  private readonly broadcastChannel = inject(BroadcastChannelService);
  private readonly idleTracker = inject(IdleTrackerService);
  private readonly platformIdentity = inject(PlatformIdentityService);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  private readonly state = new BehaviorSubject<SessionState>({
    status: 'initializing',
    user: null,
    isRefreshing: false,
    isStale: false,
  });

  readonly sessionState$: Observable<SessionState> = this.state.asObservable();

  private refreshPromise: Promise<boolean> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly RETURN_URL_KEY = 'auth_return_url';
  private returnUrl: string = '/';
  private callbackFailures: number[] = [];
  private _isInitialized = false;

  get snapshot(): SessionState {
    return this.state.value;
  }

  get isInitialized(): boolean {
    return this._isInitialized;
  }

  /** APP_INITIALIZER entry point. */
  async initialize(): Promise<void> {
    try {
      this.emitState('initializing');

      const { baseUrl, realm, clientId } = this.runtimeConfig.config.keycloak;
      if (!baseUrl || !realm || !clientId) {
        logAuthError(
          new AuthError('config_error', 'Missing keycloak config'),
          this.tokenStore.authSessionId,
        );
        this.emitState('unauthenticated');
        return;
      }

      try {
        await this.oidcDiscovery.discover();
      } catch (err) {
        if (err instanceof AuthError) {
          logAuthError(err, this.tokenStore.authSessionId);
        }
        this.router.navigateByUrl('/auth/error');
        return;
      }

      // Check URL for authorization code callback
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const stateParam = url.searchParams.get('state');

      if (code && stateParam) {
        await this.handleCallback(code, stateParam);
      } else {
        // No tokens persisted (in-memory only) → unauthenticated
        this.emitState('unauthenticated');
      }

      // Initialize BroadcastChannel listener for cross-tab sync
      this.initBroadcastListener();
    } finally {
      this._isInitialized = true;
    }
  }

  login(returnUrl?: string): void {
    const validated = this.validateReturnUrl(returnUrl);
    this.returnUrl = validated;
    // Persist across the Keycloak redirect (full page navigation clears in-memory state)
    sessionStorage.setItem(AuthService.RETURN_URL_KEY, validated);

    const verifier = this.pkce.generateCodeVerifier();
    const state = this.pkce.generateState();
    const nonce = this.pkce.generateNonce();

    this.pkce.deriveCodeChallenge(verifier).then((codeChallenge) => {
      const authUrl = this.pkce.buildAuthorizationUrl({
        authorizationEndpoint: this.oidcDiscovery.authorizationEndpoint,
        clientId: this.runtimeConfig.config.keycloak.clientId,
        redirectUri: this.runtimeConfig.config.keycloak.redirectUri,
        codeChallenge,
        state,
        nonce,
      });
      window.location.href = authUrl;
    });
  }

  async handleCallback(code: string, stateParam: string): Promise<void> {
    // Redirect loop detection
    const now = Date.now();
    this.callbackFailures = this.callbackFailures.filter(
      (t) => now - t < environment.auth.redirectLoopWindowMs,
    );

    if (this.callbackFailures.length >= environment.auth.redirectLoopThreshold) {
      logAuthError(
        new AuthError('redirect_loop', 'Too many callback failures'),
        this.tokenStore.authSessionId,
      );
      this.router.navigateByUrl('/auth/error');
      return;
    }

    try {
      // Validate state
      if (stateParam !== this.pkce.storedState) {
        throw new AuthError('invalid_token', 'State mismatch in callback');
      }

      const storedVerifier = this.pkce.storedCodeVerifier;
      const storedNonce = this.pkce.storedNonce;
      if (!storedVerifier || !storedNonce) {
        throw new AuthError(
          'invalid_token',
          'Missing PKCE state — page may have been refreshed during login',
        );
      }

      // Exchange code for tokens
      const tokenResponse = await this.pkce.exchangeCode(
        code,
        storedVerifier,
        this.oidcDiscovery.tokenEndpoint,
        this.runtimeConfig.config.keycloak.redirectUri,
        this.runtimeConfig.config.keycloak.clientId,
      );

      // Clear PKCE state immediately (single-use)
      this.pkce.clearPkceState();

      const idToken = tokenResponse['id_token'] as string;
      const expectedIssuer = `${this.runtimeConfig.config.keycloak.baseUrl}/realms/${this.runtimeConfig.config.keycloak.realm}`;

      // Validate nonce, issuer, audience
      this.pkce.validateNonce(idToken, storedNonce);
      this.pkce.validateIssuerAndAudience(
        idToken,
        expectedIssuer,
        this.runtimeConfig.config.keycloak.clientId,
      );

      // Store tokens
      this.tokenStore.store({
        access_token: tokenResponse['access_token'] as string,
        refresh_token: tokenResponse['refresh_token'] as string,
        id_token: idToken,
      });

      // Clean URL (remove code/state params)
      window.history.replaceState({}, '', window.location.pathname);

      // Extract user profile from ID token
      const payload = this.pkce.decodeTokenPayload(idToken);
      const user: UserProfile = {
        sub: payload['sub'] as string,
        preferredUsername: payload['preferred_username'] as string,
        name: (payload['name'] as string) || (payload['preferred_username'] as string) || '',
        email: (payload['email'] as string) || '',
      };

      // Switch locale based on user's Keycloak locale preference
      const userLocale = payload['locale'] as string;
      if (userLocale && SUPPORTED_LOCALES.includes(userLocale)) {
        this.translate.use(userLocale);
      }

      this.state.next({
        status: 'authenticated',
        user,
        isRefreshing: false,
        isStale: false,
      });

      // Schedule proactive refresh
      this.scheduleRefresh();

      // Start idle tracker
      this.idleTracker.start({
        onLogout: () => this.logout(),
        onWarning: () => {
          // IdleWarningComponent handles toast display via MessageService
          console.warn('[Auth] Idle timeout warning — session will expire soon');
        },
      });

      // Trigger JIT provisioning on identity-service (fire-and-forget).
      // Login succeeds regardless — this ensures the backend user record exists.
      this.platformIdentity.fetchMyIdentity().catch(() => {
        console.warn('[Auth] JIT identity provisioning call failed — will retry on next API call');
      });

      // Navigate to stored returnUrl (restore from sessionStorage if page was refreshed)
      const persistedUrl = sessionStorage.getItem(AuthService.RETURN_URL_KEY);
      if (persistedUrl) {
        this.returnUrl = persistedUrl;
        sessionStorage.removeItem(AuthService.RETURN_URL_KEY);
      }
      this.router.navigateByUrl(this.returnUrl);
    } catch (err) {
      this.callbackFailures.push(Date.now());
      if (err instanceof AuthError) {
        logAuthError(err, this.tokenStore.authSessionId);
      }
      this.tokenStore.clear();
      this.router.navigateByUrl('/auth/error');
    }
  }

  /** Single-flight refresh with try/finally cleanup invariant. */
  async refreshTokens(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        // Check idle timeout before refresh
        if (this.idleTracker.isIdle) {
          await this.logout();
          return false;
        }

        // Check max session lifetime
        const sessionStart = this.tokenStore.sessionStart;
        if (sessionStart !== null) {
          const elapsed = Date.now() - sessionStart;
          if (elapsed >= environment.auth.maxSessionLifetimeHours * 3600_000) {
            this.tokenStore.clear();
            this.emitState('unauthenticated');
            this.router.navigateByUrl('/auth/session-expired');
            return false;
          }
        }

        this.state.next({ ...this.state.value, isRefreshing: true });

        const refreshToken = this.tokenStore.refresh;
        if (!refreshToken) {
          this.emitState('unauthenticated');
          return false;
        }

        // Acquire Web Lock for cross-tab refresh coordination
        return await this.broadcastChannel.acquireRefreshLock(async () => {
          // Re-read refresh token AFTER acquiring lock — another tab may have
          // refreshed while we waited, invalidating the previously captured value.
          const currentRefreshToken = this.tokenStore.refresh ?? refreshToken;

          const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: currentRefreshToken,
            client_id: this.runtimeConfig.config.keycloak.clientId,
          });

          const backoffDelays = [1000, 3000, 5000];
          let lastError: unknown;

          for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
            try {
              const response = await fetch(this.oidcDiscovery.tokenEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: body.toString(),
              });

              if (!response.ok) {
                const errorText = await response.text();
                if (errorText.includes('invalid_grant')) {
                  throw new AuthError('invalid_grant', 'Refresh token is no longer valid');
                }
                throw new AuthError('network_error', `Refresh failed: ${response.status}`);
              }

              const tokenResponse = await response.json();

              this.tokenStore.store({
                access_token: tokenResponse.access_token,
                refresh_token: tokenResponse.refresh_token,
                id_token: tokenResponse.id_token,
              });
              this.tokenStore.clearStale();

              this.state.next({ ...this.state.value, isRefreshing: false, isStale: false });
              this.scheduleRefresh();

              // Broadcast token_refreshed to other tabs
              this.broadcastChannel.broadcast({
                type: 'token_refreshed',
                timestamp: Date.now(),
                generation: this.tokenStore.generation,
              });

              return true;
            } catch (err) {
              lastError = err;
              if (err instanceof AuthError && err.code === 'invalid_grant') {
                // Real session invalidation — no retry
                this.tokenStore.clear();
                this.emitState('unauthenticated');
                // Broadcast logout to other tabs
                this.broadcastChannel.broadcast({
                  type: 'logout',
                  reason: 'expired',
                  timestamp: Date.now(),
                });
                this.router.navigateByUrl('/auth/session-expired');
                return false;
              }
              if (attempt < backoffDelays.length) {
                await this.delay(backoffDelays[attempt]);
              }
            }
          }

          // All retries failed — emit unauthenticated, let guard/Keycloak session decide
          logAuthError(
            new AuthError('network_error', 'Refresh failed after all retries', lastError),
            this.tokenStore.authSessionId,
          );
          this.emitState('unauthenticated');
          return false;
        });
      } finally {
        this.refreshPromise = null;
        this.state.next({ ...this.state.value, isRefreshing: false });
      }
    })();

    return this.refreshPromise;
  }

  async refreshIfNeeded(): Promise<void> {
    if (this.tokenStore.isStale || this.isNearExpiry()) {
      const success = await this.refreshTokens();
      if (!success) {
        this.tokenStore.clearStale();
      }
    }
  }

  getAccessToken(): string | null {
    const sessionStart = this.tokenStore.sessionStart;
    if (sessionStart === null) return null;

    const elapsed = Date.now() - sessionStart;
    if (elapsed >= environment.auth.maxSessionLifetimeHours * 3600_000) {
      this.tokenStore.clear();
      this.emitState('unauthenticated');
      return null;
    }

    return this.tokenStore.access;
  }

  async handleUnauthorized(): Promise<string | null> {
    await this.refreshIfNeeded();
    return this.tokenStore.access;
  }

  async logout(): Promise<void> {
    // Attempt refresh token revocation (proceed regardless of failure)
    const revocationEndpoint = this.oidcDiscovery.revocationEndpoint;
    const refreshToken = this.tokenStore.refresh;
    if (revocationEndpoint && refreshToken) {
      try {
        await fetch(revocationEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            token: refreshToken,
            token_type_hint: 'refresh_token',
            client_id: this.runtimeConfig.config.keycloak.clientId,
          }).toString(),
        });
      } catch {
        // Proceed regardless
      }
    }

    const idToken = this.tokenStore.id;
    this.tokenStore.clear();
    this.clearRefreshTimer();
    this.idleTracker.stop();
    this.emitState('unauthenticated');

    // Broadcast logout to other tabs
    this.broadcastChannel.broadcast({
      type: 'logout',
      reason: 'user',
      timestamp: Date.now(),
    });

    // Redirect to Keycloak end-session
    const params = new URLSearchParams({
      post_logout_redirect_uri: this.runtimeConfig.config.keycloak.postLogoutRedirectUri,
    });
    if (idToken) {
      params.set('id_token_hint', idToken);
    }

    window.location.href = `${this.oidcDiscovery.endSessionEndpoint}?${params.toString()}`;
  }

  private initBroadcastListener(): void {
    this.broadcastChannel.onMessage((msg: AuthBroadcastMessage) => {
      switch (msg.type) {
        case 'logout':
          this.tokenStore.clear();
          this.clearRefreshTimer();
          this.idleTracker.stop();
          this.emitState('unauthenticated');
          if (msg.reason === 'expired') {
            this.router.navigateByUrl('/auth/session-expired');
          } else {
            this.router.navigateByUrl('/');
          }
          break;

        case 'token_refreshed':
          // Drop stale broadcasts (monotonic generation ordering)
          if (msg.generation <= this.tokenStore.generation) break;
          this.tokenStore.markStale();
          this.state.next({ ...this.state.value, isStale: true });
          this.refreshIfNeeded();
          break;

        case 'user_active':
          // Handled directly by IdleTrackerService via its own BroadcastChannel subscription
          break;
      }
    });
  }

  private scheduleRefresh(): void {
    this.clearRefreshTimer();

    const accessToken = this.tokenStore.access;
    if (!accessToken) return;

    try {
      const payload = this.pkce.decodeTokenPayload(accessToken);
      const exp = payload['exp'] as number;
      if (!exp) return;

      const { refreshBufferSeconds, clockSkewToleranceSeconds } = environment.auth;
      const refreshAt = exp * 1000 - (refreshBufferSeconds + clockSkewToleranceSeconds) * 1000;
      const delay = refreshAt - Date.now();

      // If the token is already past the refresh window, trigger an immediate
      // refresh but guard against scheduling a tight loop (min 1 s).
      this.refreshTimer = setTimeout(() => this.refreshTokens(), Math.max(delay, 1000));
    } catch {
      // If token decode fails, skip scheduling
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private isNearExpiry(): boolean {
    const accessToken = this.tokenStore.access;
    if (!accessToken) return false;

    try {
      const payload = this.pkce.decodeTokenPayload(accessToken);
      const exp = payload['exp'] as number;
      if (!exp) return true;

      const { refreshBufferSeconds, clockSkewToleranceSeconds } = environment.auth;
      return exp * 1000 - Date.now() < (refreshBufferSeconds + clockSkewToleranceSeconds) * 1000;
    } catch {
      return true;
    }
  }

  private validateReturnUrl(url?: string): string {
    if (!url) return '/';
    // Must be relative path starting with "/"
    if (!url.startsWith('/') || url.startsWith('//') || url.includes('://')) {
      return '/';
    }
    return url;
  }

  private emitState(status: SessionStatus): void {
    this.state.next({
      status,
      user: status === 'authenticated' ? this.state.value.user : null,
      isRefreshing: false,
      isStale: false,
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
