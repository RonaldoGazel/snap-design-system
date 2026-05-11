# Requirements: MFE Runtime Config Injection

## Requirement 1: Extend ShellContext Contract with Config Section

### Why

The mfe-host loads `FrontendConfig` at boot containing all backend service URLs, but these are not forwarded to mounted remotes. Remotes must receive API URLs through the ShellContext to comply with [ARCH-009] Rule 9 and [STD-001].

### Acceptance Criteria

1.1 The canonical `ShellContext` interface in `mfe-host/src/types/shell-api.ts` includes an optional `config` property of type `ShellConfigContext`.

1.2 `ShellConfigContext` contains readonly string fields: `identityServiceUrl`, `permissionServiceUrl`, `auditServiceUrl`, `poiServiceUrl`, `personServiceUrl`, and an optional `documentServiceUrl`.

1.3 The `config` property on `ShellContext` is optional (`config?: ShellConfigContext`) so that existing remotes that do not consume it continue to compile and function without changes.

1.4 The mirror type file in `platform-frontend/src/app/shell/shell-context.types.ts` is updated to match the canonical definition, including `ShellConfigContext` and the optional `config` property on `ShellContext`.

## Requirement 2: ShellContextBuilder Populates Config from FrontendConfig

### Why

The host already has all service URLs in `FrontendConfig`. The builder must map these into the new `config` section of `ShellContext` so every `mount()` and `onContextChange()` call delivers config to remotes.

### Acceptance Criteria

2.1 `ShellContextBuilder` accepts `FrontendConfig` as a constructor parameter (or receives it through another injection mechanism).

2.2 The `build()` method produces a `ShellContext` where `config` is defined and contains all required `ShellConfigContext` fields populated from `FrontendConfig`.

2.3 For any valid `FrontendConfig`, `build().config.poiServiceUrl === frontendConfig.poiServiceUrl` and likewise for all other mapped fields.

2.4 Existing `ShellContext` fields (auth, permissions, navigation, theme, notifications, i18n, eventBus, routeParams) are unchanged by this modification.

2.5 If `FrontendConfig` includes `documentServiceUrl`, it is forwarded to `config.documentServiceUrl`. If absent, the field is omitted.

## Requirement 3: RuntimeConfigService Prefers ShellContext Config in Federated Mode

### Why

In federated mode, the host has already loaded and validated the runtime config. The remote should use it directly instead of making a redundant `/config.json` fetch, reducing mount latency and ensuring config consistency with the host.

### Acceptance Criteria

3.1 When `ExecutionModeService.isFederated()` returns true and `ShellContextBridge.shellContext().config` is defined, `RuntimeConfigService.load()` sets its internal config signal from `ShellContext.config` without fetching `/config.json`.

3.2 When `ExecutionModeService.isFederated()` returns true but `ShellContextBridge.shellContext().config` is undefined (backward compatibility with older hosts), `RuntimeConfigService.load()` falls back to fetching `/config.json`.

3.3 When `ExecutionModeService.isFederated()` returns false (standalone mode), `RuntimeConfigService.load()` fetches `/config.json` and merges it over `environment.ts` defaults — existing behavior is preserved.

3.4 If all config sources fail (no ShellContext config, no `/config.json`), `environment.ts` defaults remain in the config signal — no crash, no undefined URLs.

3.5 `RuntimeConfigService.load()` logs which config source was used: `"[Config] Loaded runtime config from ShellContext"`, `"[Config] Loaded runtime config from /config.json"`, or `"[Config] Using built-in defaults"`.

## Requirement 4: Environment Defaults Use Relative Paths

### Why

The current `environment.ts` hardcodes absolute URLs with `localhost` and specific ports (e.g., `http://localhost:8003/api/v1/poi`), violating [STD-001]. Relative paths work behind nginx in any environment and resolve to the current page origin.

### Acceptance Criteria

4.1 All service URL fields in `environment.ts` (`identityServiceUrl`, `permissionServiceUrl`, `auditServiceUrl`, `poiServiceUrl`, `personServiceUrl`) use relative paths starting with `/api/v1/`.

4.2 No service URL field in `environment.ts` contains a protocol (`http://` or `https://`), hostname, or port number.

4.3 The `trustedOrigins` array in `environment.ts` is set to an empty array — the auth interceptor no longer relies on it.

4.4 Keycloak configuration (`keycloak.baseUrl`, `keycloak.redirectUri`, `keycloak.postLogoutRedirectUri`) retains absolute URLs because Keycloak runs on a different port in standalone mode.

4.5 The relative path defaults work correctly in Tier 2 standalone development when a proxy (e.g., Angular CLI proxy or nginx) routes `/api/v1/*` to backend services.

## Requirement 5: Auth Interceptor Uses Same-Origin Detection

### Why

With relative URLs, all API calls resolve to the same origin as the page. The interceptor should use origin comparison instead of a static `trustedOrigins` list, simplifying configuration and working correctly in both standalone and federated modes.

### Acceptance Criteria

5.1 The auth interceptor attaches credentials to any HTTP request whose resolved origin matches `window.location.origin` (same-origin check).

5.2 For cross-origin requests, the interceptor checks whether the request origin matches the origin of any configured service URL in `RuntimeConfigService.config`.

5.3 Requests to origins that are neither same-origin nor matching a configured service URL pass through without credential attachment.

5.4 The interceptor no longer reads from `environment.trustedOrigins` — the static array is not used.

5.5 The interceptor handles malformed URLs in config gracefully (try/catch around `new URL()`) — a malformed URL is skipped, not thrown.

5.6 In federated mode, the interceptor continues to use `TOKEN_PROVIDER.getAccessToken()` for async token retrieval. In standalone mode, it continues to use `CREDENTIAL_STRATEGY.attachCredentials()` for sync token attachment. This behavior is unchanged.

## Requirement 6: Cross-Repository Consistency

### Why

The ShellContext contract is shared between mfe-host and all remotes. Changes must be coordinated to ensure type safety and runtime compatibility.

### Acceptance Criteria

6.1 The `ShellConfigContext` interface definition in `mfe-host/src/types/shell-api.ts` and `platform-frontend/src/app/shell/shell-context.types.ts` are structurally identical.

6.2 The `FrontendConfig` interface in `mfe-host/src/types/config.ts` includes all fields needed to populate `ShellConfigContext` (add `documentServiceUrl` and `personServiceUrl` if not present).

6.3 The `public/config.json` in platform-frontend is updated to use the same URL format as the host's `frontend-config.json` (relative paths or full URLs depending on deployment mode).

6.4 Both repositories' test suites pass after the changes — no regressions in existing functionality.

## Requirement 7: HTTP Clients Work with Relative URLs

### Why

`PersonServiceClient` and other HTTP clients currently store the service URL at construction time from `RuntimeConfigService.config`. They must work correctly when the URL is a relative path.

### Acceptance Criteria

7.1 `PersonServiceClient` constructs valid HTTP request URLs when `config.personServiceUrl` is a relative path (e.g., `/api/v1/poi`).

7.2 HTTP requests made with relative base URLs resolve to the current page origin — `HttpClient` handles this natively.

7.3 No changes are needed to `PersonServiceClient`'s API call logic — only the URL value changes, not how it's used.

7.4 Any other HTTP clients in platform-frontend that read service URLs from `RuntimeConfigService` also work correctly with relative paths.
