# Design Document: Login UI

## Overview

This design document describes the technical architecture for the login-ui feature of platform-frontend. It covers the Angular module structure, service design, token lifecycle, route protection, cross-tab synchronization, idle timeout, CSP hardening, error UX, and i18n integration. The design implements all 16 requirements from the approved requirements document.

## Architecture

### Module Boundary

All authentication concerns live under `src/app/auth/` using Angular standalone components and injectable services. This module is self-contained — domain feature modules depend on it only for guards and interceptors.

```
src/app/auth/
├── services/
│   ├── auth.service.ts              # Core orchestrator (single-flight refresh, PKCE, state, nonce)
│   ├── token-store.service.ts       # In-memory token storage
│   ├── oidc-discovery.service.ts    # OIDC Discovery fetch + cache + validation
│   ├── credential-strategy.ts       # Pluggable credential attachment (SPA Bearer / BFF Cookie)
│   ├── idle-tracker.service.ts      # Idle timeout with absolute timestamps
│   └── broadcast-channel.service.ts # Cross-tab messaging + Web Locks refresh coordination
├── guards/
│   └── auth.guard.ts                # Dumb guard — checks status, delegates everything
├── interceptors/
│   └── auth.interceptor.ts          # Credential attachment + 401 handling + stale blocking
├── models/
│   ├── session-state.model.ts       # SessionState, SessionStatus, UserProfile types
│   ├── auth-errors.model.ts         # AuthSessionRefreshedError, OidcDiscoveryError, AuthErrorCode
├── pages/
│   ├── callback/                    # OAuth callback handler
│   ├── session-expired/             # Session expired page
│   └── auth-error/                  # Auth service unavailable page
├── components/
│   └── idle-warning/                # Idle timeout warning toast trigger
└── auth.routes.ts                   # Auth-related route definitions
```

### Welcome Page (outside AuthModule)

```
src/app/features/welcome/
├── welcome.component.ts
├── welcome.component.html
└── welcome.routes.ts
```

## Component & Service Design

### 1. OidcDiscoveryService

Fetches, validates, and caches the OIDC configuration from Keycloak.

**Implements:** Requirement 1 (AC 1–5), Requirement 10 (AC 1–4)

```typescript
@Injectable({ providedIn: 'root' })
class OidcDiscoveryService {
  private config: OidcConfiguration | null;

  // Fetches /.well-known/openid-configuration
  // Uses fetch() with { redirect: 'error' } to reject cross-origin redirects (Req 1 AC 1)
  // Validates issuer matches expected value (Req 1 AC 2)
  // Validates all endpoint origins match issuer origin (Req 1 AC 3)
  // Retries with exponential backoff: 2s, 4s, 8s — max 3 attempts (Req 1 AC 5)
  // Throws OidcDiscoveryError on permanent failure
  discover(): Promise<OidcConfiguration>

  get authorizationEndpoint(): string
  get tokenEndpoint(): string
  get endSessionEndpoint(): string
  get revocationEndpoint(): string | null
  get jwksUri(): string
}

interface OidcConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  revocation_endpoint?: string;
  jwks_uri: string;
}
```

Configuration inputs (from environment):
- `KEYCLOAK_BASE_URL` — e.g., `http://localhost:8180`
- `KEYCLOAK_REALM` — e.g., `platform`
- `KEYCLOAK_CLIENT_ID` — e.g., `platform-frontend`

Expected issuer: `{KEYCLOAK_BASE_URL}/realms/{KEYCLOAK_REALM}`.

The `fetch()` call uses `{ redirect: 'error' }` to prevent following redirects to a different origin (DNS poisoning defense). If the browser follows a redirect, the fetch rejects.

### 2. TokenStoreService

In-memory token storage. No persistence to any browser storage API.

**Implements:** Requirement 3 (AC 1–2, 6)

```typescript
@Injectable({ providedIn: 'root' })
class TokenStoreService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private idToken: string | null = null;
  private sessionStartTimestamp: number | null = null;
  private _isStale = false;
  private _generation = 0;
  private _authSessionId: string | null = null;  // crypto.randomUUID() per login, for debugging

  store(tokens: TokenSet): void    // Replace all tokens, record sessionStart if first store, increment generation, set authSessionId on first store
  clear(): void                     // Null all tokens, reset sessionStart, reset generation, clear authSessionId
  markStale(): void                 // Set isStale = true (cross-tab refresh received)
  clearStale(): void                // Set isStale = false (after local refresh)

  get access(): string | null
  get refresh(): string | null
  get id(): string | null
  get sessionStart(): number | null
  get hasTokens(): boolean
  get isStale(): boolean
  get generation(): number          // Monotonically increasing counter, used to ignore out-of-order broadcasts
  get authSessionId(): string | null // Unique per-login ID for debugging multi-tab issues
}

interface TokenSet {
  access_token: string;
  refresh_token: string;
  id_token: string;
}
```

Tokens are plain class properties — garbage collected when the tab closes. No localStorage, sessionStorage, or cookie writes. The `isStale` flag is set when a cross-tab `token_refreshed` broadcast is received, signaling the interceptor to pause requests until refresh completes.

