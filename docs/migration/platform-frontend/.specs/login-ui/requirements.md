# Requirements Document

## Introduction

This specification defines the login UI feature for platform-frontend, covering the complete authentication lifecycle: Keycloak login redirect via Authorization Code Flow with PKCE, token management (access, refresh, ID tokens), silent token refresh, logout flow, route protection via auth guards, user session state management, cross-tab session synchronization, authentication error UX, idle timeout, and security hardening. The frontend delegates all authentication to Keycloak per [SEC-001] and communicates exclusively through the API Gateway per [ARCH-001]. All UI components use PrimeNG with the Aura preset per [DS-001]. All user-facing strings use i18n translation keys per [ARCH-008].

## Design Constraints

- **BFF-Ready Architecture**: All Keycloak interaction and token management logic SHALL be encapsulated behind the Auth_Service abstraction. No component, guard, or interceptor SHALL interact with Keycloak directly. The Auth_Interceptor SHALL use a pluggable credential-attachment strategy (Bearer token in SPA mode, no-op in BFF mode where cookies are automatic). All API calls SHALL route through a single configurable base URL (the API Gateway) to support future BFF proxying. This ensures that a future BFF migration requires only replacing the Auth_Service implementation and switching the credential strategy without touching consumers.
- **XSS Threat Model**: In-memory token storage protects against persistence-based theft (localStorage/sessionStorage leaks) but does NOT protect against runtime XSS exfiltration. If an attacker executes JavaScript in the application context, they can read in-memory tokens, hook Auth_Service methods, or intercept outgoing requests. The primary defense against XSS is a strict Content Security Policy (see Requirement 14) and Angular's built-in sanitization. Token storage in memory is a defense-in-depth measure, not a complete XSS mitigation.
- **Single Refresh Orchestrator**: All token refresh logic SHALL be centralized in Auth_Service. Guards and interceptors SHALL NOT independently decide to refresh tokens — they delegate to Auth_Service, which coordinates all refresh operations through a single queue to prevent races and double-refreshes.
- **Service Worker Restriction**: If a Service Worker is introduced in the future, it SHALL NOT cache, persist, or log authentication headers, tokens, or any credential material. Service Workers operate outside the normal page lifecycle and could inadvertently persist tokens that are intended to be memory-only.
- **Browser Extension Threat Model**: Browser extensions running with elevated permissions can read application memory, intercept DOM events, and access network requests regardless of any client-side security measures. This is an accepted, non-mitigable risk at the frontend layer. The platform relies on backend token validation, short-lived access tokens, refresh token rotation, and the 8-hour maximum session lifetime (Requirement 4, AC 6) to limit the impact of any client-side token exfiltration, whether via XSS or browser extensions.
- **Refresh Token Exposure in SPA**: Storing a refresh token in the browser JavaScript runtime is the highest-value credential risk in this architecture. A successful XSS attack grants the attacker session persistence (not just a short-lived access token) until the refresh token expires or the max session lifetime (8h) is reached. The current mitigations (memory-only storage, CSP as primary XSS defense, refresh rotation, max session lifetime) represent the best available protections within an SPA architecture. The long-term mitigation is migrating to BFF architecture (see BFF-Ready constraint), which moves all tokens server-side and eliminates frontend token exposure entirely. Until BFF migration, the 8-hour max session lifetime is the hard ceiling on exposure from a compromised refresh token.
- **New Tab Behavior**: When a user opens a new browser tab, the Token_Store will be empty (no cross-tab memory sharing). The new tab will appear unauthenticated and redirect to Keycloak. Because the Keycloak session is still valid (assuming the user is logged in on another tab), Keycloak will auto-complete the authorization flow without showing a login form, redirecting back with a new authorization code. This results in a brief redirect flash but no user interaction. This is accepted behavior — the alternative (sharing tokens across tabs via BroadcastChannel or SharedWorker) would transmit high-value credentials over cross-tab channels, contradicting the security model. The redirect-based approach is the safer trade-off.
- **Auth_Service Interface Contract**: To ensure the SPA↔BFF swap is mechanical, Auth_Service SHALL implement a stable interface contract that both SPA and BFF implementations conform to. The contract is: `login(returnUrl?)` — initiate authentication; `logout()` — terminate session; `getAccessToken()` — return current access token (SPA) or null (BFF, cookies are automatic); `sessionState$` — observable of current SessionState; `refreshIfNeeded()` — ensure tokens are fresh before a critical operation; `handleUnauthorized()` — handle 401 recovery. All consumers (guards, interceptors, components) depend on this interface, never on implementation details. Swapping from SPA to BFF requires only providing a new implementation of this interface and switching the Credential_Strategy.

## Glossary

