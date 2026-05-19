# Tasks: MFE Phase 3 — platform-frontend as Federated Module

## Task 1: Module Federation Build Setup

- [x] 1.1 Install `@angular-architects/module-federation` package compatible with Angular 21
  - Run `pnpm add @angular-architects/module-federation` and verify compatibility
  - If `@angular-architects/module-federation` does not support Angular 21's `@angular/build:application` builder, evaluate using native Module Federation via a custom webpack config with `@angular-builders/custom-webpack` or Angular's esbuild plugin federation support
- [x] 1.2 Create `webpack.config.ts` at project root with Module Federation remote configuration
  - Set `name: 'platform_frontend'`
  - Set `filename: 'remoteEntry.js'`
  - Expose `'./bootstrap': './src/bootstrap.ts'`
  - Declare shared singletons: `@angular/core`, `@angular/common`, `@angular/router`, `@angular/platform-browser`, `@angular/platform-browser-dynamic`, `@angular/animations`, `rxjs`
- [x] 1.3 Update `angular.json` to add a `build:federation` configuration
  - Add a new architect target or configuration that uses the Module Federation builder
  - Keep the existing `build` target unchanged for standalone builds
  - Ensure `pnpm build` (standalone) and `pnpm build:federation` (federated) both work
- [x] 1.4 Add `build:federation` script to `package.json`
  - Add `"build:federation": "ng build --configuration federation"` (or equivalent command based on the chosen builder approach)
- [x] 1.5 Verify federation build output
  - Run `pnpm build:federation` and confirm output contains `remoteEntry.js` plus chunk files
  - Run `pnpm build` and confirm standard output is unchanged (no `remoteEntry.js`)

## Task 2: Execution Mode Service

- [x] 2.1 Create `src/app/services/execution-mode.service.ts`
  - Implement `ExecutionModeService` as `@Injectable({ providedIn: 'root' })`
  - Use Angular signals: `isFederated = signal(false)`, `isStandalone = computed(() => !this.isFederated())`
  - Implement `markAsFederated()` method that sets `isFederated` to `true`
  - Default state is standalone (isFederated = false)

## Task 3: Shell Context Bridge Service

- [x] 3.1 Create `src/app/shell/shell-context-bridge.service.ts`
  - Implement `ShellContextBridge` as `@Injectable({ providedIn: 'root' })`
  - Hold `shellContext` as a `WritableSignal<ShellContext | null>` (initially null)
  - Derive computed signals: `isDark`, `locale`, `activePillar` from the shell context
  - Implement `setContext(context: ShellContext)` that updates the signal inside `NgZone.run()`
  - Implement `getAccessToken(): Promise<string>` that delegates to `shellContext().auth.getAccessToken()`
- [x] 3.2 Define a local TypeScript interface file `src/app/shell/shell-context.types.ts`
  - Copy the `ShellContext`, `AuthContext`, `ThemeContext`, `I18nContext`, `NavigationService`, `PermissionContext`, `NotificationService`, `EventBus`, `RouteParams` interfaces from `mfe-host/src/types/shell-api.ts`
  - These are the consumed types — platform-frontend does not depend on mfe-host at build time

## Task 4: Token Provider Abstraction

- [x] 4.1 Create `src/app/auth/services/token-provider.ts` with the `TokenProvider` interface and injection token
  - Define `TokenProvider` interface with `getAccessToken(): Promise<string | null>` and `isAuthenticated(): boolean`
  - Define `TOKEN_PROVIDER = new InjectionToken<TokenProvider>('TokenProvider')`
- [x] 4.2 Create `src/app/auth/services/federated-token-provider.ts`
  - Implement `FederatedTokenProvider` that injects `ShellContextBridge`
  - `getAccessToken()` delegates to `ShellContextBridge.getAccessToken()`
  - `isAuthenticated()` returns `true` if `ShellContextBridge.shellContext()` is not null and `auth.isAuthenticated` is true
- [x] 4.3 Create `src/app/auth/services/standalone-token-provider.ts`
  - Implement `StandaloneTokenProvider` that injects the existing `AuthService`
  - `getAccessToken()` returns `Promise.resolve(authService.getAccessToken())`
  - `isAuthenticated()` returns `authService.snapshot.status === 'authenticated'`