### 3. AuthService — Core Orchestrator

All authentication logic flows through this service. Guards and interceptors delegate to it — they never make independent auth decisions.

**Implements:** Requirements 1–8, 11–12

```typescript
// Stable interface contract for SPA ↔ BFF swap (Design Constraint)
interface IAuthService {
  login(returnUrl?: string): void;
  logout(): Promise<void>;
  getAccessToken(): string | null;
  sessionState$: Observable<SessionState>;
  refreshIfNeeded(): Promise<void>;
  handleUnauthorized(): Promise<string | null>;
}

@Injectable({ providedIn: 'root' })
class AuthService implements IAuthService {
  sessionState$: Observable<SessionState>;
  get snapshot(): SessionState;
  get isInitialized(): boolean;

  initialize(): Promise<void>;           // APP_INITIALIZER
  login(returnUrl?: string): void;       // PKCE + state + nonce redirect
  handleCallback(code: string, state: string): Promise<void>;
  logout(): Promise<void>;               // Revoke + clear + broadcast + redirect
  refreshTokens(): Promise<boolean>;     // Single-flight refresh
  refreshIfNeeded(): Promise<void>;      // Ensure tokens are fresh; clears stale flag on failure
  handleUnauthorized(): Promise<string | null>;
  getAccessToken(): string | null;       // Returns null if max session lifetime exceeded
}
```

```typescript
interface SessionState {
  status: 'initializing' | 'authenticated' | 'unauthenticated';
  user: UserProfile | null;
  isRefreshing: boolean;   // True while Silent_Refresh is in-flight
  isStale: boolean;        // True after cross-tab token_refreshed, before local refresh
}

interface UserProfile {
  sub: string;
  preferredUsername: string;
  name: string;
  email: string;
}
```

#### Auth Error Taxonomy

A central error classification shared across AuthService, AuthInterceptor, and UI components. Prevents ad-hoc error interpretation and ensures consistent handling, logging, and user messaging.

```typescript
type AuthErrorCode =
  | 'network_error'        // Fetch/XHR failure, timeout, DNS resolution
  | 'invalid_grant'        // Refresh token expired, revoked, or rotated-out
  | 'discovery_failed'     // OIDC discovery fetch failed after retries
  | 'invalid_token'        // Nonce mismatch, issuer mismatch, aud mismatch
  | 'session_expired'      // Max session lifetime exceeded or idle timeout
  | 'redirect_loop'        // >3 auth failures in 10s window
  | 'config_error';        // Missing environment config (baseUrl, realm, clientId)

class AuthError extends Error {
  constructor(
    public readonly code: AuthErrorCode,
    message: string,
    public readonly cause?: unknown
  ) { super(message); }
}
```

All auth-related errors thrown or propagated by AuthService, OidcDiscoveryService, and AuthInterceptor SHALL use `AuthError` with the appropriate `AuthErrorCode`. This gives the UI a single discriminant (`error.code`) for mapping errors to i18n keys and user actions (retry, re-login, show error page).

#### Initialization Flow (APP_INITIALIZER)

```
initialize():
  1. Emit SessionState { status: 'initializing' }
  2. Read config from environment (KEYCLOAK_BASE_URL, REALM, CLIENT_ID)
     - If any config missing → log error, emit { status: 'unauthenticated' }, return
  3. Call oidcDiscovery.discover()
     - On failure (after exponential backoff retries) → navigate to /auth/error, return
  4. Check URL for ?code=...&state=...
     a. If present:
        - Check redirect loop counter (>3 in 10s → navigate to /auth/error)
        - Validate state against stored value → reject if mismatch
        - Exchange code for tokens via token endpoint
        - Immediately clear code_verifier, state, nonce from memory (single-use)
        - Validate nonce in ID token → on mismatch: throw AuthError('invalid_token'),
          clear TokenStore, navigate to /auth/error. DO NOT auto-retry login.
        - Validate iss and aud in ID token → on mismatch: throw AuthError('invalid_token'),
          clear TokenStore, navigate to /auth/error. DO NOT auto-retry login.
          (Defensive, not trust boundary — catches misconfigured environments early)
        - Store tokens in TokenStore
        - Clean URL via history.replaceState() (remove code/state params)
        - Emit SessionState { status: 'authenticated' }
        - Start proactive refresh timer
        - Start idle tracker
        - Redirect to stored returnUrl (validated as relative path) or "/"
     b. If not present:
        - TokenStore is empty (no persistence) → emit { status: 'unauthenticated' }
  5. Initialize BroadcastChannel listener
```

#### PKCE + State + Nonce Generation