- **Auth_Module**: The Angular module (or standalone component group) responsible for authentication concerns including login initiation, callback handling, logout, and session management.
- **Auth_Service**: The Angular injectable service that encapsulates all interactions with Keycloak, manages tokens, and exposes authentication state as observables. This is the sole abstraction layer for authentication — all consumers depend on Auth_Service, never on Keycloak directly.
- **Auth_Guard**: The Angular route guard that protects routes by checking authentication status via Auth_Service. The guard is intentionally "dumb" — it checks `isAuthenticated` and redirects if false. It does NOT orchestrate token refresh.
- **Auth_Interceptor**: The Angular HTTP interceptor that attaches credentials to outgoing API requests via a pluggable strategy and handles 401 responses by delegating to Auth_Service.
- **Token_Store**: The in-memory storage mechanism for access, refresh, and ID tokens. Tokens are never persisted to localStorage or sessionStorage.
- **Session_State**: An observable representation of the current user's authentication status, including authentication flag, user profile claims, and token expiration metadata.
- **PKCE_Flow**: The Authorization Code Flow with Proof Key for Code Exchange, as defined in RFC 7636 and mandated by [SEC-001].
- **OIDC_Discovery**: The OpenID Connect Discovery endpoint (`.well-known/openid-configuration`) used to dynamically resolve Keycloak endpoints.
- **Keycloak**: The external identity provider (IdP) used for all user authentication. See [SEC-001].
- **API_Gateway**: The single entry point for all backend communication from the frontend. See [ARCH-001].
- **Silent_Refresh**: The process of obtaining a new access token using the refresh token without user interaction.
- **Credential_Strategy**: A pluggable abstraction for attaching authentication credentials to outgoing HTTP requests. In SPA mode, attaches a Bearer token header. In BFF mode, performs no action (cookies are attached automatically by the browser).

## Requirements

### Requirement 1: OIDC Discovery and Keycloak Login Redirect

**User Story:** As a platform user, I want to be redirected to the Keycloak login page when I am not authenticated, so that I can securely authenticate using the organization's identity provider.

#### Acceptance Criteria

1. THE Auth_Service SHALL fetch the OIDC configuration from `{keycloak_base_url}/realms/{realm}/.well-known/openid-configuration` at application startup to dynamically resolve the authorization, token, end-session, revocation, and JWKS endpoints. THE Auth_Service SHALL ensure the discovery endpoint is fetched only from the preconfigured trusted Keycloak base URL origin, and SHALL NOT follow HTTP redirects to a different origin. If the fetch is redirected to a different origin, THE Auth_Service SHALL reject the response and treat it as a discovery failure. This prevents an attacker who controls DNS or a proxy from redirecting the discovery request to a malicious OIDC configuration.
2. THE Auth_Service SHALL validate that the `issuer` field in the OIDC discovery response exactly matches the expected value (`{keycloak_base_url}/realms/{realm}`). If the issuer does not match, THE Auth_Service SHALL reject the discovery response, log a security warning, and display the auth error page. This prevents DNS poisoning, proxy compromise, or environment misconfiguration from redirecting authentication to a malicious endpoint.
3. THE Auth_Service SHALL validate that all resolved endpoints (`authorization_endpoint`, `token_endpoint`, `end_session_endpoint`, `revocation_endpoint`, `jwks_uri`) share the same origin as the validated `issuer`. If any endpoint points to a different origin, THE Auth_Service SHALL reject the entire discovery response and display the auth error page. This prevents a compromised or tampered discovery document from redirecting token exchange or authorization to an attacker-controlled domain.
4. THE Auth_Service SHALL cache the OIDC discovery response for the lifetime of the application instance and SHALL NOT hardcode any Keycloak endpoint URLs.
5. IF the OIDC discovery fetch fails, THEN THE Auth_Service SHALL retry with exponential backoff (delays of 2s, 4s, 8s) for a maximum of 3 retry attempts. If all retries fail, THE Auth_Service SHALL display the auth error page (see Requirement 15) and prevent navigation to protected routes. This provides resilience against Keycloak cold starts, short outages, and DNS hiccups without blocking the application indefinitely.
6. WHEN an unauthenticated user navigates to any protected route, THE Auth_Guard SHALL redirect the user to the discovered authorization endpoint using the PKCE_Flow.
7. THE Auth_Service SHALL generate a cryptographically random `code_verifier` and derive a `code_challenge` using the S256 method for each authorization request.
8. THE Auth_Service SHALL generate a cryptographically random `state` parameter for each authorization request and store it in memory. On callback, THE Auth_Service SHALL validate that the returned `state` matches the stored value before exchanging the authorization code. If the `state` does not match, THE Auth_Service SHALL reject the response, discard any partial state, and redirect to the login page. This prevents CSRF login attacks and authorization response injection.
9. THE Auth_Service SHALL generate a cryptographically random `nonce` parameter for each authorization request and include it in the `scope=openid` request. After receiving the ID token, THE Auth_Service SHALL validate that the `nonce` claim in the ID token matches the stored value. If the `nonce` does not match, THE Auth_Service SHALL throw an `AuthError('invalid_token')`, clear the Token_Store, and navigate to the auth error page (Requirement 15). THE Auth_Service SHALL NOT auto-retry login after a nonce mismatch — this is a hard fail that requires user-initiated recovery. This prevents ID token replay and token substitution attacks.
10. THE Auth_Service SHALL include the `response_type=code`, `client_id`, `redirect_uri`, `scope=openid`, `code_challenge`, `code_challenge_method=S256`, `state`, and `nonce` parameters in the authorization request.
11. THE Auth_Service SHALL configure the Keycloak client as a public client with no client secret.
12. WHEN the Keycloak authorization endpoint returns an authorization code to the redirect URI, THE Auth_Service SHALL first validate the `state` parameter, then exchange the authorization code and `code_verifier` for access, refresh, and ID tokens via the discovered token endpoint, then validate the `nonce` in the ID token.
13. AFTER the authorization code has been consumed (successfully or not), THE Auth_Service SHALL immediately clear the stored `code_verifier`, `state`, and `nonce` from memory. These values are single-use — a second exchange attempt with the same values SHALL be impossible. This prevents authorization code injection via URL reuse or replay.
14. AFTER processing the callback URL parameters, THE Auth_Service SHALL remove the `code` and `state` query parameters from the browser URL using `history.replaceState()` to prevent leakage via browser history, analytics tools, or the HTTP `Referer` header. The URL SHALL be cleaned before any navigation or external resource loading occurs.
15. IF the authorization code exchange fails, THEN THE Auth_Service SHALL discard any partial state and redirect the user back to the Keycloak login page.

