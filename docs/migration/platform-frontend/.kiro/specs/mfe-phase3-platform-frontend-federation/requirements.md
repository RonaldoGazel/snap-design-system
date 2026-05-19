# Requirements: MFE Phase 3 — platform-frontend as Federated Module

## Requirement 1: Module Federation Build Configuration

### Acceptance Criteria

- 1.1 Given the Angular project, when `pnpm build:federation` is run, then a `remoteEntry.js` file is produced in the build output directory alongside the standard Angular build artifacts.
- 1.2 Given the Module Federation configuration, when the `remoteEntry.js` is loaded and `./bootstrap` is imported, then the returned module exports `mount`, `unmount`, and `onContextChange` functions.
- 1.3 Given the Module Federation configuration, when shared dependencies are declared, then `@angular/core`, `@angular/common`, `@angular/router`, `@angular/platform-browser`, and `rxjs` are configured as singletons to prevent duplicate framework instances.
- 1.4 Given the federation build, when the standard `pnpm build` command is run (without federation), then the existing standalone production build is produced unchanged — federation does not break the default build.

### Correctness Properties

- For all federation builds, the output directory contains exactly one `remoteEntry.js` file and at least one chunk file.
- For all shared dependency declarations, singleton is true and the version matches the project's `package.json` version.

---

## Requirement 2: RemoteModuleContract Implementation (bootstrap.ts)

### Acceptance Criteria

- 2.1 Given a valid `HTMLElement` container and `ShellContext`, when `mount(container, context)` is called, then the Angular application is bootstrapped into the container and renders routed content within 5 seconds.
- 2.2 Given a mounted Angular application, when `unmount()` is called, then the Angular `ApplicationRef` is destroyed, all subscriptions are cleaned up, and the container's DOM is emptied.
- 2.3 Given a mounted Angular application, when `onContextChange(context)` is called with an updated `ShellContext`, then the `ShellContextBridge` service receives the new context and derived signals (theme, locale, pillar) update reactively.
- 2.4 Given that `unmount()` has been called, when `onContextChange(context)` is called subsequently, then the call is silently ignored without throwing an error.
- 2.5 Given that `mount()` fails (e.g., provider misconfiguration), when the error is caught, then a structured JSON error log is emitted and the error is re-thrown to allow mfe-host to render its fallback UI.

### Correctness Properties

- For all mount/unmount cycles, the container element has zero child nodes after unmount completes.
- For all onContextChange calls on a mounted app, the ShellContextBridge.shellContext signal value equals the most recently provided ShellContext.

---

## Requirement 3: Shell Ownership Transfer

### Acceptance Criteria

- 3.1 Given the app is running in federated mode, when the `ShellComponent` renders, then the header (`<app-header>`), sidebar (`<app-sidebar>`), and breadcrumb (`<app-breadcrumb>`) components are NOT rendered — only the `<router-outlet>` is present.
- 3.2 Given the app is running in standalone mode, when the `ShellComponent` renders, then the header, sidebar, and breadcrumb components ARE rendered alongside the `<router-outlet>`, preserving the existing layout.
- 3.3 Given either execution mode, when the `ShellComponent` renders, then a `<router-outlet>` is always present in the DOM to host feature routes.
- 3.4 Given the app is running in federated mode, when the content area renders, then it uses a CSS class (`l-shell__content--federated`) that removes shell-related margins and padding so the content fills the host container.

### Correctness Properties

- For all execution modes, the rendered DOM contains exactly one `<router-outlet>` element.
- For all federated mode renders, the DOM contains zero instances of `<app-header>`, `<app-sidebar>`, and `<app-breadcrumb>`.
- For all standalone mode renders, the DOM contains exactly one instance each of `<app-header>`, `<app-sidebar>`, and `<app-breadcrumb>`.

---

## Requirement 4: Auth Token Sharing

### Acceptance Criteria

- 4.1 Given the app is running in federated mode, when an HTTP request requires authentication, then the `FederatedTokenProvider` obtains the access token by calling `ShellContext.auth.getAccessToken()` — no local Keycloak session is created or managed.
- 4.2 Given the app is running in standalone mode, when an HTTP request requires authentication, then the `StandaloneTokenProvider` obtains the access token from the existing `AuthService` which manages its own Keycloak PKCE session.
- 4.3 Given the app is running in federated mode, when the `TOKEN_PROVIDER` injection token is resolved, then it resolves to `FederatedTokenProvider`.
- 4.4 Given the app is running in federated mode, when a 401 HTTP response is received, then the `AuthInterceptor` does NOT trigger a Keycloak login redirect. Instead, it emits an `auth:token-expired` event on the `ShellContext.eventBus`.
- 4.5 Given the app is running in federated mode, when any auth operation occurs, then no tokens are written to `localStorage` or `sessionStorage` by the Angular app.
- 4.6 Given the app is running in standalone mode, when the user logs in, then the existing PKCE-based Keycloak flow operates unchanged with tokens stored in the `TokenStoreService`.

### Correctness Properties

- For all HTTP requests in federated mode, the Authorization header value matches the token returned by `ShellContext.auth.getAccessToken()`.
- For all federated mode operations, `localStorage` and `sessionStorage` contain zero auth-related keys written by the Angular app.

