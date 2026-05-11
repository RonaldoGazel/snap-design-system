# Implementation Plan: Login UI

## Overview

Incremental implementation of the authentication module for platform-frontend. Each task builds on the previous, starting with foundational types and services, then layering orchestration, guards, interceptors, cross-tab sync, idle tracking, pages, i18n, and CSP. All code lives under `src/app/auth/` using Angular standalone components and injectable services. TypeScript throughout.

### Simplifications Applied

1. **AuthService split** — PKCE generation, code exchange, and nonce/state validation extracted into a dedicated `PkceService` (or `AuthFlowService`). AuthService remains the orchestrator.
2. **Advanced refresh hardening deferred** — Core refresh (single-flight, basic retry, stale flag) is required. Jitter on refresh timer, `invalid_grant` race recovery with generation-based detection, cooldown after failure, and generation-based 401 detection are marked optional (BFF-bound, can be deferred).
3. **BroadcastChannel + Web Locks kept as-is** — BroadcastChannel survives BFF migration, Web Locks already has fallback. No over-testing of Web Locks path.
4. **Idle tracking simplified** — Basic cross-tab activity sync kept. Drift guard and local activity guard dropped from `IdleTrackerService`. `recordActivity()` stays private.
5. **Interceptor simplified** — 401 classification heuristic dropped. On 401: if not already retried, trigger one refresh. If refresh succeeds, replay idempotent / reject non-idempotent. If refresh fails, propagate. No generation stamping, no near-expiry check, no stale-flag check in the 401 path.

### Refinements Applied

6. **Token decoding hardened** — `decodeTokenPayload()` uses `Uint8Array` + `TextDecoder` instead of `atob()` to handle non-ASCII/Unicode payloads from custom claims.
7. **Refresh network failure is not session invalidation** — After all retries fail, emit `unauthenticated` and let the guard/Keycloak session cookie decide. Avoids false "session expired" on transient network issues.
8. **Near-expiry condition explicit** — `isNearExpiry = (exp * 1000) - Date.now() < (refreshBufferSeconds + clockSkewToleranceSeconds) * 1000`.
9. **Backpressure overflow defined** — Requests beyond the 5-replay limit are rejected with `AuthSessionRefreshedError`, not queued or dropped.
10. **PKCE state persisted in sessionStorage** — `code_verifier`, `state`, and `nonce` are stored in `sessionStorage` to survive the full-page redirect to Keycloak. `sessionStorage` is tab-scoped (not shared across tabs), cleared on tab close, and all three keys are removed immediately after the callback exchange via `clearPkceState()`. This is the standard approach for SPA OIDC Authorization Code Flow with PKCE. Tokens themselves remain in-memory only (never persisted).

## Tasks

- [x] 1. Set up auth module structure, models, and environment configuration
  - [x] 1.1 Create environment configuration files
    - Create `src/environments/environment.ts` and `src/environments/environment.prod.ts` with all auth config fields: `keycloak.baseUrl`, `keycloak.realm`, `keycloak.clientId`, `keycloak.redirectUri`, `keycloak.postLogoutRedirectUri`, `apiGatewayUrl`, `auth.refreshBufferSeconds`, `auth.clockSkewToleranceSeconds`, `auth.idleTimeoutMinutes`, `auth.maxSessionLifetimeHours`, `auth.interceptorReplayLimit`, `auth.redirectLoopThreshold`, `auth.redirectLoopWindowMs`, `credentialStrategy`, `csp.reportUri`
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [x] 1.2 Create auth error taxonomy and session state models
    - Create `src/app/auth/models/auth-errors.model.ts` with `AuthErrorCode` type union (`network_error`, `invalid_grant`, `discovery_failed`, `invalid_token`, `session_expired`, `redirect_loop`, `config_error`), `AuthError` class extending `Error`, and `AuthSessionRefreshedError` class with `{ retryable, method, url }`
    - Create `src/app/auth/models/session-state.model.ts` with `SessionState`, `SessionStatus`, `UserProfile` interfaces
    - _Requirements: 15.6, 8.1, 8.7_
  - [x] 1.3 Create the `logAuthError` utility function
    - Create `src/app/auth/utils/log-auth-error.ts` implementing the logging contract: include `error.code`, `error.message`, `timestamp` (ISO 8601), `authSessionId` (if available). Exclude tokens, headers, PII, PKCE material
    - _Requirements: 16.1, 16.2, 16.3_
  - [x] 1.4 Create the `IAuthService` interface
    - Create `src/app/auth/services/auth-service.interface.ts` with `login(returnUrl?)`, `logout()`, `getAccessToken()`, `sessionState$`, `refreshIfNeeded()`, `handleUnauthorized()` as defined in the design
    - _Requirements: BFF-Ready Design Constraint_