```
login(returnUrl?):
  1. Validate returnUrl: must be relative path starting with "/"
     - Reject absolute URLs, different origins, protocol schemes → default to "/"
  2. Store validated returnUrl in memory
  3. Generate code_verifier (43-128 char random, RFC 7636) via crypto.getRandomValues()
  4. Derive code_challenge = BASE64URL(SHA256(code_verifier))
  5. Generate state = crypto.randomUUID()
  6. Generate nonce = crypto.randomUUID()
  7. Store code_verifier, state, nonce in sessionStorage (tab-scoped, survives the redirect to Keycloak, cleared immediately after use in handleCallback)
  8. Redirect to authorization_endpoint with:
     - response_type=code, client_id, redirect_uri, scope=openid
     - code_challenge + code_challenge_method=S256
     - state, nonce
```

#### Silent Refresh Orchestration (Single-Flight)

**Hard Invariant: `refreshPromise` cleanup.** The `refreshPromise` field MUST be assigned only via an immediately-invoked async block wrapped in `try/finally`, where `finally` unconditionally sets `refreshPromise = null`. No code path — exception, early return, race retry, Web Lock release — may skip this cleanup. If `refreshPromise` is never cleared, all subsequent auth operations (interceptor 401 handling, proactive refresh, stale recovery) will await a promise that never resolves, permanently freezing the auth system.

```
refreshTokens():
  0. INVARIANT: refreshPromise = (async () => { try { ... } finally { refreshPromise = null; } })()
  1. SINGLE-FLIGHT CHECK: if refreshPromise exists → return it (all callers share one promise)
  2. Check idle timeout → if exceeded, skip refresh, proceed to logout
  3. PRE-REFRESH EXPIRY CHECK: decode current access token exp
     - If access token already expired → skip proactive refresh, delegate to 401 flow
       (prevents wasting a refresh on a token that's already dead)
  4. Check max session lifetime (default 8h since sessionStart)
     - If exceeded → force re-auth (clear + redirect to login)
  5. Acquire Web Locks API lock "auth_token_refresh" (cross-tab coordination)
     - If Web Locks unavailable → proceed without lock (fallback)
  6. IDLE GUARD (execution-time): re-check idleTracker.isIdle() immediately before network call
     - If idle → abort refresh, release Web Lock, proceed to logout
     (closes the race window between scheduling and execution)
  7. Send refresh_token to token endpoint
  8. On success:
     - Replace ALL tokens in TokenStore, clear isStale flag
     - Decode new access token for exp/iat (atob + JSON.parse, no verification)
     - Reschedule proactive refresh timer
     - Broadcast "token_refreshed" with generation counter to other tabs
     - Release Web Lock
     - Resolve all queued callers with success
  9. On "invalid_grant" error:
     - MULTI-TAB RACE CHECK: if a "token_refreshed" broadcast was received within the
       last 3 seconds OR a higher generation counter was observed from another tab
       → treat as cross-tab rotation race, not real session death.
       BUT: if this is already a retry from a previous invalid_grant race recovery
       (max 1 retry per flow) → treat as real session invalidation (prevents recursion).
       On first race detection:
       mark tokens stale, release Web Lock, call refreshIfNeeded() (which will acquire
       the lock and refresh against the current token)
     - Otherwise → treat as real session invalidation:
       clear TokenStore, broadcast "logout" (reason: 'expired') to other tabs, release Web Lock,
       navigate to /auth/session-expired
  10. On network error:
     - Retry with backoff: 3 attempts at 1s, 3s, 5s delays
     - If all retries fail → treat as session invalidation
     - Release Web Lock
```

Proactive refresh timer: `setTimeout` at `exp - buffer(60s) - skew(30s) ± jitter(5-15s)` from now.
The random jitter (±5-15s) prevents all tabs from hitting Keycloak at the same instant, reducing backend spikes.
Before scheduling, check idle state — if idle timeout exceeded, skip and logout.

#### getAccessToken() — Max Session Lifetime Hard Cutoff

```
getAccessToken():
  1. If tokenStore.sessionStart is null → return null
  2. If (Date.now() - tokenStore.sessionStart) >= maxSessionLifetime → 
     clear TokenStore, emit unauthenticated, return null
  3. Return tokenStore.access
```

This is the single choke point for all token consumers (interceptor, direct callers). It guarantees the 8h hard cutoff regardless of refresh timing — even if no proactive refresh fires, the token becomes inaccessible once the session lifetime is exceeded.

#### refreshIfNeeded() — Stale Recovery with Failure Safety

```
refreshIfNeeded():
  1. COOLDOWN CHECK: if (Date.now() - lastRefreshFailureAt) < refreshCooldownMs (default 5s)
     → skip refresh, propagate last failure reason
     (prevents refresh loops when queued 401 requests re-trigger refresh under partial network failure)
  2. If tokenStore.isStale OR token is near expiry → call refreshTokens()
  3. On success → return (stale flag already cleared by refreshTokens)
  4. On failure → clear stale flag via tokenStore.clearStale(),
     record lastRefreshFailureAt = Date.now(), propagate error
```

The stale flag MUST be cleared on failure to prevent the interceptor deadlock: if `refreshIfNeeded()` fails and the stale flag remains set, every subsequent request would await a stale resolution that will never come. The cooldown window (default 5s) prevents a secondary loop where queued requests hit 401, each re-triggering `refreshIfNeeded()` in rapid succession under partial network failure.