### Requirement 2: Session Initialization on Application Bootstrap

**User Story:** As a platform user, I want my authentication state to be correctly determined when the application loads, so that I am either taken to my intended page or redirected to login.

#### Acceptance Criteria

1. ON application bootstrap, THE Auth_Service SHALL execute the following initialization sequence:
   a. Fetch the OIDC discovery configuration (Requirement 1).
   b. Check the current URL for an authorization `code` and `state` parameter (callback from Keycloak).
   c. IF an authorization code is present, validate the `state` parameter, exchange the code for tokens via the token endpoint, validate the `nonce` in the ID token, and store the tokens in the Token_Store.
   d. IF no authorization code is present, check the Token_Store for existing tokens (will be empty after a page reload).
   e. Emit the initial Session_State (authenticated or unauthenticated) before any route guard evaluation occurs.
2. THE Auth_Service SHALL complete the initialization sequence before the Angular router evaluates any route guards.
3. IF the token exchange during initialization fails, THEN THE Auth_Service SHALL mark the session as unauthenticated and allow the Auth_Guard to handle the redirect.
4. THE Auth_Service SHALL detect repeated failed authentication attempts by tracking callback failures. If more than 3 authentication failures occur within a 10-second window (e.g., callback → token exchange fail → redirect to login → callback → fail again), THE Auth_Service SHALL break the loop and redirect to the auth error page (Requirement 15) instead of retrying. This prevents infinite redirect loops caused by production misconfigurations, persistent clock skew, or Keycloak issues.
5. AFTER successful token exchange from a callback, THE Auth_Service SHALL redirect the user to the originally requested URL stored before the Keycloak redirect (see Requirement 6, AC 6). If no stored URL exists, redirect to the default route (`/`).

### Requirement 3: Token Management

**User Story:** As a platform user, I want my authentication tokens to be securely managed in memory, so that my session is protected against persistence-based token theft.

#### Acceptance Criteria

1. THE Token_Store SHALL store access tokens, refresh tokens, and ID tokens exclusively in JavaScript memory.
2. THE Token_Store SHALL NOT persist tokens to localStorage, sessionStorage, cookies, or any other browser-accessible persistent storage.
3. THE Auth_Service SHALL decode the ID token locally (without signature verification) to extract user profile information including `sub`, `preferred_username`, `name`, and `email`.
4. THE Auth_Service SHALL perform lightweight client-side validation on decoded tokens as a defensive sanity check: verify that the `iss` claim matches the expected Keycloak issuer and that the `aud` claim contains the configured client ID. If either check fails, THE Auth_Service SHALL throw an `AuthError('invalid_token')`, clear the Token_Store, and navigate to the auth error page (Requirement 15). THE Auth_Service SHALL NOT auto-retry login after an iss/aud mismatch — this is a hard fail indicating environment misconfiguration or token substitution. This is NOT a trust boundary (backend is source of truth) — it catches misconfigured environments and wrong-realm tokens early.
5. THE Auth_Service SHALL decode the access token locally (without signature verification) to read the `exp` and `iat` claims for timing purposes. This local decode is NOT used for trust or authorization — it is used only for scheduling Silent_Refresh and determining token validity windows.
6. THE Auth_Service's `getAccessToken()` method SHALL enforce the maximum session lifetime (Requirement 4, AC 6) as a hard cutoff: if the elapsed time since `sessionStartTimestamp` exceeds the configured maximum session lifetime, `getAccessToken()` SHALL return `null`, clear the Token_Store, and emit `unauthenticated` state. This is the single choke point for all token consumers (interceptor, direct callers) and guarantees the session lifetime limit is enforced regardless of refresh timing or proactive refresh scheduling.
7. THE Token_Store SHALL maintain a monotonically increasing `generation` counter that is incremented on each successful token store operation. This counter is used in cross-tab `token_refreshed` broadcasts and locally to ignore out-of-order broadcasts (a broadcast with a generation ≤ the local generation is stale and SHALL be ignored).
8. WHEN the user closes the browser tab or window, THE Token_Store SHALL lose all stored tokens, requiring re-authentication on the next visit.

### Requirement 4: Silent Token Refresh

**User Story:** As a platform user, I want my session to remain active without interruption while my refresh token is valid, so that I am not forced to re-authenticate during normal usage.

#### Acceptance Criteria