- [x] 2. Implement TokenStoreService
  - [x] 2.1 Implement `TokenStoreService`
    - Create `src/app/auth/services/token-store.service.ts` as `@Injectable({ providedIn: 'root' })`
    - In-memory storage for `accessToken`, `refreshToken`, `idToken` (private fields, null initial)
    - `sessionStartTimestamp` tracking (set on first `store()` call)
    - Monotonically increasing `_generation` counter incremented on each `store()` call
    - `_authSessionId` generated via `crypto.randomUUID()` on first `store()` call
    - `_isStale` flag with `markStale()` and `clearStale()` methods
    - `store(tokens: TokenSet)`, `clear()` (resets all fields including generation and authSessionId)
    - Getters: `access`, `refresh`, `id`, `sessionStart`, `hasTokens`, `isStale`, `generation`, `authSessionId`
    - No localStorage, sessionStorage, or cookie writes
    - _Requirements: 3.1, 3.2, 3.7, 3.8_
  - [x]* 2.2 Write unit tests for `TokenStoreService`
    - Test `store()` sets all tokens and increments generation
    - Test `clear()` resets all fields to null/initial
    - Test `sessionStartTimestamp` is set only on first `store()` call
    - Test `markStale()` / `clearStale()` toggle `isStale`
    - Test `authSessionId` is generated on first `store()` and cleared on `clear()`
    - Test generation is monotonically increasing across multiple `store()` calls
    - _Requirements: 3.1, 3.2, 3.7, 3.8_

- [x] 3. Implement OidcDiscoveryService
  - [x] 3.1 Implement `OidcDiscoveryService`
    - Create `src/app/auth/services/oidc-discovery.service.ts` as `@Injectable({ providedIn: 'root' })`
    - `discover()` method: fetch `{keycloak_base_url}/realms/{realm}/.well-known/openid-configuration` using `fetch()` with `{ redirect: 'error' }` to reject cross-origin redirects
    - Validate `issuer` matches `{keycloak_base_url}/realms/{realm}`
    - Validate all endpoint origins (`authorization_endpoint`, `token_endpoint`, `end_session_endpoint`, `revocation_endpoint`, `jwks_uri`) match issuer origin
    - Exponential backoff retry: 2s, 4s, 8s — max 3 attempts
    - Cache response for application lifetime (`private config: OidcConfiguration | null`)
    - Throw `AuthError('discovery_failed')` on permanent failure; throw `AuthError('config_error')` if env config missing
    - Getters for each endpoint
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4_
  - [x]* 3.2 Write unit tests for `OidcDiscoveryService`
    - Test successful discovery and caching
    - Test issuer validation rejects mismatched issuer
    - Test endpoint origin validation rejects cross-origin endpoints
    - Test exponential backoff retry on fetch failure (2s, 4s, 8s)
    - Test `AuthError('discovery_failed')` thrown after 3 failed retries
    - Test `AuthError('config_error')` thrown when env config is missing
    - Test `{ redirect: 'error' }` rejects redirected responses
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.4_

- [x] 4. Implement CredentialStrategy
  - [x] 4.1 Implement `CredentialStrategy` interface and implementations
    - Create `src/app/auth/services/credential-strategy.ts`
    - Define `CredentialStrategy` interface with `attachCredentials(req: HttpRequest<unknown>): HttpRequest<unknown>`
    - Implement `BearerTokenStrategy`: attaches `Authorization: Bearer <access_token>` and `X-Requested-With: XMLHttpRequest`
    - Implement `BffCookieStrategy`: no token attachment, still attaches `X-Requested-With: XMLHttpRequest`
    - Provide active strategy via environment config (`credentialStrategy` field)
    - _Requirements: 7.1, 7.6, BFF-Ready Design Constraint_