### 4. CredentialStrategy

Pluggable abstraction for BFF-readiness.

**Implements:** Requirement 7 (AC 1, 6), BFF-Ready Design Constraint

```typescript
interface CredentialStrategy {
  attachCredentials(req: HttpRequest<unknown>): HttpRequest<unknown>;
}

@Injectable()
class BearerTokenStrategy implements CredentialStrategy {
  // Attaches Authorization: Bearer <access_token>
  // Attaches X-Requested-With: XMLHttpRequest (anti-CSRF for future BFF)
  attachCredentials(req): HttpRequest<unknown>
}

@Injectable()
class BffCookieStrategy implements CredentialStrategy {
  // No token attachment — cookies are automatic
  // Still attaches X-Requested-With: XMLHttpRequest
  attachCredentials(req): HttpRequest<unknown>
}
```

Active strategy selected via environment config. Default: `BearerTokenStrategy`.

### 5. AuthGuard

Intentionally simple. No refresh logic, no auth decisions.

**Implements:** Requirement 6

```typescript
@Injectable({ providedIn: 'root' })
class AuthGuard implements CanActivate {
  canActivate(route, state):
    1. If snapshot.status === 'initializing' → wait for initialization to complete
    2. If snapshot.status === 'authenticated' → return true
    3. Else → call authService.login(state.url), return false
}
```

The guard never triggers refresh, never checks token validity, never makes timing decisions. It reads the current status and delegates.

### 6. AuthInterceptor

Credential attachment + 401 handling + stale token blocking + credential redaction.

**Implements:** Requirement 7

```typescript
@Injectable()
class AuthInterceptor implements HttpInterceptor {
  private static RETRIED = new HttpContextToken<boolean>(() => false);

  intercept(req, next):
    1. STALE CHECK: if tokenStore.isStale → await authService.refreshIfNeeded()
       - If refreshIfNeeded() fails → clear stale flag, propagate error (prevents deadlock)
    2. ORIGIN CHECK: if req URL origin !== apiGatewayOrigin → skip credential attachment
    3. Attach credentials via CredentialStrategy + stamp request with current tokenStore.generation
    4. On 401 response:
       a. If req has RETRIED context → delegate to authService (session invalid)
       b. 401 CLASSIFICATION:
          - If request's stamped generation < tokenStore.generation → token was refreshed
            after this request was sent. Allow one refresh path (the request used a stale token).
          - Else if token is NOT near expiry AND isStale is false
            → DO NOT refresh. Propagate the 401 as-is (likely backend deploy, permission
            change, or gateway misrouting — not a token problem)
       c. Trigger authService.handleUnauthorized()
       d. On refresh success:
          - IDEMPOTENT (GET, HEAD, OPTIONS): clone req with RETRIED=true, replay once
          - NON-IDEMPOTENT (POST, PUT, PATCH, DELETE): reject with AuthSessionRefreshedError
            { retryable: true, method: req.method, url: req.url }
       e. On refresh failure → propagate error
    5. BACKPRESSURE: after refresh, replay max 5 concurrent queued requests
    6. CREDENTIAL REDACTION: error handlers SHALL NOT include Authorization headers
       in logged HttpErrorResponse objects
}
```

Note: Client-side request rate limiting is intentionally omitted. It throttles legitimate page-load bursts, provides no meaningful defense against XSS exfiltration, and belongs at the API Gateway layer. The only client-side throttle is the replay concurrency limit (default: 5) which prevents overwhelming the API Gateway after a token refresh.
```

The `AuthSessionRefreshedError` gives consuming code a standard contract to implement retry UX for non-idempotent requests.

### 7. BroadcastChannelService

Cross-tab messaging with schema validation and Web Locks coordination. All incoming messages are treated as untrusted hints that trigger local verification — they never cause direct state changes.

**Implements:** Requirement 11

```typescript
type AuthBroadcastMessage =
  | { type: 'logout'; reason: 'user' | 'expired'; timestamp: number }
  | { type: 'token_refreshed'; timestamp: number; generation: number }
  | { type: 'user_active'; timestamp: number };

@Injectable({ providedIn: 'root' })
class BroadcastChannelService {
  private channel: BroadcastChannel | null;

  constructor():
    - If BroadcastChannel available → create channel "auth_sync"
    - Else → degrade gracefully (no-op)