1. THE Auth_Service SHALL be the single orchestrator for all token refresh operations. Neither the Auth_Guard nor the Auth_Interceptor SHALL independently initiate a refresh — they SHALL delegate to Auth_Service.
2. THE Auth_Service SHALL initiate a proactive Silent_Refresh before the access token expires, using a configurable buffer period (default: 60 seconds before expiration).
3. THE Auth_Service SHALL account for clock skew by subtracting a configurable skew tolerance (default: 30 seconds) from token expiration checks. The effective refresh trigger time is: `exp - buffer - skew_tolerance`. Note: if the client clock is significantly manipulated or drifted beyond the skew tolerance, the proactive refresh timing may be inaccurate. In this case, the Auth_Interceptor's reactive 401 handling (Requirement 7, AC 3) serves as the fallback — the backend is the authoritative source for token validity.
4. WHEN a Silent_Refresh is initiated, THE Auth_Service SHALL send the refresh token to the discovered Keycloak token endpoint to obtain a new access token, refresh token, and ID token.
5. THE Auth_Service SHALL always replace all tokens (access, refresh, and ID) in the Token_Store after a successful Silent_Refresh, regardless of whether the refresh token value changed. Keycloak is configured with rotating refresh tokens — reuse of a previously rotated refresh token SHALL be treated as a potential session compromise, causing THE Auth_Service to clear the Token_Store and redirect to the login page.
6. THE Auth_Service SHALL track the age of the current refresh token (time since initial authentication or last full re-authentication). If the refresh token age exceeds a configurable maximum session lifetime (default: 8 hours), THE Auth_Service SHALL force a full re-authentication by clearing the Token_Store and redirecting to the Keycloak login page, regardless of whether the refresh token is still valid. This limits the exposure window if tokens are exfiltrated via XSS.
7. IF the Silent_Refresh fails due to an expired or revoked refresh token (`invalid_grant` error), THEN THE Auth_Service SHALL first check whether a `token_refreshed` broadcast was received from another tab within a configurable grace window (default: 3 seconds) OR whether a higher generation counter was observed from another tab's broadcast. If either condition is met, THE Auth_Service SHALL treat the `invalid_grant` as a cross-tab refresh token rotation race condition — mark tokens as stale and call `refreshIfNeeded()` to retry with the current token. This race recovery SHALL be attempted at most once per refresh flow; if the retry also results in `invalid_grant`, THE Auth_Service SHALL treat it as a real session invalidation regardless of broadcast timing. If neither condition is met on the first attempt, THE Auth_Service SHALL treat this as a real global session invalidation: clear the Token_Store, broadcast a logout event to other tabs (Requirement 11), and redirect the user to the session expired page (Requirement 15). This prevents false logout storms when multiple tabs race to refresh with rotating tokens and Web Locks are unavailable, while bounding the recovery to a single retry to prevent recursion.
8. IF the Silent_Refresh fails due to a network error, THEN THE Auth_Service SHALL retry the refresh with exponential backoff: 3 attempts with delays of 1s, 3s, and 5s. If all retry attempts fail, THE Auth_Service SHALL treat the refresh as failed.
9. WHILE a Silent_Refresh is in progress, THE Auth_Service SHALL queue any concurrent refresh requests (from interceptor 401 handling or guard checks) and resolve them with the same refresh result to prevent duplicate token requests.
10. THE Auth_Service SHALL enforce a single-flight invariant: at most one refresh operation SHALL be in-flight at any time across the entire Auth_Service, regardless of the caller (proactive refresh timer, interceptor 401 handling, manual `refreshIfNeeded()`, or cross-tab stale recovery). All concurrent callers SHALL await the same promise. The `refreshPromise` field SHALL be assigned only via an immediately-invoked async block wrapped in `try/finally`, where `finally` unconditionally clears the promise reference. No code path — exception, early return, race retry, or Web Lock release — may skip this cleanup. If the promise reference is never cleared, all subsequent auth operations will await a promise that never resolves, permanently freezing the auth system. This is critical with rotating refresh tokens — two concurrent refresh calls would cause the second to send an already-rotated token, triggering `invalid_grant` and forced logout.
11. THE Auth_Service's `refreshIfNeeded()` method SHALL clear the Token_Store's stale flag on failure (not only on success). If a refresh attempt fails while the stale flag is set, the flag MUST be cleared and the error propagated to the caller. This prevents a deadlock where the Auth_Interceptor indefinitely pauses outgoing requests waiting for a stale resolution that will never complete.
12. NOTE: If the Keycloak session is invalidated externally (e.g., user logs out from another application sharing the same realm, or an admin terminates the session), the SPA will detect this on the next Silent_Refresh cycle when Keycloak returns `invalid_grant`. The maximum detection delay is bounded by the proactive refresh timer (approximately `exp - buffer - skew_tolerance`). This is an accepted trade-off of the SPA architecture — there is no server-push mechanism to notify the frontend of external session invalidation in real time.
13. THE Auth_Service's `refreshIfNeeded()` method SHALL enforce a cooldown period (default: 5 seconds) after a refresh failure. If `refreshIfNeeded()` is called within the cooldown window of a previous failure, it SHALL skip the refresh attempt and propagate the previous failure reason. This prevents a retry loop where queued requests hit 401, each re-triggering `refreshIfNeeded()` in rapid succession under partial network failure.
14. THE Auth_Service SHALL re-check the idle timeout state immediately before sending the refresh token to the Keycloak token endpoint (execution-time guard), not only at scheduling time. If the idle timeout has been exceeded at execution time, THE Auth_Service SHALL abort the refresh and proceed to logout. This closes the race window between the proactive refresh timer firing and the idle timeout triggering.
15. THE Auth_Service SHALL add random jitter (configurable range, default: ±5-15 seconds) to the proactive refresh timer scheduling. This prevents all open tabs from hitting the Keycloak token endpoint at the same instant, reducing backend load spikes.

### Requirement 5: Logout Flow

**User Story:** As a platform user, I want to securely log out of the platform, so that my session is terminated both locally and at the identity provider.

#### Acceptance Criteria