- [x] 5. Implement PkceService (extracted from AuthService)
  - [x] 5.1 Implement `PkceService`
    - Create `src/app/auth/services/pkce.service.ts` as `@Injectable({ providedIn: 'root' })`
    - `generateCodeVerifier()`: generate 43-128 char random string via `crypto.getRandomValues()`
    - `deriveCodeChallenge(verifier)`: compute `BASE64URL(SHA256(code_verifier))` (S256)
    - `generateState()`: return `crypto.randomUUID()`
    - `generateNonce()`: return `crypto.randomUUID()`
    - `buildAuthorizationUrl(config)`: construct the full authorization URL with `response_type=code`, `client_id`, `redirect_uri`, `scope=openid`, `code_challenge`, `code_challenge_method=S256`, `state`, `nonce`
    - `exchangeCode(code, codeVerifier, tokenEndpoint, redirectUri, clientId)`: POST to token endpoint with `grant_type=authorization_code`, return token response
    - `validateNonce(idToken, expectedNonce)`: decode ID token payload, check `nonce` claim matches. Throw `AuthError('invalid_token')` on mismatch
    - `validateIssuerAndAudience(idToken, expectedIssuer, expectedClientId)`: decode ID token, check `iss` and `aud`. Throw `AuthError('invalid_token')` on mismatch
    - `decodeTokenPayload(token)`: base64url-decode JWT payload segment via `Uint8Array` + `TextDecoder` + `JSON.parse()` (no signature verification). Avoids `atob()` which breaks on non-ASCII/Unicode payloads from custom claims
    - `sessionStorage` persistence for `codeVerifier`, `state`, `nonce` with `clearPkceState()` to wipe after use (single-use). PKCE state is stored in `sessionStorage` (tab-scoped) to survive the full-page redirect to Keycloak and back. `sessionStorage` is cleared on tab close and is not shared across tabs. `clearPkceState()` removes all three keys immediately after the callback exchange, ensuring single-use. This is the standard approach for SPA OIDC Authorization Code Flow with PKCE
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.12, 1.13, 3.3, 3.4, 3.5_
  - [x]* 5.2 Write unit tests for `PkceService`
    - Test `generateCodeVerifier()` produces valid length (43-128 chars)
    - Test `deriveCodeChallenge()` produces correct S256 hash
    - Test `validateNonce()` rejects mismatched nonce with `AuthError('invalid_token')`
    - Test `validateIssuerAndAudience()` rejects mismatched issuer/audience
    - Test `clearPkceState()` wipes all stored PKCE material
    - Test `decodeTokenPayload()` correctly parses JWT payload
    - _Requirements: 1.7, 1.8, 1.9, 1.10, 1.12, 1.13, 3.3, 3.4_

- [x] 6. Checkpoint
  - All tests pass. ✓