  broadcast(message: AuthBroadcastMessage): void
  onMessage(callback: (msg: AuthBroadcastMessage) => void): void
  destroy(): void
}
```

Incoming messages are validated against the `AuthBroadcastMessage` discriminated union. Unknown types, missing fields, or malformed messages are silently ignored. For `token_refreshed` messages, a strict monotonic ordering rule applies: if `incomingGeneration <= tokenStore.generation`, the message is stale and SHALL be silently dropped. This turns the cross-tab sync from eventually consistent to strictly monotonic — out-of-order or delayed deliveries from background-throttled tabs cannot cause stale state transitions.

Messages are untrusted hints — receiving a `logout` broadcast triggers a local token check and cleanup (not blind trust), receiving `token_refreshed` (with a higher generation) marks tokens as stale and triggers a local refresh (not direct token replacement), and receiving `user_active` updates the local timestamp but does not reset warning state. An XSS script posting crafted messages to the channel cannot force state transitions — only trigger verification flows that the local tab would perform anyway.

The `logout` message includes a `reason` field (`'user'` for user-initiated logout, `'expired'` for session expiration / idle timeout / `invalid_grant`). Receiving tabs use this to route to the appropriate page: `'user'` → login page, `'expired'` → session-expired page. This provides semantic distinction for UX, audit trails, and future BFF parity at zero complexity cost.

The `user_active` message type enables cross-tab idle timeout synchronization — if the user is active in any tab, all tabs update their `lastActivityTimestamp`.

Web Locks coordination for refresh:
```typescript
async acquireRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (navigator.locks) {
    return navigator.locks.request('auth_token_refresh', fn);
  }
  return fn(); // Fallback: no lock
}
```

### 8. IdleTrackerService

Tracks user activity with absolute timestamps. No pause on hidden tabs. Activity recording is private — only triggered by DOM event listeners owned by this service. This prevents XSS scripts from calling `recordActivity()` programmatically to keep the session alive indefinitely.

**Implements:** Requirement 12

```typescript
@Injectable({ providedIn: 'root' })
class IdleTrackerService {
  private lastActivityTimestamp: number;
  private warningShown = false;
  private idleTimeout: number;          // default 15 min (configurable)
  private warningThreshold: number;     // idleTimeout - 2 min

  start(): void
    - Listen to: mousemove, keydown, touchstart (throttled to 1 event/10s)
    - Listen to: visibilitychange
    - Start check interval (every 30s)
    - Subscribe to BroadcastChannel 'user_active' events

  private recordActivity(): void       // PRIVATE — only called from DOM listeners
    - Update lastActivityTimestamp = Date.now()
    - Reset warningShown
    - Broadcast { type: 'user_active', timestamp } to other tabs

  private onCrossTabActivity(timestamp: number): void
    - DRIFT GUARD: if receivedTimestamp > Date.now() + allowedSkew (default 5s) → ignore
    - LOCAL ACTIVITY GUARD: if local tab has been completely idle for >= idleTimeout → ignore
      (prevents a compromised tab from keeping all tabs alive indefinitely)
    - Update lastActivityTimestamp = max(current, received)
    - Does NOT reset warningShown (only local DOM activity resets warning)

  private checkIdle(): void
    - elapsed = Date.now() - lastActivityTimestamp
    - If elapsed >= idleTimeout → trigger logout
    - If elapsed >= warningThreshold && !warningShown → show warning toast
    - On visibilitychange to "visible":
      - Check elapsed immediately
      - If exceeded → logout (hidden time counts toward inactivity)

  get isIdle(): boolean  // Used by AuthService before proactive refresh

  stop(): void
}
```

The warning uses PrimeNG Toast via MessageService.

Design decision: `recordActivity()` is private to prevent XSS scripts from programmatically resetting the idle timer. Only real DOM events (mousemove, keydown, touchstart) can extend the session. Cross-tab `user_active` broadcasts update the timestamp but originate from DOM listeners in the sending tab, so the trust chain is: DOM event → local `recordActivity()` → broadcast → remote `onCrossTabActivity()`. An XSS script in one tab cannot keep other tabs alive either, since `onCrossTabActivity()` only updates the timestamp — it doesn't reset the warning state, so the local tab's own DOM inactivity still triggers the warning flow. Additionally, `onCrossTabActivity()` applies two guards: a timestamp drift check (rejects future timestamps beyond a 5s skew) and a local activity check (rejects cross-tab activity if the local tab itself has been completely idle for the full timeout). This prevents a compromised tab from broadcasting `user_active` indefinitely to keep all tabs alive.

### 9. Pages

#### CallbackComponent
- Route: `/auth/callback`
- Reads `code` and `state` from query params
- Delegates to `AuthService.handleCallback()`
- Shows a PrimeNG ProgressSpinner during token exchange
- On error → navigates to `/auth/error`

#### SessionExpiredComponent
- Route: `/auth/session-expired`
- Displays "Session Expired" message with login button
- PrimeNG Card + Button
- i18n keys: `auth.sessionExpired.title`, `auth.sessionExpired.message`, `auth.sessionExpired.loginButton`

#### AuthErrorComponent
- Route: `/auth/error`
- Displays "Authentication Service Unavailable" with retry button
- Retry calls `OidcDiscoveryService.discover()` again
- i18n keys: `auth.error.title`, `auth.error.message`, `auth.error.retryButton`

### 10. WelcomeComponent

- Route: `/` (default, protected by AuthGuard)
- Displays user's display name from `SessionState.user.name` or `preferredUsername`
- Logout button triggers `AuthService.logout()`
- PrimeNG Card + Button + Toolbar
- i18n keys: `auth.welcome.greeting`, `auth.welcome.logoutButton`

## Token Lifecycle Diagram

```
[App Bootstrap]
      │
      ▼
  Emit { status: 'initializing' }
      │
      ▼
  Fetch OIDC Discovery (exponential backoff: 2s, 4s, 8s)
      │
      ├── Fail (after 3 retries) → /auth/error
      │
      ▼
  Check URL for ?code=&state=
      │
      ├── YES: Check redirect loop counter (>3 in 10s → /auth/error)
      │         Validate state → Exchange code → Clear code_verifier/state/nonce
      │         Validate nonce → Clean URL via replaceState
      │         │
      │         ├── Fail → login()
      │         │
      │         ▼
      │     Emit { status: 'authenticated', isRefreshing: false, isStale: false }
      │     Start refresh timer (exp - 90s)
      │     Start idle tracker
      │     Redirect to validated returnUrl
      │
      └── NO: Emit { status: 'unauthenticated' }
              │
              ▼
          Auth Guard → login() → Keycloak redirect
                                    │
                                    ▼
                              [User authenticates at Keycloak]
                                    │
                                    ▼
                              Redirect to /auth/callback?code=...&state=...
                                    │
                                    ▼
                              [App Bootstrap again — enters YES branch]