1. WHEN the user initiates a logout action, THE Auth_Service SHALL first attempt to revoke the refresh token by calling the discovered token revocation endpoint. If revocation fails or the endpoint is unavailable, logout SHALL proceed regardless.
2. THE Auth_Service SHALL clear all tokens from the Token_Store.
3. THE Auth_Service SHALL broadcast a logout event to other open tabs via BroadcastChannel (see Requirement 11).
4. THE Auth_Service SHALL redirect the user to the discovered Keycloak end-session endpoint with the `id_token_hint` and `post_logout_redirect_uri` parameters.
5. IF the ID token is unavailable or expired at the time of logout, THEN THE Auth_Service SHALL proceed with the Keycloak end-session redirect without the `id_token_hint` parameter. Note: social login federated logout is out of scope for this iteration.
6. THE Auth_Service SHALL reset the Session_State to unauthenticated after clearing tokens.
7. WHEN the Keycloak end-session endpoint completes, THE user SHALL be redirected to the application login route.
8. IF the Keycloak end-session endpoint is unreachable, THEN THE Auth_Service SHALL still clear local tokens and Session_State, and redirect the user to the application login route.
9. THE logout flow SHALL be encapsulated behind the same Auth_Service abstraction as all other authentication operations. In SPA mode, Auth_Service performs the Keycloak end-session redirect directly. In BFF mode, Auth_Service SHALL call a backend logout endpoint (e.g., `/api/auth/logout`) which handles server-side session cleanup and Keycloak end-session on behalf of the frontend. This ensures BFF migration does not require changes to any logout consumer (components, idle tracker, broadcast handler).

### Requirement 6: Auth Guard for Protected Routes

**User Story:** As a platform developer, I want an auth guard that protects routes from unauthenticated access, so that only authenticated users can reach protected pages.

#### Acceptance Criteria

1. THE Auth_Guard SHALL be intentionally simple: it checks `isAuthenticated` from the Session_State snapshot and either allows or denies navigation.
2. WHEN an unauthenticated user attempts to navigate to a protected route, THE Auth_Guard SHALL deny navigation and initiate the Keycloak login redirect via the Auth_Service.
3. WHEN an authenticated user navigates to a protected route, THE Auth_Guard SHALL allow navigation.
4. THE Auth_Guard SHALL NOT independently check token expiration or trigger Silent_Refresh. Token validity and refresh orchestration are the responsibility of Auth_Service (proactive refresh via timer) and Auth_Interceptor (reactive refresh on 401).
5. IF Auth_Service is still initializing (bootstrap in progress), THE Auth_Guard SHALL wait for initialization to complete before evaluating.
6. THE Auth_Guard SHALL store the originally requested URL so that the user is redirected to that URL after successful authentication. THE Auth_Service SHALL validate that the stored return URL is a relative path (starts with `/`) belonging to the application. Absolute URLs, URLs with a different origin, or URLs containing protocol schemes SHALL be rejected and replaced with the default route (`/`). This prevents open redirect attacks where an attacker crafts a login link that redirects to a malicious domain after authentication.

### Requirement 7: HTTP Interceptor for API Requests

**User Story:** As a platform developer, I want all outgoing API requests to automatically include authentication credentials, so that backend services can authenticate the user without manual handling in each component.

#### Acceptance Criteria

1. THE Auth_Interceptor SHALL use the configured Credential_Strategy to attach authentication credentials to outgoing HTTP requests. In SPA mode, this attaches the access token as a `Bearer` token in the `Authorization` header. In BFF mode, this is a no-op (cookies are automatic).
2. THE Auth_Interceptor SHALL only attach credentials to requests whose URL origin exactly matches the configured API_Gateway base URL. Requests to any other origin — including Keycloak endpoints, CDNs, or any external URL — SHALL never include authentication credentials. This allowlist approach prevents token leakage to misconfigured or compromised domains.
3. WHEN the Auth_Interceptor receives an HTTP 401 response from the API_Gateway, THE Auth_Interceptor SHALL delegate to Auth_Service to attempt a Silent_Refresh. For idempotent request methods (GET, HEAD, OPTIONS), THE Auth_Interceptor SHALL automatically retry the original request exactly once with the new credentials. The retried request SHALL be flagged as "already retried" to prevent infinite retry loops. For non-idempotent request methods (POST, PUT, PATCH, DELETE), THE Auth_Interceptor SHALL NOT automatically retry the request after refresh — it SHALL resolve the refresh, then reject the original request with a typed `AuthSessionRefreshedError` containing `{ retryable: true, method: string, url: string }` so the calling code can decide whether to resubmit. This prevents duplicate side effects (e.g., double creation, double payment) while giving consumers a standard contract for implementing retry UX (e.g., "Session refreshed. Click to retry.").
4. IF a request flagged as "already retried" receives an HTTP 401 response, THEN THE Auth_Interceptor SHALL NOT retry again. It SHALL delegate to Auth_Service to handle session invalidation.
5. WHILE a Silent_Refresh triggered by a 401 response is in progress, THE Auth_Interceptor SHALL queue subsequent failing requests and replay them after the refresh completes, with a concurrency limit (default: 5 concurrent replayed requests) to avoid overwhelming the API_Gateway.
6. ALL API calls SHALL include a custom header `X-Requested-With: XMLHttpRequest` to support future CSRF protection when migrating to BFF architecture.
7. NOTE: Client-side request rate limiting is intentionally omitted from the Auth_Interceptor. It throttles legitimate page-load bursts, provides no meaningful defense against XSS exfiltration, and belongs at the API Gateway layer. The only client-side throttle is the replay concurrency limit (AC 5) which prevents overwhelming the API_Gateway after a token refresh.
8. THE Auth_Interceptor and all error handling code SHALL NOT log, persist, or include authentication headers (`Authorization`, `Cookie`) or token values in error messages, console output, error tracking payloads, or analytics events. When logging HTTP errors for debugging, request headers containing credentials SHALL be redacted or omitted entirely. This prevents token leakage through Angular's `HttpErrorResponse`, developer tools, or third-party logging libraries.
9. BEFORE triggering a Silent_Refresh in response to a 401, THE Auth_Interceptor SHALL apply a classification heuristic. THE Auth_Interceptor SHALL stamp each outgoing request with the current Token_Store generation at send time. On 401: (a) if the request's stamped generation is less than the current Token_Store generation, the token was refreshed after the request was sent — allow one refresh path. (b) Otherwise, if the current access token is NOT near expiry AND the Token_Store's stale flag is NOT set, THE Auth_Interceptor SHALL NOT trigger a refresh and SHALL propagate the 401 error as-is. This prevents refresh-replay-refresh loops caused by persistent 401 responses unrelated to token validity (e.g., backend deployment, permission-service mismatch, API Gateway misrouting) while correctly handling the race where a request was sent with a pre-refresh token.

