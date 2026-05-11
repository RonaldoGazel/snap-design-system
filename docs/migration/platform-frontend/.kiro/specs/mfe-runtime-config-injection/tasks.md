# Tasks: MFE Runtime Config Injection

## Task 1: Extend ShellContext contract in mfe-host

> Requirement: 1, 2, 6

- [x] 1.1 Add `ShellConfigContext` interface to `mfe-host/src/types/shell-api.ts` with readonly fields: `identityServiceUrl`, `permissionServiceUrl`, `auditServiceUrl`, `poiServiceUrl`, `personServiceUrl`, and optional `documentServiceUrl`
- [x] 1.2 Add optional `config?: ShellConfigContext` property to the `ShellContext` interface in `mfe-host/src/types/shell-api.ts`
- [x] 1.3 Add `personServiceUrl` field to `FrontendConfig` in `mfe-host/src/types/config.ts` if not already present, and add optional `documentServiceUrl` field
- [x] 1.4 Update `ShellContextBuilder` in `mfe-host/src/shell/shell-context.ts` to accept `FrontendConfig` as a constructor parameter and populate the `config` section in the `build()` method by mapping `FrontendConfig` fields to `ShellConfigContext` fields
- [x] 1.5 Update all call sites of `ShellContextBuilder` constructor in mfe-host to pass the loaded `FrontendConfig` instance
- [x] 1.6 Write unit tests for `ShellContextBuilder` verifying: (a) `build()` returns a ShellContext with `config` defined and all required fields populated, (b) existing ShellContext fields are unchanged, (c) `documentServiceUrl` is included when present in FrontendConfig and omitted when absent

## Task 2: Mirror ShellContext types in platform-frontend

> Requirement: 1, 6

- [x] 2.1 Add `ShellConfigContext` interface to `platform-frontend/src/app/shell/shell-context.types.ts` matching the canonical definition in mfe-host
- [x] 2.2 Add optional `config?: ShellConfigContext` property to the `ShellContext` interface in `platform-frontend/src/app/shell/shell-context.types.ts`
- [x] 2.3 Verify that the platform-frontend project compiles successfully with the updated types (run `ng build` or type-check)

## Task 3: Update RuntimeConfigService for federated config injection

> Requirement: 3

- [x] 3.1 Add `ExecutionModeService` and `ShellContextBridge` as injected dependencies in `RuntimeConfigService`
- [x] 3.2 Refactor `RuntimeConfigService.load()` to check `executionMode.isFederated()` first — if true and `ShellContextBridge.shellContext()?.config` is defined, set the config signal from ShellContext.config and return without fetching `/config.json`
- [x] 3.3 Add fallback logic: if federated mode but `ShellContext.config` is undefined, fall back to the existing `/config.json` fetch path
- [x] 3.4 Add console log messages indicating which config source was used: `"[Config] Loaded runtime config from ShellContext"`, `"[Config] ShellContext.config not available, falling back to /config.json"`, or existing messages for `/config.json` and defaults
- [x] 3.5 Write unit tests for `RuntimeConfigService.load()` covering: (a) federated mode with ShellContext.config present — verify config signal uses ShellContext values and no fetch occurs, (b) federated mode without ShellContext.config — verify `/config.json` fetch is attempted, (c) standalone mode — verify existing `/config.json` fetch behavior is preserved, (d) all sources fail — verify environment.ts defaults remain

## Task 4: Update environment.ts defaults to relative paths

> Requirement: 4

- [x] 4.1 Change `identityServiceUrl` from `'http://localhost:8000/api/v1/identity'` to `'/api/v1/identity'` in `platform-frontend/src/environments/environment.ts`
- [x] 4.2 Change `permissionServiceUrl` from `'http://localhost:8001/api/v1/permissions'` to `'/api/v1/permissions'`
- [x] 4.3 Change `auditServiceUrl` from `'http://localhost:8002/api/v1/audit'` to `'/api/v1/audit'`
- [x] 4.4 Change `poiServiceUrl` from `'http://localhost:8003/api/v1/poi'` to `'/api/v1/poi'`
- [x] 4.5 Change `personServiceUrl` from `'http://localhost:8003/api/v1/poi'` to `'/api/v1/poi'`
- [x] 4.6 Set `trustedOrigins` to an empty array `[] as string[]`
- [x] 4.7 Verify that `keycloak.baseUrl`, `keycloak.redirectUri`, and `keycloak.postLogoutRedirectUri` retain their absolute `localhost` URLs (no change needed for Keycloak)

## Task 5: Update auth interceptor trusted origin logic

> Requirement: 5

- [x] 5.1 Refactor the `intercept()` method in `AuthInterceptor` to first check if the resolved request origin matches `window.location.origin` (same-origin check) — if so, proceed with credential attachment
- [x] 5.2 For cross-origin requests, derive trusted origins dynamically from `RuntimeConfigService.config` service URL fields instead of reading from `environment.trustedOrigins`
- [x] 5.3 Wrap `new URL()` calls for configured service URLs in try/catch to handle malformed URLs gracefully — skip malformed URLs instead of throwing
- [x] 5.4 Remove any remaining references to `environment.trustedOrigins` from the interceptor
- [x] 5.5 Write unit tests for the updated interceptor covering: (a) relative URL request — same-origin, credentials attached, (b) absolute same-origin request — credentials attached, (c) cross-origin request matching a configured service URL — credentials attached, (d) cross-origin request to unknown origin — no credentials, (e) malformed URL in config — gracefully skipped

## Task 6: Update public/config.json for standalone development

> Requirement: 4, 6

- [x] 6.1 Update `platform-frontend/public/config.json` to use URL formats consistent with the nginx-proxied mode (e.g., `https://localhost/api/v1/poi` or relative paths) so standalone Tier 2 development works with `platform-runtime`
- [x] 6.2 Verify that the `public/config.json` values override the `environment.ts` relative path defaults correctly when loaded by `RuntimeConfigService`

## Task 7: Verify HTTP clients work with relative URLs

> Requirement: 7

- [x] 7.1 Verify that `PersonServiceClient` in `platform-frontend/src/app/features/snap/services/person-service-client.ts` constructs valid request URLs when `config.personServiceUrl` is a relative path — Angular `HttpClient` resolves relative URLs against the page origin natively, so no code changes should be needed
- [x] 7.2 Search for any other HTTP clients in platform-frontend that read service URLs from `RuntimeConfigService` and verify they also work with relative paths
- [x] 7.3 Write or update integration tests confirming that API calls with relative base URLs produce correct request URLs

## Task 8: End-to-end verification

> Requirement: 3, 4, 5, 6, 7

- [x] 8.1 Run the full platform-frontend test suite (`pnpm test`) and fix any failures caused by the changes
- [x] 8.2 Run the mfe-host test suite (`pnpm test`) and fix any failures caused by the ShellContextBuilder changes
- [x] 8.3 Verify standalone mode works: run `pnpm start` in platform-frontend, confirm API calls use URLs from `/config.json` or environment defaults
- [x] 8.4 Verify type compilation: run `ng build` (or `tsc --noEmit`) in platform-frontend to confirm no type errors from the updated ShellContext types