```

```
[During Session]
      │
      ├── Proactive refresh timer fires
      │     Check idle state first → if idle exceeded → logout (skip refresh)
      │     Acquire Web Lock → refreshTokens()
      │     ├── Success → Replace tokens, reschedule, broadcast token_refreshed
      │     └── Fail (invalid_grant) → Check for recent token_refreshed broadcast
      │           ├── Recent broadcast (< 3s) → Cross-tab race, mark stale, retry
      │           └── No recent broadcast → Session expired, broadcast logout
      │
      ├── 401 from API → Interceptor classifies: token near expiry or stale?
      │     ├── YES → delegates to handleUnauthorized()
      │     │     Single-flight: shares existing refreshPromise if in-flight
      │     │     ├── Success + GET/HEAD/OPTIONS → Replay request once
      │     │     ├── Success + POST/PUT/PATCH/DELETE → Reject with AuthSessionRefreshedError
      │     │     └── Fail → Session expired
      │     └── NO → Propagate 401 as-is (backend/gateway issue, not token)
      │
      ├── Tokens marked stale (cross-tab token_refreshed received)
      │     Interceptor pauses outgoing requests → refreshIfNeeded() → resume
      │
      ├── Idle timeout (15 min default, absolute timestamp, no pause on hidden)
      │     Cross-tab activity sync via user_active broadcast
      │     Warning toast at 13 min → Logout at 15 min
      │
      ├── Max session lifetime (8h) exceeded → Force re-auth
      │
      ├── BroadcastChannel "logout" received → Clear tokens
      │     reason: 'user' → redirect to login
      │     reason: 'expired' → redirect to /auth/session-expired
      │
      ├── New tab opened → Empty TokenStore → Redirect to Keycloak
      │     Keycloak session valid → Auto-complete auth → Brief redirect flash
      │
      └── User clicks logout
            Revoke refresh token (if endpoint available)
            Clear TokenStore
            Broadcast "logout" (reason: 'user')
            Redirect to Keycloak end-session (SPA mode)
            OR call /api/auth/logout (BFF mode)
```

## Routing Configuration

```typescript
const routes: Routes = [
  { path: '', component: WelcomeComponent, canActivate: [AuthGuard] },
  { path: 'auth/callback', component: CallbackComponent },
  { path: 'auth/session-expired', component: SessionExpiredComponent },
  { path: 'auth/error', component: AuthErrorComponent },
  { path: '**', redirectTo: '' },
];
```

Auth routes are unguarded — they handle pre-authentication states. All other routes are protected by `AuthGuard`.

## Content Security Policy

**Implements:** Requirement 14

CSP configuration is split by environment to avoid ambiguous mixing of directives.

### Production (HTTP header via API Gateway / reverse proxy)

```
Content-Security-Policy:
  default-src 'self';
  script-src 'strict-dynamic' 'nonce-{PER_REQUEST_NONCE}';
  style-src 'self' 'unsafe-inline';               /* required by PrimeNG dynamic theming */
  connect-src 'self' {KEYCLOAK_ORIGIN} {API_GATEWAY_ORIGIN};
  img-src 'self' data:;
  font-src 'self';
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'none';
  report-uri {CSP_REPORT_ENDPOINT};
```

The nonce is generated per-request by the API Gateway and injected into both the CSP header and the `<script>` tags in the served HTML. `strict-dynamic` ensures only scripts loaded by nonced scripts can execute — even if an attacker injects a `<script>` tag from the same origin, it won't run without the nonce.

### Development (no CSP meta tag — enforced at API Gateway only)

CSP is NOT enforced via `<meta>` tag in development because:
- `frame-ancestors` is ignored in `<meta>` tags (spec limitation)
- Vite's HMR requires inline scripts that conflict with strict `script-src`
- The frame-busting inline script conflicts with `script-src 'self'`

Development relies on the browser's default security model. Production CSP is enforced via HTTP headers at the API Gateway.

Additional security headers:
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
```