### Requirement 8: User Session State Management

**User Story:** As a platform developer, I want a reactive session state observable, so that UI components can respond to authentication changes in real time.

#### Acceptance Criteria

1. THE Auth_Service SHALL expose a Session_State observable that emits the current authentication status. The Session_State SHALL have three distinct phases: `initializing` (bootstrap in progress, auth state unknown), `authenticated` (valid tokens present, user profile available), and `unauthenticated` (no valid session). The `initializing` phase prevents guards from making premature redirect decisions and prevents UI flicker during bootstrap.
2. ON application startup, THE Auth_Service SHALL emit Session_State with `status: 'initializing'` immediately. Guards and UI components SHALL treat this state as "wait" — not as authenticated or unauthenticated.
3. WHEN the user successfully authenticates, THE Auth_Service SHALL emit an updated Session_State with `status: 'authenticated'` and the user profile extracted from the ID token.
4. WHEN the user logs out or the session expires, THE Auth_Service SHALL emit an updated Session_State with `status: 'unauthenticated'` and empty user profile claims.
5. THE Session_State SHALL be available synchronously via a snapshot accessor for components that need the current value without subscribing.
6. THE Auth_Service SHALL transition from `initializing` to either `authenticated` or `unauthenticated` during application bootstrap, before any route guard evaluation proceeds (see Requirement 2).
7. THE Session_State SHALL include operational metadata alongside the status: `isRefreshing` (boolean, true while a Silent_Refresh is in-flight) and `isStale` (boolean, true after receiving a cross-tab `token_refreshed` broadcast and before the local refresh completes). This allows UI components to disable critical actions during refresh (preventing the non-idempotent retry problem at the UX level), avoid flicker, and show subtle loading states when appropriate.

### Requirement 9: Internationalization of Auth UI Elements

**User Story:** As a platform user, I want authentication-related UI elements displayed in my preferred language (English or Portuguese), so that I can understand login, logout, and error messages.

#### Acceptance Criteria

1. THE Auth_Module SHALL use translation keys from the `auth` namespace for all user-visible text, following the key format defined in [ARCH-008].
2. THE Auth_Module SHALL NOT contain hardcoded user-visible strings in component templates or TypeScript files.
3. THE Auth_Module SHALL provide translation files for both `en` and `pt` locales under `src/locales/en/auth.json` and `src/locales/pt/auth.json`.
4. WHEN a translation key is missing for the `pt` locale, THE Auth_Module SHALL fall back to the `en` locale value.

### Requirement 10: Keycloak Configuration

**User Story:** As a platform operator, I want Keycloak connection parameters to be configurable via environment variables, so that the frontend can connect to different Keycloak instances across environments without code changes.

#### Acceptance Criteria

1. THE Auth_Service SHALL read the Keycloak base URL, realm name, and client ID from environment-provided configuration (`.env` file / Angular environment files) at application startup.
2. THE Auth_Service SHALL NOT hardcode any Keycloak URLs, realm names, client IDs, or secrets in source code.
3. THE Auth_Service SHALL derive all Keycloak endpoints dynamically from the OIDC Discovery response (see Requirement 1). Only the base URL, realm, and client ID are configured — individual endpoint URLs are never configured manually.
4. IF any required Keycloak configuration value is missing at startup, THEN THE Auth_Service SHALL log a descriptive error message to the browser console and prevent the application from proceeding to protected routes.

### Requirement 11: Cross-Tab Session Synchronization

**User Story:** As a platform user, I want my logout and session changes to be reflected across all open browser tabs, so that I am not left with stale sessions.

#### Acceptance Criteria