- [x] 7. Implement AuthService — Core Orchestrator
  - [x] 7.1 Implement AuthService initialization and login flow
    - Create `src/app/auth/services/auth.service.ts` implementing `IAuthService`
    - `initialize()` method for `APP_INITIALIZER`: emit `initializing` → read env config → call `oidcDiscovery.discover()` → check URL for `code`/`state` → delegate to PkceService for exchange and validation → emit final state before router evaluates guards
    - `login(returnUrl?)` method: validate returnUrl (relative path starting with `/`, reject absolute URLs/different origins/protocol schemes → default to `/`), store returnUrl, delegate PKCE generation to `PkceService`, redirect to authorization URL built by `PkceService`
    - `handleCallback(code, state)` method: validate state via PkceService stored value, delegate code exchange to `PkceService.exchangeCode()`, call `PkceService.clearPkceState()` immediately after exchange (single-use), delegate nonce/iss/aud validation to PkceService, store tokens in TokenStore, clean URL via `history.replaceState()`, emit `authenticated`, start refresh timer, start idle tracker, redirect to stored returnUrl
    - Redirect loop detection: track callback failures, >3 in 10s → navigate to `/auth/error`
    - Register as `APP_INITIALIZER` in app config
    - _Requirements: 1.6, 1.11, 1.14, 1.15, 2.1–2.5, 6.6, 8.1–8.6_
  - [x] 7.2 Implement AuthService silent refresh — core path
    - `refreshTokens()` method with single-flight invariant: `refreshPromise = (async () => { try { ... } finally { refreshPromise = null; } })()`
    - Check idle timeout before refresh → if exceeded, skip refresh, proceed to logout
    - Check max session lifetime (8h) → if exceeded, force re-auth
    - Acquire Web Lock `auth_token_refresh` via `BroadcastChannelService.acquireRefreshLock()`
    - Send refresh token to token endpoint
    - On success: replace all tokens in TokenStore, clear stale flag, decode new access token for `exp`/`iat`, reschedule proactive refresh timer, broadcast `token_refreshed` with generation
    - On network error: retry with backoff (1s, 3s, 5s — 3 attempts). If all fail → do NOT navigate to session-expired (session may still be valid). Instead: emit `unauthenticated` state and let the AuthGuard handle it. The guard calls `login()`, which redirects to Keycloak. If Keycloak is reachable and the session cookie is valid, auth auto-completes. If not, the user sees an honest network error rather than a false "session expired" message
    - Proactive refresh timer: `setTimeout` at `exp - buffer(60s) - skew(30s)` from now
    - _Requirements: 4.1–4.6, 4.8–4.10, 4.14_
  - [ ]* 7.3 Implement AuthService advanced refresh hardening (optional/deferred)
    - Add random jitter (±5-15s) to proactive refresh timer scheduling to prevent synchronized backend spikes
    - Add `invalid_grant` race recovery: on `invalid_grant`, check for recent `token_refreshed` broadcast (<3s) OR higher generation → cross-tab race → mark stale, retry once max. If retry also fails → real session invalidation
    - Add cooldown period (5s) after refresh failure in `refreshIfNeeded()` — skip refresh within cooldown, propagate last failure
    - Add execution-time idle guard: re-check `idleTracker.isIdle()` immediately before network call in `refreshTokens()`
    - _Requirements: 4.7, 4.13, 4.15_
  - [x] 7.4 Implement AuthService `refreshIfNeeded()`, `getAccessToken()`, and `handleUnauthorized()`
    - `refreshIfNeeded()`: if `tokenStore.isStale` OR token is near expiry → call `refreshTokens()`, on failure → clear stale flag via `tokenStore.clearStale()`, propagate error. Near-expiry condition defined explicitly: `isNearExpiry = (exp * 1000) - Date.now() < (refreshBufferSeconds + clockSkewToleranceSeconds) * 1000`
    - `getAccessToken()`: check `sessionStart` → if null return null, check max session lifetime → if exceeded clear TokenStore + emit unauthenticated + return null, else return `tokenStore.access`
    - `handleUnauthorized()`: delegate to `refreshIfNeeded()`, return new access token or null
    - _Requirements: 3.6, 4.9, 4.11_
  - [x] 7.5 Implement AuthService logout flow
    - `logout()` method: attempt refresh token revocation via discovered revocation endpoint (proceed regardless of failure), clear TokenStore, broadcast `logout` (reason: `user`) via BroadcastChannel, redirect to Keycloak end-session endpoint with `id_token_hint` and `post_logout_redirect_uri` (omit `id_token_hint` if unavailable), reset SessionState to unauthenticated
    - Handle unreachable end-session endpoint: still clear local tokens and redirect to login route
    - _Requirements: 5.1–5.9_
  - [x]* 7.6 Write unit tests for AuthService
    - Test initialization flow: OIDC discovery → callback handling → state emission
    - Test login delegates PKCE generation to PkceService
    - Test handleCallback delegates exchange/validation to PkceService and clears PKCE state
    - Test single-use cleanup: code_verifier/state/nonce cleared after callback
    - Test URL cleanup via `history.replaceState()`
    - Test redirect loop detection (>3 failures in 10s)
    - Test returnUrl validation (reject absolute URLs, protocol schemes)
    - Test `getAccessToken()` max session lifetime hard cutoff
    - Test `refreshIfNeeded()` clears stale flag on failure
    - Test single-flight invariant: concurrent callers share same promise
    - Test `refreshPromise` cleanup in `finally` block
    - Test logout flow: revocation attempt, token clear, broadcast, redirect
    - _Requirements: 1.6–1.15, 2.1–2.5, 3.3–3.6, 4.1–4.11, 5.1–5.9_