---

## Requirement 5: Router Coexistence

### Acceptance Criteria

- 5.1 Given the app is mounted as a federated module at `/app/**`, when the user navigates to `/app/poi`, then the Angular router activates the POI feature route and renders the POI component within the host container.
- 5.2 Given the app is mounted as a federated module, when the user navigates between `/app/poi` and `/app/documents`, then the Angular router handles the sub-route transition without triggering a full remount of the federated module.
- 5.3 Given the app is mounted as a federated module, when the Angular router resolves routes, then it uses a base href or `APP_BASE_HREF` that aligns with the host's route prefix (`/app`) so that route matching works correctly.
- 5.4 Given the app is running in standalone mode, when the user navigates, then the Angular router operates with its default base href (`/`) and all existing routes work unchanged.
- 5.5 Given the app is mounted as a federated module, when the Angular router needs to navigate to a route outside `/app/**` (e.g., a link to `/intelligence/graph-viewer`), then it delegates to `ShellContext.navigation.navigate()` instead of using the Angular router directly.

### Correctness Properties

- For all sub-route navigations within the federated module, the browser URL reflects the correct path and the Angular router's active route matches.
- For all navigations in standalone mode, the existing route configuration produces identical behavior to the pre-federation codebase.

---

## Requirement 6: Execution Mode Detection

### Acceptance Criteria

- 6.1 Given the `ExecutionModeService` is constructed, when no `markAsFederated()` call has been made, then `isStandalone()` returns `true` and `isFederated()` returns `false`.
- 6.2 Given the `ExecutionModeService`, when `markAsFederated()` is called during `mount()`, then `isFederated()` returns `true` and `isStandalone()` returns `false` for the lifetime of the mount.
- 6.3 Given the execution mode is set, when any component or service reads `isFederated()` or `isStandalone()`, then the value is consistent across the entire application (single source of truth via Angular DI).

### Correctness Properties

- For all states of ExecutionModeService, exactly one of `isFederated()` or `isStandalone()` is true (mutual exclusion).
- For all reads of the execution mode within a single mount lifecycle, the value is stable and does not change.

---

## Requirement 7: Theme and Locale Propagation

### Acceptance Criteria

- 7.1 Given the app is running in federated mode, when `onContextChange()` is called with `theme.colorMode === 'dark'`, then the Angular `ThemeService.isDark` signal is set to `true` and the PrimeNG dark mode class (`p-dark`) is applied to the document element.
- 7.2 Given the app is running in federated mode, when `onContextChange()` is called with `theme.colorMode === 'light'`, then `ThemeService.isDark` is set to `false` and the `p-dark` class is removed.
- 7.3 Given the app is running in federated mode, when `onContextChange()` is called with `i18n.activeLocale === 'pt-BR'`, then `TranslateService.use('pt-BR')` is called and the UI re-renders with Portuguese translations.
- 7.4 Given the app is running in standalone mode, when the user toggles the theme, then the existing `ThemeService.toggle()` behavior operates unchanged.

### Correctness Properties

- For all onContextChange calls with a theme change, the document element's class list contains `p-dark` if and only if `theme.colorMode === 'dark'`.
- For all onContextChange calls with a locale change, `TranslateService.currentLang` equals the provided `i18n.activeLocale`.

---

## Requirement 8: CI Pipeline and CFMDS Publishing

### Acceptance Criteria

- 8.1 Given the platform-frontend repository, when the CI pipeline runs on a tag push, then a federation build is produced and the artifacts (`remoteEntry.js`, chunks, `manifest.json`, `checksums.json`) are published to CFMDS.
- 8.2 Given the `platform-runtime` repository, when `scripts/seed-modules.sh` runs, then it publishes the platform-frontend federated module to CFMDS alongside eco-snap-shell. The script is idempotent — running it twice does not duplicate the module.
- 8.3 Given the CFMDS sidecar, when `GET /remotes/manifest.json` is called after seeding, then the response includes a `platform-frontend` entry with `routes: ["/app/**"]`, a valid `remoteEntry` URL, and `exposedModule: "./bootstrap"`.

### Correctness Properties

- For all seed-modules.sh executions, the CFMDS manifest contains exactly one entry for `platform-frontend` regardless of how many times the script runs.

---

## Requirement 9: Standalone Development Preservation

### Acceptance Criteria

- 9.1 Given the platform-frontend repository, when `pnpm start` is run, then the Angular dev server starts and serves the app at `http://localhost:4200` with full shell (header, sidebar, breadcrumb), Keycloak authentication, and all existing features working.
- 9.2 Given the platform-frontend repository, when `pnpm build` is run (without the federation flag), then the standard production build is produced without Module Federation artifacts.
- 9.3 Given the `docker-compose.dev.yml`, when `docker compose -f docker-compose.dev.yml up --build` is run, then the containerized standalone app starts and connects to the shared infrastructure via `trillian-net`.

### Correctness Properties

- For all standalone builds, the output directory does not contain a `remoteEntry.js` file.
- For all standalone dev server sessions, the full shell chrome is rendered and Keycloak authentication operates normally.