Frame-busting is handled via CSP `frame-ancestors 'none'` (production HTTP header) and `X-Frame-Options: DENY` (production HTTP header). No inline frame-busting script is used — it conflicts with strict CSP and is redundant when `frame-ancestors` is enforced via HTTP headers.

Notes:
- `style-src 'unsafe-inline'` is required by PrimeNG. `script-src` never includes `'unsafe-inline'` or `'unsafe-eval'`.
- `base-uri 'none'` prevents `<base>` tag injection attacks.
- In production, ALL `<script>` tags in the Angular build output MUST include the CSP nonce at render time. The Angular build configuration MUST NOT produce inline scripts that lack nonce support. The API Gateway is responsible for injecting the nonce into both the CSP header and the HTML `<script>` tags. If the Angular build introduces inline scripts (e.g., via plugins or configuration changes), they will be blocked by `strict-dynamic` unless nonced — this is by design and must be caught during build verification.
- If federated login providers (Google, Azure AD) are introduced via Keycloak identity brokering, their origins must be added to `connect-src` and `frame-src`.

## Internationalization

**Implements:** Requirement 9

Translation files follow [ARCH-008]:

```
src/locales/
├── en/
│   └── auth.json
└── pt/
    └── auth.json
```

Key namespace: `auth`

```json
{
  "login.redirecting": "Redirecting to login...",
  "welcome.greeting": "Welcome, {{name}}",
  "welcome.logoutButton": "Logout",
  "sessionExpired.title": "Session Expired",
  "sessionExpired.message": "Your session has ended. Please log in again.",
  "sessionExpired.loginButton": "Log In",
  "error.title": "Authentication Unavailable",
  "error.message": "The authentication service is currently unavailable. Please try again.",
  "error.retryButton": "Retry",
  "idle.warning": "Your session will expire in 2 minutes due to inactivity.",
  "errors.networkError": "A connectivity issue occurred. Please check your connection.",
  "errors.refreshFailed": "Session refresh failed."
}
```

Portuguese translations in `pt/auth.json` with the same keys.

## Environment Configuration