- [x] 8. Checkpoint
  - All tests pass. ✓

- [x] 9. Implement AuthGuard
  - [x] 9.1 Implement `AuthGuard`
    - Create `src/app/auth/guards/auth.guard.ts` as `@Injectable({ providedIn: 'root' })` implementing `CanActivate`
    - If `snapshot.status === 'initializing'` → wait for initialization to complete
    - If `snapshot.status === 'authenticated'` → return true
    - Else → call `authService.login(state.url)`, return false
    - No refresh logic, no token checks, no timing decisions
    - _Requirements: 6.1–6.5_
  - [x]* 9.2 Write unit tests for `AuthGuard`
    - Test allows navigation when authenticated
    - Test denies navigation and calls `login()` when unauthenticated
    - Test waits for initialization to complete before evaluating
    - Test passes current URL to `login()` for return URL storage
    - _Requirements: 6.1–6.5_

- [x] 10. Implement AuthInterceptor (simplified)
  - [x] 10.1 Implement `AuthInterceptor`
    - Create `src/app/auth/interceptors/auth.interceptor.ts` implementing `HttpInterceptor`
    - Origin check: skip credential attachment if request URL origin !== `apiGatewayOrigin`
    - Attach credentials via `CredentialStrategy`
    - 401 handling (simplified — no classification heuristic, no generation stamping):
      - If request has `RETRIED` context token → delegate to `authService.handleUnauthorized()` (session invalid), propagate error
      - Else → call `authService.handleUnauthorized()`
      - On refresh success + idempotent (GET/HEAD/OPTIONS) → clone with `RETRIED=true`, replay once
      - On refresh success + non-idempotent (POST/PUT/PATCH/DELETE) → reject with `AuthSessionRefreshedError`
      - On refresh failure → propagate error
    - Backpressure: max 5 concurrent replayed requests after refresh. Overflow beyond 5 → reject with `AuthSessionRefreshedError` (same as non-idempotent). No queuing, no silent drops — explicit rejection the caller can handle
    - Credential redaction: never include Authorization headers in logged errors
    - _Requirements: 7.1–7.6, 7.8_
  - [x]* 10.2 Write unit tests for `AuthInterceptor`
    - Test credential attachment only for API Gateway origin
    - Test skips credential attachment for non-API-Gateway origins (Keycloak, CDN)
    - Test 401 handling triggers refresh and replays idempotent requests
    - Test 401 handling rejects non-idempotent requests with `AuthSessionRefreshedError`
    - Test already-retried requests are not retried again
    - Test credential redaction in error responses
    - Test backpressure limit on concurrent replays
    - _Requirements: 7.1–7.6, 7.8_
  - [ ]* 10.3 Implement advanced interceptor hardening (optional/deferred)
    - Add stale check: if `tokenStore.isStale` → await `authService.refreshIfNeeded()` before sending request
    - Add generation stamping on outgoing requests
    - Add 401 classification heuristic: check stamped generation vs current generation, check token near-expiry and stale flag before triggering refresh
    - _Requirements: 7.5, 7.9_