- [x] 4.4 Refactor `AuthInterceptor` to use `TOKEN_PROVIDER` instead of directly accessing `AuthService`/`TokenStoreService` for token retrieval
  - Inject `TOKEN_PROVIDER` and use it for `getAccessToken()` in the credential attachment flow
  - In federated mode, on 401 response: do NOT call `auth.handleUnauthorized()` (which triggers Keycloak). Instead, emit `auth:token-expired` event on the `ShellContext.eventBus` via `ShellContextBridge`
  - In standalone mode, preserve existing 401 handling behavior unchanged

## Task 5: Shell Component Refactoring

- [x] 5.1 Refactor `src/app/shell/shell.html` for dual-mode rendering
  - Inject `ExecutionModeService` into `ShellComponent`
  - Use `@if (executionMode.isStandalone())` to conditionally render the full shell layout (header, sidebar, breadcrumb)
  - In federated mode, render only `<main class="l-shell__content l-shell__content--federated"><router-outlet /></main>`
  - Keep `<p-toast>` and `<p-confirmdialog>` in both modes (notifications still needed)
- [x] 5.2 Add `l-shell__content--federated` CSS class to `src/app/shell/shell.scss`
  - Remove shell-related margins, padding, and positioning so content fills the host container
  - Ensure the federated content area is `width: 100%; height: 100%` relative to the host container
- [x] 5.3 Refactor `ShellComponent.ngOnInit()` to skip identity context loading in federated mode
  - In federated mode, the host provides user identity via `ShellContext.auth.user` — skip the `/me` API call
  - In standalone mode, preserve existing `ActiveOrgService` initialization logic unchanged

## Task 6: Theme Service Integration

- [x] 6.1 Refactor `ThemeService` to accept external theme state in federated mode
  - Add a method `setFromHost(isDark: boolean)` that updates the `isDark` signal without persisting to `localStorage`
  - In federated mode, disable the `localStorage` persistence and `prefers-color-scheme` media query listener (the host owns theme state)
  - In standalone mode, preserve existing behavior unchanged
- [x] 6.2 Wire `ShellContextBridge` theme changes to `ThemeService`
  - In `ShellContextBridge.setContext()`, when the theme changes, call `ThemeService.setFromHost(context.theme.colorMode === 'dark')`
  - Ensure PrimeNG's `p-dark` class toggles correctly when the host sends theme updates

## Task 7: i18n Integration

- [x] 7.1 Wire `ShellContextBridge` locale changes to `TranslateService`
  - In `ShellContextBridge.setContext()`, when the locale changes, call `TranslateService.use(context.i18n.activeLocale)`
  - Only call `use()` if the locale actually changed (avoid unnecessary re-renders)
  - Validate the locale is in the supported list (`['en', 'pt-BR']`) before applying

## Task 8: Router Configuration for Federated Mode

- [x] 8.1 Create a federated route configuration that adjusts base href
  - When running as federated, provide `APP_BASE_HREF` as `/app` (or the route prefix from the manifest) so Angular router matches sub-routes correctly
  - When running standalone, keep the default base href (`/`)
- [x] 8.2 Handle cross-remote navigation
  - Create a `FederatedNavigationService` that intercepts navigation attempts to routes outside `/app/**`
  - For external routes, delegate to `ShellContext.navigation.navigate(path)` instead of Angular Router
  - For internal routes (within `/app/**`), use Angular Router normally
- [x] 8.3 Adjust route definitions for federated compatibility
  - The current routes have `path: ''` as the shell wrapper with children. In federated mode, the shell wrapper still exists (for the router-outlet) but the children paths must align with the `/app` prefix
  - Ensure lazy-loaded feature routes (`snap`, `audit-logs`, `intelligence`, `admin`) resolve correctly under both modes

## Task 9: Bootstrap Entry Point