**Implements:** Requirement 10

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  keycloak: {
    baseUrl: 'http://localhost:8180',
    realm: 'platform',
    clientId: 'platform-frontend',
    redirectUri: 'http://localhost:4200/auth/callback',
    postLogoutRedirectUri: 'http://localhost:4200',
  },
  apiGatewayUrl: 'http://localhost:8080',
  auth: {
    refreshBufferSeconds: 60,
    clockSkewToleranceSeconds: 30,
    idleTimeoutMinutes: 15,
    maxSessionLifetimeHours: 8,
    interceptorReplayLimit: 5,       // max concurrent replayed requests after refresh
    redirectLoopThreshold: 3,        // max failures in 10s before error page
    redirectLoopWindowMs: 10000,
    refreshCooldownMs: 5000,         // cooldown after refresh failure to prevent retry loops
    invalidGrantGraceMs: 3000,       // window to treat invalid_grant as cross-tab race
    refreshJitterRangeMs: [5000, 15000], // random jitter added to proactive refresh timer
  },
  credentialStrategy: 'bearer',      // 'bearer' | 'bff'
  csp: {
    reportUri: '',
  },
};
```

No Keycloak URLs, secrets, or endpoint paths are hardcoded. All endpoints resolved via OIDC Discovery.

## Dependency Summary

No new dependencies outside the approved stack in [ARCH-001]:

| Dependency | Purpose | Status |
|---|---|---|
| `@angular/core`, `@angular/router`, `@angular/common/http` | Framework | In stack |
| `primeng` | UI components (Card, Button, Toast, Toolbar, ProgressSpinner) | In stack |
| `@primeuix/themes` | Aura preset | In stack |

Token decoding uses `atob()` + `JSON.parse()` on the JWT payload segment — no external JWT library. Safe because the frontend does NOT verify signatures (backend is the trust boundary per [SEC-001]).

Web APIs used:
- `crypto.getRandomValues()` / `crypto.randomUUID()` — PKCE, state, nonce generation
- `navigator.locks` — Cross-tab refresh coordination (graceful fallback if unavailable)
- `BroadcastChannel` — Cross-tab messaging (graceful fallback if unavailable)
- `history.replaceState()` — URL cleanup after callback
- Page Visibility API — Idle timeout on tab visibility change

## Trust Boundary

The frontend is NOT a trust boundary. All token validation, authorization enforcement, and session management decisions are authoritative only at the backend (Keycloak + API Gateway + backend services). Every client-side check in this design — nonce validation, issuer/audience matching, token expiry decoding, idle timeout — is a defensive sanity check or UX optimization, not a security enforcement point.

This means:
- Frontend token decoding (`atob` + `JSON.parse`) is for scheduling and UX, not for trust decisions
- Frontend `iss`/`aud` checks catch misconfigurations early but do not replace backend validation
- Frontend idle timeout is a UX policy, not a security boundary — the backend enforces session limits via token expiry and refresh token rotation
- Future developers SHALL NOT add signature verification, JWKS fetching, or "real" token validation on the frontend — it adds complexity without security value and creates a false sense of trust

The backend is the single source of truth. The frontend is an untrusted client.

## Security Considerations

⚠️ This entire feature involves authentication logic and requires explicit security review before merging per the security policy.

Key security decisions:
- `invalid_grant` race detection (3s grace window + generation check) — prevents false logout storms across tabs
- `invalid_grant` retry cap (max 1 per flow) — prevents recursion from repeated race recovery
- Refresh cooldown after failure (5s) — prevents retry loops under partial network failure
- 401 classification heuristic with request generation stamping — prevents refresh loops on non-token 401s and handles refresh-during-flight races
- Execution-time idle guard in refreshTokens — closes race window between scheduling and execution
- Refresh timer jitter (±5-15s) — prevents synchronized backend spikes from multiple tabs
- Session generation counter in TokenStore — prevents out-of-order broadcast overwrites
- Cross-tab activity drift guard + local activity check — prevents compromised tab from keeping all tabs alive
- CSP nonce requirement for all script tags — prevents Angular build regressions from breaking strict-dynamic
- Per-login authSessionId — enables multi-tab debugging without exposing sensitive data
- `refreshPromise` try/finally cleanup invariant — prevents permanent auth system freeze from uncleaned promise
- Strict monotonic generation ordering on BroadcastChannel — drops stale out-of-order messages deterministically
- Logout reason in broadcast messages — semantic distinction for UX routing and audit trails
- Tokens in memory only — defense-in-depth against persistence-based theft, NOT a complete XSS mitigation (see XSS Threat Model in requirements)
- PKCE (S256) for authorization code flow — prevents code interception
- `state` parameter — prevents CSRF login attacks
- `nonce` parameter — prevents ID token replay
- OIDC issuer + endpoint origin validation — prevents DNS poisoning / proxy compromise
- Discovery fetch with `{ redirect: 'error' }` — prevents redirect-based OIDC hijacking
- Single-flight refresh invariant — prevents rotating token races
- Web Locks for cross-tab refresh coordination — prevents concurrent refresh with rotated tokens
- Stale token blocking in interceptor — prevents 401 bursts after cross-tab refresh
- Cross-tab idle activity sync — consistent idle timeout across all tabs
- Redirect loop detection (>3 in 10s) — prevents infinite auth loops from misconfigurations
- BroadcastChannel messages treated as untrusted hints — trigger local verification, never direct state changes
- Absolute idle timeout (no pause on hidden tabs) — prevents unattended workstation exposure
- Idle timeout takes precedence over refresh — inactivity always results in logout
- Max session lifetime (8h) — limits XSS token exfiltration window
- CSP with `strict-dynamic` + nonce, no `unsafe-inline` scripts, no `unsafe-eval` — primary XSS defense
- `base-uri 'none'` — prevents base tag injection attacks
- Frame-busting + `frame-ancestors 'none'` — clickjacking defense
- `X-Requested-With` header — future CSRF protection for BFF migration
- Token revocation on logout — reduces window of stolen refresh token usability
- Credential redaction in error handlers — prevents token leakage via logs
- Return URL validation (relative paths only) — prevents open redirect attacks
- Single-use code_verifier/state/nonce — prevents authorization code replay
- Private `recordActivity()` in IdleTrackerService — prevents XSS from programmatically resetting idle timer
- ID token validation hard fail — nonce/iss/aud mismatch throws AuthError, clears tokens, navigates to error page without auto-retry
- Service Worker restriction documented — prevents future accidental token persistence
- Auth_Service interface contract — enables mechanical SPA↔BFF swap

## Auth Error Logging Contract

**Implements:** Requirement 16

All `AuthError` instances SHALL be logged via `console.error()` (or a future centralized logging service when one is established platform-wide). The log entry SHALL include:

- `error.code` — the `AuthErrorCode` discriminant
- `error.message` — human-readable description
- `timestamp` — ISO 8601 timestamp of the error occurrence
- `authSessionId` — the per-login session ID from TokenStore (if available)

The log entry SHALL NOT include:
- Access tokens, refresh tokens, or ID tokens
- Authorization headers or cookie values
- User PII (email, name, sub)
- PKCE code_verifier, state, or nonce values

```typescript
function logAuthError(error: AuthError, authSessionId?: string | null): void {
  console.error('[Auth]', {
    code: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
    ...(authSessionId && { authSessionId }),
  });
}
```

This is intentionally minimal. When the platform establishes a centralized logging/telemetry standard, this contract will be extended to route through that service. The `AuthErrorCode` discriminant is designed to map directly to telemetry categories and dashboard filters.

## Related Specifications

- [SEC-001] Authentication Model — Keycloak integration, PKCE flow, token types
- [ARCH-001] System Architecture — Frontend tech stack, API Gateway, communication patterns
- [ARCH-008] Internationalization Standards — Translation key format, file structure
- [DS-001] PrimeNG Design System Standard — Component usage, Aura preset, theming
- [ARCH-006] Infrastructure Configuration — Environment variable standards
