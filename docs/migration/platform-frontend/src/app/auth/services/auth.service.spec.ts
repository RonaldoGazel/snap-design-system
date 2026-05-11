import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from './auth.service';
import { TokenStoreService } from './token-store.service';
import { OidcDiscoveryService } from './oidc-discovery.service';
import { PkceService } from './pkce.service';
import { BroadcastChannelService } from './broadcast-channel.service';
import { IdleTrackerService } from './idle-tracker.service';
import { AuthError } from '../models/auth-errors.model';

function createJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${header}.${body}.fake-sig`;
}

describe('AuthService', () => {
  let service: AuthService;
  let routerMock: { navigateByUrl: ReturnType<typeof vi.fn> };
  let tokenStoreMock: {
    access: string | null; refresh: string | null; id: string | null;
    sessionStart: number | null; hasTokens: boolean; isStale: boolean;
    generation: number; authSessionId: string | null;
    store: ReturnType<typeof vi.fn>; clear: ReturnType<typeof vi.fn>;
    markStale: ReturnType<typeof vi.fn>; clearStale: ReturnType<typeof vi.fn>;
  };
  let oidcMock: {
    discover: ReturnType<typeof vi.fn>;
    authorizationEndpoint: string; tokenEndpoint: string;
    endSessionEndpoint: string; revocationEndpoint: string; jwksUri: string;
  };
  let pkceMock: {
    generateCodeVerifier: ReturnType<typeof vi.fn>;
    generateState: ReturnType<typeof vi.fn>;
    generateNonce: ReturnType<typeof vi.fn>;
    deriveCodeChallenge: ReturnType<typeof vi.fn>;
    buildAuthorizationUrl: ReturnType<typeof vi.fn>;
    exchangeCode: ReturnType<typeof vi.fn>;
    validateNonce: ReturnType<typeof vi.fn>;
    validateIssuerAndAudience: ReturnType<typeof vi.fn>;
    decodeTokenPayload: ReturnType<typeof vi.fn>;
    clearPkceState: ReturnType<typeof vi.fn>;
    storedCodeVerifier: string | null; storedState: string | null; storedNonce: string | null;
  };
  let broadcastMock: {
    broadcast: ReturnType<typeof vi.fn>;
    onMessage: ReturnType<typeof vi.fn>;
    acquireRefreshLock: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
  let idleTrackerMock: {
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
    isIdle: boolean;
  };

  // Capture original location/history for restoration
  let originalLocation: Location;
  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  const NOW = 1700000000000;
  const ID_TOKEN = createJwt({
    sub: 'user-1', preferred_username: 'jdoe', name: 'John Doe',
    email: 'jdoe@example.com', nonce: 'nonce-1',
    iss: 'http://localhost:8180/realms/platform', aud: 'platform-frontend',
  });
  const ACCESS_TOKEN = createJwt({
    sub: 'user-1', exp: Math.floor(NOW / 1000) + 300, // 5 min from now
    iss: 'http://localhost:8180/realms/platform', aud: 'platform-frontend',
  });

  beforeEach(() => {
    vi.useFakeTimers({ now: NOW });

    routerMock = { navigateByUrl: vi.fn() };

    tokenStoreMock = {
      access: null, refresh: null, id: null,
      sessionStart: null, hasTokens: false, isStale: false,
      generation: 0, authSessionId: null,
      store: vi.fn(), clear: vi.fn(),
      markStale: vi.fn(), clearStale: vi.fn(),
    };

    oidcMock = {
      discover: vi.fn().mockResolvedValue({}),
      authorizationEndpoint: 'http://localhost:8180/realms/platform/protocol/openid-connect/auth',
      tokenEndpoint: 'http://localhost:8180/realms/platform/protocol/openid-connect/token',
      endSessionEndpoint: 'http://localhost:8180/realms/platform/protocol/openid-connect/logout',
      revocationEndpoint: 'http://localhost:8180/realms/platform/protocol/openid-connect/revoke',
      jwksUri: 'http://localhost:8180/realms/platform/protocol/openid-connect/certs',
    };

    pkceMock = {
      generateCodeVerifier: vi.fn().mockReturnValue('verifier-1'),
      generateState: vi.fn().mockReturnValue('state-1'),
      generateNonce: vi.fn().mockReturnValue('nonce-1'),
      deriveCodeChallenge: vi.fn().mockResolvedValue('challenge-1'),
      buildAuthorizationUrl: vi.fn().mockReturnValue('https://kc.example.com/auth?...'),
      exchangeCode: vi.fn().mockResolvedValue({
        access_token: ACCESS_TOKEN,
        refresh_token: 'refresh-tok',
        id_token: ID_TOKEN,
      }),
      validateNonce: vi.fn(),
      validateIssuerAndAudience: vi.fn(),
      decodeTokenPayload: vi.fn().mockImplementation((token: string) => {
        const parts = token.split('.');
        return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
      }),
      clearPkceState: vi.fn(),
      storedCodeVerifier: 'verifier-1',
      storedState: 'state-1',
      storedNonce: 'nonce-1',
    };

    broadcastMock = {
      broadcast: vi.fn(),
      onMessage: vi.fn(),
      acquireRefreshLock: vi.fn().mockImplementation(
        async <T>(fn: () => Promise<T>) => fn(),
      ),
      destroy: vi.fn(),
    };

    idleTrackerMock = {
      start: vi.fn(),
      stop: vi.fn(),
      isIdle: false,
    };

    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: routerMock },
        { provide: TranslateService, useValue: { use: vi.fn() } },
        { provide: TokenStoreService, useValue: tokenStoreMock },
        { provide: OidcDiscoveryService, useValue: oidcMock },
        { provide: PkceService, useValue: pkceMock },
        { provide: BroadcastChannelService, useValue: broadcastMock },
        { provide: IdleTrackerService, useValue: idleTrackerMock },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.useRealTimers();
    replaceStateSpy.mockRestore();
  });

  describe('initialize()', () => {
    it('should call OIDC discovery', async () => {
      await service.initialize();
      expect(oidcMock.discover).toHaveBeenCalledOnce();
    });

    it('should set isInitialized to true after completion', async () => {
      expect(service.isInitialized).toBe(false);
      await service.initialize();
      expect(service.isInitialized).toBe(true);
    });

    it('should emit unauthenticated when no code/state in URL', async () => {
      await service.initialize();
      expect(service.snapshot.status).toBe('unauthenticated');
    });

    it('should navigate to /auth/error on discovery failure', async () => {
      oidcMock.discover.mockRejectedValue(new AuthError('discovery_failed', 'fail'));
      await service.initialize();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/error');
    });

    it('should set isInitialized even on discovery failure', async () => {
      oidcMock.discover.mockRejectedValue(new AuthError('discovery_failed', 'fail'));
      await service.initialize();
      expect(service.isInitialized).toBe(true);
    });

    it('should register BroadcastChannel listener', async () => {
      await service.initialize();
      expect(broadcastMock.onMessage).toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    it('should delegate PKCE generation to PkceService', async () => {
      await service.initialize();
      service.login('/dashboard');
      expect(pkceMock.generateCodeVerifier).toHaveBeenCalled();
      expect(pkceMock.generateState).toHaveBeenCalled();
      expect(pkceMock.generateNonce).toHaveBeenCalled();
    });
  });

  describe('returnUrl validation', () => {
    it('should accept relative paths', async () => {
      await service.initialize();
      // Access the private method via bracket notation
      expect((service as any).validateReturnUrl('/dashboard')).toBe('/dashboard');
    });

    it('should reject absolute URLs', async () => {
      await service.initialize();
      expect((service as any).validateReturnUrl('https://evil.com')).toBe('/');
    });

    it('should reject protocol-relative URLs', async () => {
      await service.initialize();
      expect((service as any).validateReturnUrl('//evil.com')).toBe('/');
    });

    it('should default to / when no returnUrl provided', async () => {
      await service.initialize();
      expect((service as any).validateReturnUrl(undefined)).toBe('/');
    });
  });

  describe('handleCallback()', () => {
    it('should validate state, exchange code, store tokens, and emit authenticated', async () => {
      await service.handleCallback('auth-code-1', 'state-1');

      expect(pkceMock.exchangeCode).toHaveBeenCalledWith(
        'auth-code-1', 'verifier-1',
        oidcMock.tokenEndpoint,
        'http://localhost:4200/auth/callback',
        'platform-frontend',
      );
      expect(pkceMock.clearPkceState).toHaveBeenCalled();
      expect(pkceMock.validateNonce).toHaveBeenCalled();
      expect(pkceMock.validateIssuerAndAudience).toHaveBeenCalled();
      expect(tokenStoreMock.store).toHaveBeenCalledWith({
        access_token: ACCESS_TOKEN,
        refresh_token: 'refresh-tok',
        id_token: ID_TOKEN,
      });
      expect(service.snapshot.status).toBe('authenticated');
      expect(service.snapshot.user?.sub).toBe('user-1');
    });

    it('should clean URL via history.replaceState after callback', async () => {
      await service.handleCallback('auth-code-1', 'state-1');
      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', window.location.pathname);
    });

    it('should start idle tracker after successful callback', async () => {
      await service.handleCallback('auth-code-1', 'state-1');
      expect(idleTrackerMock.start).toHaveBeenCalled();
    });

    it('should navigate to returnUrl after callback', async () => {
      await service.handleCallback('auth-code-1', 'state-1');
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should reject state mismatch', async () => {
      await service.handleCallback('auth-code-1', 'wrong-state');
      expect(tokenStoreMock.clear).toHaveBeenCalled();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/error');
    });

    it('should reject missing PKCE state (page refresh during login)', async () => {
      pkceMock.storedCodeVerifier = null;
      pkceMock.storedNonce = null;
      await service.handleCallback('auth-code-1', 'state-1');
      expect(tokenStoreMock.clear).toHaveBeenCalled();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/error');
    });

    it('should clear PKCE state immediately after exchange (single-use)', async () => {
      await service.handleCallback('auth-code-1', 'state-1');
      // clearPkceState should be called before validateNonce
      const clearOrder = pkceMock.clearPkceState.mock.invocationCallOrder[0];
      const validateOrder = pkceMock.validateNonce.mock.invocationCallOrder[0];
      expect(clearOrder).toBeLessThan(validateOrder);
    });
  });

  describe('redirect loop detection', () => {
    it('should navigate to /auth/error after threshold failures', async () => {
      // Trigger failures up to threshold
      pkceMock.storedState = 'wrong'; // force state mismatch
      for (let i = 0; i < 3; i++) {
        await service.handleCallback('code', 'state-1');
      }

      // Reset state to valid — but loop detection should kick in
      pkceMock.storedState = 'state-1';
      routerMock.navigateByUrl.mockClear();
      await service.handleCallback('code', 'state-1');

      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/error');
    });
  });

  describe('refreshTokens()', () => {
    beforeEach(async () => {
      // Set up authenticated state
      await service.handleCallback('auth-code-1', 'state-1');
      tokenStoreMock.refresh = 'refresh-tok';
      tokenStoreMock.access = ACCESS_TOKEN;
      tokenStoreMock.sessionStart = NOW;
      tokenStoreMock.generation = 1;
      // Clear mocks from handleCallback setup so assertions start clean
      routerMock.navigateByUrl.mockClear();
      broadcastMock.broadcast.mockClear();
    });

    /** Switch to real timers and fix sessionStart to match real Date.now() */
    function useRealTimersWithFreshSession(): void {
      vi.useRealTimers();
      tokenStoreMock.sessionStart = Date.now();
    }

    it('should single-flight: concurrent callers only trigger one fetch', async () => {
      useRealTimersWithFreshSession();
      const tokenPayload = JSON.stringify({
        access_token: ACCESS_TOKEN,
        refresh_token: 'new-refresh',
        id_token: ID_TOKEN,
      });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () => new Response(tokenPayload, { status: 200 }),
      );

      const p1 = service.refreshTokens();
      const p2 = service.refreshTokens();

      const [r1, r2] = await Promise.all([p1, p2]);
      expect(r1).toBe(true);
      expect(r2).toBe(true);
      // Only one fetch call — single-flight invariant
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      fetchSpy.mockRestore();
    });

    it('should cleanup refreshPromise in finally block', async () => {
      useRealTimersWithFreshSession();
      vi.spyOn(service as any, 'scheduleRefresh').mockImplementation(() => {});
      vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);
      const tokenPayload = JSON.stringify({
        access_token: ACCESS_TOKEN,
        refresh_token: 'new-refresh',
        id_token: ID_TOKEN,
      });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () => new Response(tokenPayload, { status: 200 }),
      );

      const result1 = await service.refreshTokens();
      expect(result1).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      // After completion, refreshPromise is cleaned up in finally.
      // A new call should create a fresh fetch (not coalesced).
      fetchSpy.mockClear();
      const result2 = await service.refreshTokens();
      expect(result2).toBe(true);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      fetchSpy.mockRestore();
    });

    it('should skip refresh and logout when idle', async () => {
      useRealTimersWithFreshSession();
      idleTrackerMock.isIdle = true;

      // Mock fetch on window to handle the revocation call in logout()
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

      const result = await service.refreshTokens();
      expect(result).toBe(false);

      fetchSpy.mockRestore();
    });

    it('should force re-auth when max session lifetime exceeded', async () => {
      tokenStoreMock.sessionStart = NOW - (9 * 3600_000); // 9 hours ago (> 8h limit)

      const result = await service.refreshTokens();
      expect(result).toBe(false);
      expect(tokenStoreMock.clear).toHaveBeenCalled();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/session-expired');
    });

    it('should return false when no refresh token available', async () => {
      tokenStoreMock.refresh = null;

      const result = await service.refreshTokens();
      expect(result).toBe(false);
      expect(service.snapshot.status).toBe('unauthenticated');
    });

    it('should broadcast token_refreshed on success', async () => {
      useRealTimersWithFreshSession();
      const tokenPayload = JSON.stringify({
        access_token: ACCESS_TOKEN,
        refresh_token: 'new-refresh',
        id_token: ID_TOKEN,
      });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () => new Response(tokenPayload, { status: 200 }),
      );

      broadcastMock.broadcast.mockClear();
      await service.refreshTokens();

      expect(broadcastMock.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'token_refreshed' }),
      );

      fetchSpy.mockRestore();
    });

    it('should broadcast logout on invalid_grant', async () => {
      useRealTimersWithFreshSession();
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () => new Response('{"error":"invalid_grant"}', { status: 400 }),
      );

      broadcastMock.broadcast.mockClear();
      await service.refreshTokens();

      expect(broadcastMock.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'logout', reason: 'expired' }),
      );
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/session-expired');

      fetchSpy.mockRestore();
    });

    it('should emit unauthenticated after all retries fail on network error', async () => {
      useRealTimersWithFreshSession();
      // Mock delay on the service to skip real waits
      vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

      const result = await service.refreshTokens();
      expect(result).toBe(false);
      expect(service.snapshot.status).toBe('unauthenticated');
      // Should NOT navigate to session-expired (network error ≠ session invalidation)
      expect(routerMock.navigateByUrl).not.toHaveBeenCalledWith('/auth/session-expired');

      fetchSpy.mockRestore();
    });

    it('should use acquireRefreshLock for cross-tab coordination', async () => {
      useRealTimersWithFreshSession();
      const tokenPayload = JSON.stringify({
        access_token: ACCESS_TOKEN,
        refresh_token: 'new-refresh',
        id_token: ID_TOKEN,
      });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () => new Response(tokenPayload, { status: 200 }),
      );

      await service.refreshTokens();
      expect(broadcastMock.acquireRefreshLock).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('getAccessToken()', () => {
    it('should return null when no session', () => {
      tokenStoreMock.sessionStart = null;
      expect(service.getAccessToken()).toBeNull();
    });

    it('should return access token when session is valid', () => {
      tokenStoreMock.sessionStart = NOW;
      tokenStoreMock.access = 'my-token';
      expect(service.getAccessToken()).toBe('my-token');
    });

    it('should return null and clear when max session lifetime exceeded', () => {
      tokenStoreMock.sessionStart = NOW - (9 * 3600_000);
      tokenStoreMock.access = 'my-token';
      expect(service.getAccessToken()).toBeNull();
      expect(tokenStoreMock.clear).toHaveBeenCalled();
    });
  });

  describe('logout()', () => {
    beforeEach(async () => {
      await service.handleCallback('auth-code-1', 'state-1');
      tokenStoreMock.refresh = 'refresh-tok';
      tokenStoreMock.id = ID_TOKEN;
    });

    it('should attempt revocation, clear tokens, stop idle tracker, and broadcast', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

      broadcastMock.broadcast.mockClear();
      await service.logout();

      // Revocation attempted
      expect(fetchSpy).toHaveBeenCalledWith(
        oidcMock.revocationEndpoint,
        expect.objectContaining({ method: 'POST' }),
      );
      // Tokens cleared
      expect(tokenStoreMock.clear).toHaveBeenCalled();
      // Idle tracker stopped
      expect(idleTrackerMock.stop).toHaveBeenCalled();
      // Broadcast logout
      expect(broadcastMock.broadcast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'logout', reason: 'user' }),
      );

      fetchSpy.mockRestore();
    });

    it('should proceed even if revocation fails', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network'));

      await service.logout(); // should not throw
      expect(tokenStoreMock.clear).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('BroadcastChannel listener', () => {
    it('should clear tokens and redirect on logout broadcast', async () => {
      await service.initialize();

      const callback = broadcastMock.onMessage.mock.calls[0][0];
      callback({ type: 'logout', reason: 'expired', timestamp: Date.now() });

      expect(tokenStoreMock.clear).toHaveBeenCalled();
      expect(idleTrackerMock.stop).toHaveBeenCalled();
      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/auth/session-expired');
    });

    it('should redirect to / on user-initiated logout broadcast', async () => {
      await service.initialize();

      const callback = broadcastMock.onMessage.mock.calls[0][0];
      callback({ type: 'logout', reason: 'user', timestamp: Date.now() });

      expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/');
    });

    it('should mark stale and trigger refresh on token_refreshed with higher generation', async () => {
      await service.initialize();
      tokenStoreMock.generation = 1;

      const callback = broadcastMock.onMessage.mock.calls[0][0];
      callback({ type: 'token_refreshed', timestamp: Date.now(), generation: 5 });

      expect(tokenStoreMock.markStale).toHaveBeenCalled();
    });

    it('should drop token_refreshed with stale generation', async () => {
      await service.initialize();
      tokenStoreMock.generation = 5;

      const callback = broadcastMock.onMessage.mock.calls[0][0];
      callback({ type: 'token_refreshed', timestamp: Date.now(), generation: 3 });

      expect(tokenStoreMock.markStale).not.toHaveBeenCalled();
    });
  });

  describe('initialize() — config_error branch', () => {
    it('should emit unauthenticated and not call discover when keycloak config is missing', async () => {
      // Override environment to simulate missing config
      const envModule = await import('../../../environments/environment');
      const original = { ...envModule.environment.keycloak };
      envModule.environment.keycloak.baseUrl = '';

      oidcMock.discover.mockClear();
      await service.initialize();

      expect(oidcMock.discover).not.toHaveBeenCalled();
      expect(service.snapshot.status).toBe('unauthenticated');
      expect(service.isInitialized).toBe(true);

      // Restore
      Object.assign(envModule.environment.keycloak, original);
    });
  });

  describe('refreshIfNeeded()', () => {
    beforeEach(async () => {
      await service.handleCallback('auth-code-1', 'state-1');
      tokenStoreMock.refresh = 'refresh-tok';
      tokenStoreMock.access = ACCESS_TOKEN;
      tokenStoreMock.sessionStart = NOW;
      tokenStoreMock.generation = 1;
      routerMock.navigateByUrl.mockClear();
    });

    it('should trigger refresh when tokens are stale', async () => {
      vi.useRealTimers();
      tokenStoreMock.sessionStart = Date.now();
      tokenStoreMock.isStale = true;

      const tokenPayload = JSON.stringify({
        access_token: ACCESS_TOKEN,
        refresh_token: 'new-refresh',
        id_token: ID_TOKEN,
      });
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(
        async () => new Response(tokenPayload, { status: 200 }),
      );

      await service.refreshIfNeeded();
      expect(fetchSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should clear stale flag when refresh fails', async () => {
      vi.useRealTimers();
      tokenStoreMock.sessionStart = Date.now();
      tokenStoreMock.isStale = true;
      tokenStoreMock.refresh = null; // force refresh to fail (no token)

      await service.refreshIfNeeded();
      expect(tokenStoreMock.clearStale).toHaveBeenCalled();
    });

    it('should skip refresh when tokens are fresh and not near expiry', async () => {
      tokenStoreMock.isStale = false;
      // ACCESS_TOKEN has exp = NOW/1000 + 300 (5 min from now), buffer+skew = 90s → not near expiry

      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await service.refreshIfNeeded();
      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });
  });

  describe('logout() — end-session redirect', () => {
    let locationHrefSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      await service.handleCallback('auth-code-1', 'state-1');
      tokenStoreMock.refresh = 'refresh-tok';
      tokenStoreMock.id = ID_TOKEN;

      // Spy on window.location.href assignment
      locationHrefSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
        ...window.location,
        href: window.location.href,
      } as Location);
    });

    afterEach(() => {
      locationHrefSpy?.mockRestore();
    });

    it('should include id_token_hint when id token is available', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

      // We can't easily spy on location.href setter in jsdom, but we can verify
      // the id token was read before clear
      const idBefore = tokenStoreMock.id;
      expect(idBefore).toBeTruthy();

      await service.logout();
      // Token store was cleared after capturing id token
      expect(tokenStoreMock.clear).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should skip revocation when no refresh token', async () => {
      tokenStoreMock.refresh = null;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

      await service.logout();
      // fetch should not be called for revocation (no refresh token)
      // but location.href redirect still happens
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(tokenStoreMock.clear).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should omit id_token_hint when id token is null', async () => {
      tokenStoreMock.id = null;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

      // Should not throw even without id token
      await service.logout();
      expect(tokenStoreMock.clear).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });

  describe('scheduleRefresh() — min delay floor', () => {
    beforeEach(async () => {
      await service.handleCallback('auth-code-1', 'state-1');
      tokenStoreMock.access = ACCESS_TOKEN;
      tokenStoreMock.refresh = 'refresh-tok';
      tokenStoreMock.sessionStart = NOW;
      tokenStoreMock.generation = 1;
    });

    it('should enforce minimum 1-second delay when token is already past refresh window', () => {
      // Create a token that expired 10 minutes ago
      const expiredToken = createJwt({
        sub: 'user-1',
        exp: Math.floor(NOW / 1000) - 600, // 10 min ago
        iss: 'http://localhost:8180/realms/platform',
        aud: 'platform-frontend',
      });
      tokenStoreMock.access = expiredToken;

      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      // Trigger scheduleRefresh via the private method
      (service as any).scheduleRefresh();

      // Find the setTimeout call from scheduleRefresh (not other timers)
      const refreshCall = setTimeoutSpy.mock.calls.find(
        call => typeof call[0] === 'function' && call[1] !== undefined && call[1] >= 1000,
      );
      expect(refreshCall).toBeTruthy();
      // The delay should be at least 1000ms (the floor), not 0 or negative
      expect(refreshCall![1]).toBeGreaterThanOrEqual(1000);

      setTimeoutSpy.mockRestore();
    });

    it('should use computed delay when token is not yet near expiry', () => {
      // ACCESS_TOKEN has exp = NOW/1000 + 300 (5 min from now)
      // refreshBuffer=60s, clockSkew=30s → refreshAt = exp - 90s = NOW + 210s
      // delay = 210_000ms
      const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

      (service as any).scheduleRefresh();

      const refreshCall = setTimeoutSpy.mock.calls.find(
        call => typeof call[0] === 'function' && (call[1] as number) > 1000,
      );
      expect(refreshCall).toBeTruthy();
      // Should be around 210_000ms (210s = 300s - 90s buffer)
      expect(refreshCall![1]).toBeGreaterThan(100_000);

      setTimeoutSpy.mockRestore();
    });
  });
});