- [x] 9.1 Create `src/bootstrap.ts` implementing `RemoteModuleContract`
  - Import `bootstrapApplication` from `@angular/platform-browser`
  - Import `App` component and create a federated-specific `appConfig` that:
    - Uses `FederatedTokenProvider` for `TOKEN_PROVIDER`
    - Skips `APP_INITIALIZER` for Keycloak (no `AuthService.initialize()`)
    - Skips `APP_INITIALIZER` for `RuntimeConfigService.load()` (config comes from host)
    - Provides `APP_BASE_HREF` based on the host's route context
  - Implement `mount(container, context)`:
    1. Call `ExecutionModeService.markAsFederated()`
    2. Call `ShellContextBridge.setContext(context)`
    3. Create a root element inside the container
    4. Call `bootstrapApplication(App, federatedAppConfig)` targeting the root element
    5. Store the `ApplicationRef` for later teardown
  - Implement `unmount()`:
    1. Call `appRef.destroy()`
    2. Clear the container's innerHTML
    3. Set `appRef` to null
  - Implement `onContextChange(context)`:
    1. Guard: if `appRef` is null (unmounted), return silently
    2. Call `ShellContextBridge.setContext(context)` inside `NgZone.run()`
- [x] 9.2 Ensure `src/main.ts` remains unchanged for standalone mode
  - The existing `main.ts` continues to use `appConfig` (with Keycloak, RuntimeConfig, etc.)
  - `bootstrap.ts` is only loaded when mfe-host imports `./bootstrap` via Module Federation

## Task 10: Federated Dockerfile and Build Artifacts

- [x] 10.1 Create `Dockerfile.federation` for building the federation bundle
  - Multi-stage build: Stage 1 runs `pnpm build:federation`, Stage 2 is a minimal image that holds the build artifacts (or the artifacts are extracted by CI)
  - The federation build output is a directory of static files (`remoteEntry.js`, chunks, etc.) — not a running server
- [x] 10.2 Create `scripts/build-federation.sh` helper script
  - Runs `pnpm build:federation`
  - Generates `checksums.json` (SHA256 hashes of all output files)
  - Generates `manifest.json` with module metadata (name, version, exposed module, shared deps, supported locales)
  - Output is a self-contained directory ready for CFMDS ingestion

## Task 11: CI Pipeline Integration

- [x] 11.1 Add federation build step to `azure-pipelines.yml` (or equivalent CI config)
  - On tag push: run `pnpm build:federation`, generate checksums, sign manifest
  - Publish artifacts to CFMDS via `cfmds_tools ingest` CLI
  - This mirrors the eco-snap-shell CI pipeline pattern
- [x] 11.2 Add `build:federation` to CI validation on PR
  - Ensure the federation build succeeds on every PR (catch breaking changes early)
  - Do not publish to CFMDS on PR — only on tag push

## Task 12: platform-runtime Integration

- [x] 12.1 Update `scripts/seed-modules.sh` in platform-runtime to include platform-frontend
  - Add platform-frontend module publishing alongside eco-snap-shell
  - Build the federation bundle from the local repo (`${REPOS_ROOT:-..}/platform-frontend`)
  - Publish to CFMDS using `cfmds_tools ingest`
  - Idempotent: skip if version already exists in CFMDS
- [x] 12.2 Verify `make up` starts the full stack with platform-frontend published
  - After `make up`, `curl -k https://localhost/remotes/manifest.json` returns a manifest with both `eco-snap-shell` and `platform-frontend` entries
  - Navigating to `/app/poi` in the browser loads platform-frontend as a federated module inside the eco-snap-shell layout

## Task 13: Integration Testing

- [x] 13.1 Create a test harness that simulates mfe-host for local testing
  - A simple HTML page that loads `remoteEntry.js`, imports `./bootstrap`, and calls `mount()` with a mock `ShellContext`
  - Useful for testing the federation contract without running the full mfe-host stack
- [x] 13.2 Write integration tests for the mount/unmount lifecycle
  - Test: mount → verify content renders → unmount → verify container is empty
  - Test: mount → onContextChange (theme) → verify theme updates → unmount
  - Test: mount → onContextChange (locale) → verify locale updates → unmount
  - Test: unmount → onContextChange → verify no error thrown
- [x] 13.3 Write integration tests for auth token flow in federated mode
  - Test: mount with mock ShellContext → trigger HTTP request → verify Authorization header uses host token
  - Test: mount with mock ShellContext → simulate 401 → verify no Keycloak redirect, event bus emission instead