1. THE Auth_Service SHALL use the BroadcastChannel API to broadcast logout events to all other open tabs of the same application. The logout broadcast SHALL include a `reason` field: `'user'` for user-initiated logout, `'expired'` for session expiration (idle timeout, `invalid_grant`, max session lifetime). Receiving tabs SHALL use the reason to route appropriately: `'user'` → login page, `'expired'` → session-expired page.
2. WHEN a tab receives a logout broadcast, THE Auth_Service in that tab SHALL clear the Token_Store, reset the Session_State to unauthenticated, and redirect the user based on the broadcast reason (login page for user-initiated, session-expired page for expiration).
3. TO prevent refresh token rotation conflicts across tabs, THE Auth_Service SHALL use the Web Locks API (`navigator.locks.acquire()`) to acquire a cross-tab lock named `auth_token_refresh` before initiating any Silent_Refresh. Only the tab holding the lock SHALL execute the refresh. Other tabs attempting to refresh SHALL wait for the lock to be released, then broadcast-sync to obtain the refreshed state. This prevents the race condition where Tab B sends a refresh with an already-rotated refresh token before receiving Tab A's broadcast.
4. WHEN a tab successfully completes a Silent_Refresh while holding the cross-tab lock, THE Auth_Service SHALL broadcast a `token_refreshed` event (containing only a timestamp and a monotonically increasing refresh generation counter, NOT the tokens themselves) to other tabs via BroadcastChannel. The lock SHALL be released after the broadcast is sent.
5. WHEN a tab receives a `token_refreshed` broadcast, THE Auth_Service in that tab SHALL first check the incoming generation counter: if `incomingGeneration <= localGeneration`, the message is stale and SHALL be silently dropped (strict monotonic ordering). If the generation is higher, THE Auth_Service SHALL mark its current tokens as stale and force a fresh refresh before the next API request. Because the refreshing tab held the lock, the stale tab's subsequent refresh will acquire the lock and execute against Keycloak with the current (not rotated-out) refresh token.
6. WHILE tokens are marked as stale (after receiving a `token_refreshed` broadcast and before the local refresh completes), THE Auth_Interceptor SHALL pause outgoing API requests and queue them until `refreshIfNeeded()` resolves. This prevents a burst of 401 errors from requests sent with the invalidated access token during the stale window.
7. IF the Web Locks API is unavailable, THE Auth_Service SHALL fall back to the broadcast-only approach (broadcast `token_refreshed`, other tabs mark stale and refresh). This fallback has a small race window with rotating refresh tokens but is acceptable for browsers that do not support Web Locks.
8. THE Auth_Service SHALL validate the structure and type of all incoming BroadcastChannel messages before acting on them. Messages that do not match the expected schema SHALL be silently ignored. This mitigates injection risk from XSS or malicious extensions posting to the channel.
9. IF the BroadcastChannel API is unavailable (e.g., older browsers), THE Auth_Service SHALL degrade gracefully with no cross-tab synchronization and no errors.

### Requirement 12: Idle Session Timeout

**User Story:** As a security-conscious platform operator, I want user sessions to automatically expire after a period of inactivity, so that unattended workstations do not remain authenticated.

#### Acceptance Criteria

1. THE IdleTrackerService SHALL track user activity by monitoring DOM events: mouse movement, keyboard input, and touch events, recording an absolute `lastActivityTimestamp`. Activity recording SHALL be private to the IdleTrackerService — only DOM event listeners owned by the service can update the timestamp. No public `recordActivity()` method SHALL be exposed. This prevents XSS scripts from programmatically resetting the idle timer to keep the session alive indefinitely.
2. IF no user activity is detected for a configurable idle timeout period (default: 15 minutes), THEN THE Auth_Service SHALL initiate the logout flow (Requirement 5).
3. THE Auth_Service SHALL display a warning notification (PrimeNG Toast) 2 minutes before the idle timeout expires, informing the user that their session will expire due to inactivity.
4. IF the user interacts with the application after the warning is displayed but before the timeout expires, THEN THE Auth_Service SHALL reset the idle timer.
5. WHEN a browser tab becomes visible again (Page Visibility API), THE Auth_Service SHALL check the elapsed time since `lastActivityTimestamp`. If the elapsed time exceeds the idle timeout, THE Auth_Service SHALL immediately initiate the logout flow. The idle timer SHALL NOT be paused while the tab is hidden — hidden time counts toward inactivity.
6. Idle timeout SHALL take precedence over Silent_Refresh. Even if tokens are successfully refreshed (proactively or reactively), inactivity beyond the configured idle timeout threshold SHALL result in logout. THE Auth_Service SHALL check the idle state before initiating a proactive Silent_Refresh — if the idle timeout has been exceeded, THE Auth_Service SHALL skip the refresh and proceed directly to logout.
7. THE IdleTrackerService SHALL broadcast a lightweight `user_active` event (containing only `{ type: "user_active", timestamp: number }`) via BroadcastChannel when DOM-based user activity is detected (throttled to 1 event per 10 seconds, matching the local activity tracking rate). Other tabs SHALL update their `lastActivityTimestamp` upon receiving this event, subject to two guards: (a) a timestamp drift check — if the received timestamp is more than 5 seconds in the future relative to the local clock, the event SHALL be ignored; (b) a local activity check — if the receiving tab itself has been completely idle for the full idle timeout duration, cross-tab activity events SHALL be ignored (preventing a compromised tab from keeping all tabs alive indefinitely via continuous `user_active` broadcasts). This ensures idle timeout is consistent across all tabs where the user is genuinely active — if the user is active in any tab, tabs where the user was recently active will not log out due to inactivity. Only the activity timestamp is shared — no tokens, session state, or user data.

### Requirement 13: Welcome Page

**User Story:** As an authenticated platform user, I want to see a personalized welcome page after logging in, so that I know I am successfully authenticated and can begin using the platform.

#### Acceptance Criteria

1. AFTER successful authentication, THE application SHALL display a welcome page at the default route (`/`).
2. THE welcome page SHALL display the authenticated user's display name extracted from the Session_State (`preferred_username` or `name` claim).
3. THE welcome page SHALL include a logout button that triggers the logout flow (Requirement 5).
4. THE welcome page SHALL use PrimeNG components per [DS-001] and i18n translation keys per [ARCH-008].
5. THE welcome page is a static page with no backend API calls beyond authentication. It serves as the initial landing page until domain-specific features are implemented.

### Requirement 14: Content Security Policy

**User Story:** As a security engineer, I want a strict Content Security Policy enforced on the frontend, so that XSS attacks are mitigated at the browser level as the primary defense for in-memory token protection.

#### Acceptance Criteria