- [x] 11. Implement BroadcastChannelService
  - [x] 11.1 Implement `BroadcastChannelService`
    - Create `src/app/auth/services/broadcast-channel.service.ts` as `@Injectable({ providedIn: 'root' })`
    - Create `BroadcastChannel('auth_sync')` if API available, else degrade gracefully (no-op)
    - `AuthBroadcastMessage` discriminated union: `logout` (reason + timestamp), `token_refreshed` (timestamp + generation), `user_active` (timestamp)
    - `broadcast(message)`, `onMessage(callback)`, `destroy()` methods
    - Validate incoming message structure against `AuthBroadcastMessage` schema — silently ignore malformed messages
    - `acquireRefreshLock<T>(fn)`: use `navigator.locks.request('auth_token_refresh', fn)` if Web Locks available, else fallback to direct `fn()` call
    - _Requirements: 11.1–11.9_
  - [x] 11.2 Wire BroadcastChannel listeners into AuthService
    - On `logout` broadcast received: clear TokenStore, reset SessionState, redirect based on reason (`user` → login, `expired` → `/auth/session-expired`)
    - On `token_refreshed` broadcast received: check generation (drop if `incomingGeneration <= localGeneration`), mark tokens stale if higher generation, trigger `refreshIfNeeded()`
    - On `user_active` broadcast received: forward to IdleTrackerService
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.6, 11.8_
  - [x]* 11.3 Write unit tests for `BroadcastChannelService`
    - Test message broadcasting and receiving
    - Test malformed message rejection
    - Test graceful degradation when BroadcastChannel API unavailable
    - Test graceful degradation when Web Locks API unavailable
    - Test `acquireRefreshLock` with and without Web Locks
    - _Requirements: 11.7, 11.8, 11.9_

- [x] 12. Implement IdleTrackerService (simplified)
  - [x] 12.1 Implement `IdleTrackerService`
    - Create `src/app/auth/services/idle-tracker.service.ts` as `@Injectable({ providedIn: 'root' })`
    - `start()`: listen to `mousemove`, `keydown`, `touchstart` (throttled to 1 event/10s), listen to `visibilitychange`, start check interval (every 30s), subscribe to BroadcastChannel `user_active` events
    - Private `recordActivity()`: update `lastActivityTimestamp = Date.now()`, reset `warningShown`, broadcast `user_active` to other tabs. No public `recordActivity()` method exposed
    - Private `onCrossTabActivity(timestamp)`: update `lastActivityTimestamp = max(current, received)`. Do NOT reset `warningShown` (only local DOM activity resets warning). No drift guard, no local activity guard (simplified per agreement)
    - Private `checkIdle()`: if elapsed >= `idleTimeout` → trigger logout, if elapsed >= `warningThreshold` (idleTimeout - 2min) && !warningShown → show PrimeNG Toast warning
    - On `visibilitychange` to `visible`: check elapsed immediately, if exceeded → logout (hidden time counts toward inactivity)
    - `isIdle` getter for AuthService pre-refresh check
    - `stop()`: remove all listeners, clear interval
    - _Requirements: 12.1–12.7_
  - [x]* 12.2 Write unit tests for `IdleTrackerService`
    - Test activity recording updates timestamp
    - Test idle timeout triggers logout after configured period
    - Test warning toast shown 2 minutes before timeout
    - Test activity after warning resets timer
    - Test `visibilitychange` to visible checks elapsed time immediately
    - Test hidden time counts toward inactivity (no pause)
    - Test cross-tab activity updates local timestamp
    - Test `recordActivity()` is not publicly accessible
    - _Requirements: 12.1–12.7_

- [x] 13. Checkpoint
  - All tests pass. ✓