1. THE application SHALL enforce Content-Security-Policy with environment-specific configurations. In production, the CSP SHALL be served as an HTTP header by the API Gateway with `script-src 'strict-dynamic' 'nonce-{PER_REQUEST_NONCE}'` — the nonce is generated per-request by the API Gateway and injected into both the CSP header and the HTML `<script>` tags. ALL `<script>` tags in the Angular build output MUST include the nonce at render time — the Angular build configuration MUST NOT produce inline scripts that lack nonce support. If the Angular build introduces inline scripts (e.g., via plugins or configuration changes), they will be blocked by `strict-dynamic` unless nonced; this must be caught during build verification. In development, the CSP SHALL be served via a `<meta>` tag with `script-src 'self'` only — no `strict-dynamic`, no nonce (Angular dev server does not support nonce injection). Both environments SHALL use `default-src 'self'` as the fallback directive. Inline scripts (`'unsafe-inline'`) and `eval` (`'unsafe-eval'`) SHALL be prohibited in all environments. The two configurations SHALL never be mixed — `'self'` and `'strict-dynamic'` serve different security models and combining them ambiguously weakens both.
2. THE CSP SHALL restrict `connect-src` to `'self'`, the API_Gateway origin, and the Keycloak origin.
3. THE CSP SHALL restrict `frame-ancestors` to `'none'` to prevent clickjacking.
4. THE application SHALL include a JavaScript frame-busting guard as defense-in-depth for legacy browsers that do not fully support CSP `frame-ancestors`: `if (window.self !== window.top) { window.top.location = window.self.location; }`.
5. THE CSP SHALL include `form-action 'self'` to prevent form-based data exfiltration.
6. THE CSP SHALL include `base-uri 'none'` to prevent `<base>` tag injection attacks that could redirect relative URLs (including script sources) to an attacker-controlled domain.
7. CSP violations SHALL be reported to a configurable reporting endpoint (if available) using the `report-uri` or `report-to` directive.
8. THE application SHALL serve the following additional security headers alongside the CSP as defense-in-depth: `X-Content-Type-Options: nosniff` (prevents MIME-type sniffing), `X-Frame-Options: DENY` (legacy clickjacking fallback for browsers that do not support `frame-ancestors`), and `Referrer-Policy: strict-origin-when-cross-origin` (prevents leakage of callback URLs containing authorization codes or state parameters to external domains via the HTTP Referer header).
9. NOTE: If federated login providers (e.g., Google, Azure AD, Microsoft) are introduced via Keycloak identity brokering in the future, their origins MUST be added to CSP `connect-src` and `frame-src` as required. Failure to do so will silently break the federated login redirect flow. This is out of scope for the current iteration (social login is not supported) but must be addressed before enabling identity brokering.

⚠️ **Security Review Note**: This requirement involves security headers (CSP) and requires explicit security review before merging per the security policy.

### Requirement 15: Authentication Error UX

**User Story:** As a platform user, I want clear feedback when authentication fails, so that I understand what happened and what I can do next.

#### Acceptance Criteria

1. WHEN a Silent_Refresh fails and the session expires, THE Auth_Module SHALL display a "Session Expired" page with a message explaining the session has ended and a button to log in again.
2. WHEN the OIDC Discovery fetch fails (Keycloak unreachable), THE Auth_Module SHALL display an error page indicating the authentication service is unavailable, with a retry button.
3. WHEN a network error occurs during token exchange or refresh, THE Auth_Module SHALL display a transient error notification (PrimeNG Toast) informing the user of a connectivity issue.
4. ALL error pages and messages SHALL use i18n translation keys from the `auth` namespace (see Requirement 9).
5. THE error pages SHALL use PrimeNG components per [DS-001] and SHALL NOT introduce custom-styled error pages outside the design system.
6. ALL auth-related errors thrown or propagated by Auth_Service, OidcDiscoveryService, and Auth_Interceptor SHALL use a central `AuthError` type with a discriminated `AuthErrorCode` field. The error codes SHALL be: `network_error` (fetch/XHR failure, timeout, DNS), `invalid_grant` (refresh token expired/revoked/rotated-out), `discovery_failed` (OIDC discovery failed after retries), `invalid_token` (nonce/issuer/audience mismatch), `session_expired` (max session lifetime or idle timeout exceeded), `redirect_loop` (>3 auth failures in 10s), `config_error` (missing environment config). This gives the UI, interceptor, and logging a single discriminant for mapping errors to i18n keys, user actions, and telemetry categories.

### Requirement 16: Auth Error Logging

**User Story:** As a platform developer, I want all authentication errors to be logged consistently with structured metadata, so that I can diagnose auth failures without exposing sensitive data in logs.

#### Acceptance Criteria

1. ALL `AuthError` instances thrown or propagated by Auth_Service, OidcDiscoveryService, and Auth_Interceptor SHALL be logged via `console.error()` (or a future centralized logging service when one is established platform-wide).
2. THE log entry SHALL include: `error.code` (the `AuthErrorCode` discriminant), `error.message` (human-readable description), `timestamp` (ISO 8601 format), and `authSessionId` (the per-login unique session identifier from Token_Store, if available — generated via `crypto.randomUUID()` on each successful login).
3. THE log entry SHALL NOT include: access tokens, refresh tokens, ID tokens, Authorization headers, cookie values, user PII (email, name, sub), or PKCE material (code_verifier, state, nonce).
4. WHEN a centralized logging/telemetry standard is established for the platform, THE logging contract SHALL be extended to route through that service. The `AuthErrorCode` discriminant is designed to map directly to telemetry categories and dashboard filters.