- [x] 14. Implement auth pages and welcome page
  - [x] 14.1 Implement `CallbackComponent`
    - Create `src/app/auth/pages/callback/callback.component.ts` as standalone component
    - Read `code` and `state` from query params
    - Delegate to `AuthService.handleCallback()`
    - Show PrimeNG `ProgressSpinner` during token exchange
    - On error → navigate to `/auth/error`
    - _Requirements: 2.1_
  - [x] 14.2 Implement `SessionExpiredComponent`
    - Create `src/app/auth/pages/session-expired/session-expired.component.ts` as standalone component
    - Display "Session Expired" message with login button using PrimeNG Card + Button
    - Login button calls `AuthService.login()`
    - Use i18n keys: `auth.sessionExpired.title`, `auth.sessionExpired.message`, `auth.sessionExpired.loginButton`
    - _Requirements: 15.1, 15.4, 15.5_
  - [x] 14.3 Implement `AuthErrorComponent`
    - Create `src/app/auth/pages/auth-error/auth-error.component.ts` as standalone component
    - Display "Authentication Service Unavailable" with retry button using PrimeNG Card + Button
    - Retry button calls `OidcDiscoveryService.discover()` and navigates to `/` on success
    - Use i18n keys: `auth.error.title`, `auth.error.message`, `auth.error.retryButton`
    - _Requirements: 15.2, 15.4, 15.5_
  - [x] 14.4 Implement `IdleWarningComponent` (toast trigger)
    - Create `src/app/auth/components/idle-warning/idle-warning.component.ts`
    - Integrate with PrimeNG Toast via `MessageService` for idle warning display
    - Use i18n key: `auth.idle.warning`
    - _Requirements: 12.3, 15.4_
  - [x] 14.5 Implement `WelcomeComponent`
    - Create `src/app/features/welcome/welcome.component.ts` as standalone component
    - Display user's display name from `SessionState.user.name` or `preferredUsername`
    - Logout button triggers `AuthService.logout()`
    - Use PrimeNG Card + Button + Toolbar
    - Use i18n keys: `auth.welcome.greeting`, `auth.welcome.logoutButton`
    - _Requirements: 13.1–13.5_

- [x] 15. Set up routing and APP_INITIALIZER wiring
  - [x] 15.1 Create auth routes and app routing configuration
    - Create `src/app/auth/auth.routes.ts` with routes: `/auth/callback` → `CallbackComponent`, `/auth/session-expired` → `SessionExpiredComponent`, `/auth/error` → `AuthErrorComponent`
    - Configure app routes: `/` → `WelcomeComponent` (protected by `AuthGuard`), `**` → redirect to `/`
    - Auth routes are unguarded (pre-authentication states)
    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 15.2 Wire `AuthService.initialize()` as `APP_INITIALIZER`
    - Register `AuthService.initialize()` in the app config as an `APP_INITIALIZER` provider
    - Ensure initialization completes before Angular router evaluates any route guards
    - Provide `AuthInterceptor` as `HTTP_INTERCEPTORS`
    - Provide `CredentialStrategy` based on environment config
    - _Requirements: 2.2, 7.1_

- [x] 16. Implement i18n translation files
  - [x] 16.1 Create English and Portuguese translation files
    - Create `src/locales/en/auth.json` with all auth namespace keys: `login.redirecting`, `welcome.greeting`, `welcome.logoutButton`, `sessionExpired.title`, `sessionExpired.message`, `sessionExpired.loginButton`, `error.title`, `error.message`, `error.retryButton`, `idle.warning`, `errors.networkError`, `errors.refreshFailed`
    - Create `src/locales/pt/auth.json` with Portuguese translations for all the same keys
    - Ensure fallback from `pt` to `en` when keys are missing
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 17. Implement Content Security Policy
  - [x] 17.1 Configure CSP for development and production
    - Create/update `src/index.html` with development CSP `<meta>` tag: `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, `connect-src 'self' http://localhost:8180 http://localhost:8080`, `img-src 'self' data:`, `font-src 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, `base-uri 'none'`
    - Add frame-busting guard script in `index.html`
    - Add security headers comment/documentation for production API Gateway configuration (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`)
    - No `unsafe-inline` or `unsafe-eval` in `script-src` in any environment
    - _Requirements: 14.1–14.9_

- [x] 18. Final checkpoint
  - All 121 tests pass across 9 test files. ✓
  - Build passes (`pnpm build`). ✓
  - All 16 requirements covered by implementation tasks. ✓
  - All auth routes correctly wired. ✓
  - Environment configuration complete. ✓

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- All code uses TypeScript with Angular standalone components
- Task 5 (PkceService) extracts PKCE/code-exchange/validation concerns from AuthService for cleaner separation
- Task 7.3 (advanced refresh hardening) and Task 10.3 (advanced interceptor hardening) are deferred — they are BFF-bound and can be added later without changing the core flow
- Task 12.1 (IdleTrackerService) uses simplified cross-tab sync without drift/local-activity guards
- ⚠️ This entire feature involves authentication logic and requires explicit security review before merging per the security policy
