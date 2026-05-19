# Requirements Document

## Introduction

This feature removes the Micro-Frontend (MFE) architecture from the platform and promotes
`platform-frontend` as the sole, self-contained frontend application. Currently, the platform
runs a multi-layer MFE stack: `mfe-host` acts as the shell/orchestrator, `platform-frontend`
is compiled as a Webpack Module Federation remote and served through CFMDS (Controlled
Federated Module Distribution Server), and `eco-snap-components-library` and
`graph-visualization` are additional federation remotes. This architecture adds significant
operational and development complexity with no remaining benefit, since `platform-frontend`
already contains all application features.

The goal is to:
1. Make `platform-frontend` the only frontend — it serves its own shell, handles its own
   authentication, and is deployed directly behind Nginx.
2. Decommission `mfe-host`, `cfmds`, `minio-cfmds`, and all federation build tooling.
3. Simplify `platform-runtime` orchestration by removing the MFE compose file and related
   scripts.
4. Remove all federation-specific code from `platform-frontend` (webpack config, bootstrap
   remote entry, federated routing, `ExecutionModeService` dual-mode logic, `ShellContextBridge`,
   `FederatedTokenProvider`, etc.).
5. Ensure the standalone dev workflow (`pnpm start`) and the Docker production workflow
   (`Dockerfile` → nginx) continue to work without any MFE dependencies.

---

## Glossary

- **Platform_Frontend**: The Angular 21 SPA (`platform-frontend` repo) that will become the
  sole frontend application after this migration.
- **MFE_Host**: The Rspack shell application (`mfe-host` repo) that currently acts as the
  federation orchestrator. It will be decommissioned.
- **CFMDS**: Controlled Federated Module Distribution Server — the FastAPI + ATS caching
  gateway that distributes federation artifacts. It will be decommissioned.
- **Module_Federation**: The Webpack Module Federation plugin configuration in
  `platform-frontend` that exposes `./bootstrap` as a remote entry. It will be removed.
- **Remote_Entry**: The `remoteEntry.js` artifact produced by the `build:federation` script.
  It will no longer be built or served.
- **Federation_Build**: The `Dockerfile.federation` + `build:federation` npm script that
  produces the Module Federation bundle. It will be removed.
- **Standalone_Mode**: The execution path where `platform-frontend` bootstraps directly via
  `main.ts → bootstrapApplication()`, without any host shell. This is the only mode after
  migration.
- **Federated_Mode**: The execution path where `platform-frontend` is loaded as a remote by
  `mfe-host` via `bootstrap.ts → mount()/unmount()`. This path will be removed.
- **ShellComponent**: The Angular component in `platform-frontend` that provides the
  application chrome (sidebar, header, breadcrumb). It will remain and become the sole shell.
- **AuthService**: The standalone Keycloak OIDC authentication service in `platform-frontend`.
  It will remain as the sole authentication mechanism.
- **Platform_Runtime**: The `platform-runtime` repo that orchestrates all services via Docker
  Compose. Its MFE-specific compose file and scripts will be removed.
- **Nginx**: The reverse proxy that routes traffic to backend services and serves the frontend.
  After migration, it will serve `platform-frontend` directly.
- **Docker_Compose_MFEs**: The `docker-compose.mfes.yml` file in `platform-runtime` that
  defines `mfe-host`, `cfmds`, `minio-cfmds`, and `minio-cfmds-init`. It will be removed.
- **Frontend_Config**: The `config.json` file served at runtime that provides Keycloak
  coordinates and backend service URLs to `platform-frontend`.
- **Eco_Snap_Components_Library**: The federation remote that provides shared UI components.
  It will be decommissioned.
- **Graph_Visualization**: The federation remote that provides graph visualization
  capabilities. It will be decommissioned.

---

## Requirements

### Requirement 1: Remove Module Federation from platform-frontend build

**User Story:** As a developer, I want `platform-frontend` to build as a standard Angular SPA
without any Webpack Module Federation configuration, so that the build is simpler, faster, and
free of federation-specific tooling.

#### Acceptance Criteria

1. THE Platform_Frontend SHALL build successfully using `ng build` (the `@angular/build:application`
   builder) without any `@angular-builders/custom-webpack` or `ModuleFederationPlugin` involvement.
2. WHEN the production build completes, THE Platform_Frontend SHALL NOT produce a `remoteEntry.js`
   artifact in the output directory.
3. THE Platform_Frontend SHALL NOT contain `webpack.config.ts` after the migration.
4. THE Platform_Frontend SHALL NOT contain `Dockerfile.federation` after the migration.
5. THE Platform_Frontend SHALL NOT contain the `build:federation` npm script in `package.json`
   after the migration.
6. WHEN `pnpm build` is executed, THE Platform_Frontend SHALL produce a complete, deployable
   SPA bundle in `dist/platform-frontend/browser/` without requiring any additional build steps.
7. THE Platform_Frontend SHALL NOT depend on `@angular-architects/module-federation` or
   `@angular-builders/custom-webpack` packages after the migration.

---

### Requirement 2: Remove federated execution mode from platform-frontend

**User Story:** As a developer, I want `platform-frontend` to have a single execution path
(standalone), so that the codebase is simpler and there is no dead code for a host shell that
no longer exists.

#### Acceptance Criteria

1. THE Platform_Frontend SHALL NOT contain `src/bootstrap.ts` (the remote entry lifecycle
   module) after the migration.
2. THE Platform_Frontend SHALL NOT contain `ExecutionModeService` or any `isFederated` /
   `isStandalone` branching logic after the migration.
3. THE Platform_Frontend SHALL NOT contain `ShellContextBridge`, `ShellContext` types, or
   `RemoteModuleContract` interface after the migration.
4. THE Platform_Frontend SHALL NOT contain `FederatedTokenProvider` after the migration.
5. THE Platform_Frontend SHALL NOT contain `federated-app.routes.ts`, `federated-route-config.ts`,
   `federated-route-map.ts`, or `federated-navigation.service.ts` after the migration.
6. THE Platform_Frontend SHALL NOT contain `src/app/routing/` directory if it only contained
   federation-specific routing files after the migration.
7. WHEN `main.ts` is executed, THE Platform_Frontend SHALL bootstrap directly via
   `bootstrapApplication(App, appConfig)` without any conditional mode detection.
8. THE Platform_Frontend SHALL use `StandaloneTokenProvider` as the sole `TOKEN_PROVIDER`
   implementation after the migration.
9. THE Platform_Frontend SHALL use `AuthService` (Keycloak OIDC) as the sole authentication
   mechanism after the migration.

---

### Requirement 3: Consolidate application routing to a single route configuration

**User Story:** As a developer, I want a single `app.routes.ts` that defines all application
routes, so that there is no duplication between standalone and federated route configurations.

#### Acceptance Criteria

1. THE Platform_Frontend SHALL have exactly one route configuration file (`app.routes.ts`)
   that defines all application routes after the migration.
2. THE Platform_Frontend SHALL NOT have `federated-app.routes.ts` as a separate route
   configuration after the migration.
3. WHEN a user navigates to any previously supported route (e.g., `/intelligence/person`,
   `/snap`, `/audit-logs`, `/admin`, `/admin/tasks`), THE Platform_Frontend SHALL render the
   correct feature module.
4. THE Platform_Frontend SHALL preserve the existing `AuthGuard` on the root shell route
   after the migration.
5. THE Platform_Frontend SHALL preserve the existing redirect from `/` to
   `/intelligence/person` after the migration.

---

### Requirement 4: Decommission mfe-host

**User Story:** As a platform operator, I want `mfe-host` to be removed from the running
stack, so that we no longer maintain or operate a shell application that serves no purpose.

#### Acceptance Criteria

1. THE Platform_Runtime SHALL NOT start the `mfe-host` container in any Docker Compose
   profile after the migration.
2. THE Platform_Runtime SHALL NOT reference the `mfe-host` build context in any Docker
   Compose file after the migration.
3. WHEN `make up` or `make up-full` is executed, THE Platform_Runtime SHALL NOT attempt to
   build or start `mfe-host`.
4. THE Platform_Runtime SHALL remove `docker-compose.mfes.yml` or remove the `mfe-host`
   service definition from it after the migration.
5. THE Platform_Runtime `services.yml` SHALL mark `mfe-host` as decommissioned or remove
   its entry after the migration.

---

### Requirement 5: Decommission CFMDS and its storage

**User Story:** As a platform operator, I want CFMDS, `minio-cfmds`, and all federation
artifact storage to be removed from the stack, so that we no longer operate infrastructure
that exists solely to distribute federation bundles.

#### Acceptance Criteria

1. THE Platform_Runtime SHALL NOT start `cfmds`, `minio-cfmds`, or `minio-cfmds-init`
   containers in any Docker Compose profile after the migration.
2. THE Platform_Runtime SHALL NOT reference the `mfe-cfmds` build context in any Docker
   Compose file after the migration.
3. THE Platform_Runtime SHALL remove the `ensure-mfe-buckets.sh` script invocation from all
   Makefile targets after the migration.
4. THE Platform_Runtime SHALL remove the `seed-modules.sh` script invocation from all
   Makefile targets after the migration.
5. THE Platform_Runtime SHALL remove the `build-federation-*` Makefile targets after the
   migration.
6. THE Platform_Runtime SHALL remove the `up-mfes` Makefile target after the migration.
7. THE Platform_Runtime SHALL remove the `seed-modules` Makefile target after the migration.
8. THE Platform_Runtime SHALL remove the `ensure-mfe-buckets` Makefile target after the
   migration.
9. IF `docker-compose.mfes.yml` is removed, THEN THE Platform_Runtime SHALL update all
   Makefile compose file references (`MFES` and `ALL` variables) accordingly.
10. THE Platform_Runtime `services.yml` SHALL mark `mfe-cfmds` as decommissioned or remove
    its entry after the migration.

---

### Requirement 6: Serve platform-frontend directly via Nginx

**User Story:** As a platform operator, I want Nginx to serve `platform-frontend` directly
(instead of proxying to `mfe-host`), so that the frontend is accessible through the standard
reverse proxy without an intermediate shell container.

**Scope note:** To keep CI pipeline changes to a minimum, the primary deliverable for this
requirement is updating the existing Nginx configuration in `shared-infra` to point to
`platform-frontend` instead of `mfe-host`. A new `docker-compose` service for
`platform-frontend` SHALL NOT be added if doing so would require CI pipeline changes.

#### Acceptance Criteria

1. WHEN a user accesses the platform via the Nginx reverse proxy, THE Nginx SHALL serve the
   `platform-frontend` SPA directly.
2. THE Nginx configuration SHALL proxy all `/api/*` paths to the appropriate backend services,
   preserving the existing API routing.
3. THE Nginx configuration SHALL serve `platform-frontend` static assets with appropriate
   cache headers (long-lived cache for hashed assets, no-cache for `index.html`).
4. THE Nginx configuration SHALL implement the SPA fallback: all non-asset, non-API paths
   SHALL resolve to `index.html`.
5. THE Nginx configuration in `shared-infra` SHALL update the upstream target from
   `mfe-host` to `platform-frontend`, and SHALL NOT introduce changes that require
   modifications to the CI pipeline.
6. THE Platform_Frontend Docker service SHALL mount `config/frontend-config.json` at
   `/usr/share/nginx/html/config.json` to inject runtime configuration.
7. THE Platform_Frontend Docker service SHALL be accessible through the `trillian-net`
   Docker network.
8. THE Platform_Frontend `Dockerfile` SHALL continue to use the existing multi-stage build
   (Node builder → nginx runtime) without modification to the production build process.

---

### Requirement 7: Remove federation-specific environment variables and secrets

**User Story:** As a platform operator, I want all MFE-related environment variables and
secrets to be removed from `platform-runtime`, so that the `.env` file and secrets directory
only contain configuration that is actually used.

#### Acceptance Criteria

1. THE Platform_Runtime `.env.example` SHALL NOT contain `PORT_CFMDS`, `S3_BUCKET_CFMDS`,
   `MINIO_STAGING_EXPIRY_DAYS`, `KC_CFMDS_SERVICE_SECRET`, or `PORT_MINIO_CFMDS_API` /
   `PORT_MINIO_CFMDS_CONSOLE` variables after the migration.
2. THE Platform_Runtime `scripts/init-secrets.sh` SHALL NOT generate `kc_cfmds_service_secret`
   or `cfmds`-related secret files after the migration.
3. THE Platform_Runtime `scripts/ensure-mfe-buckets.sh` SHALL be removed or made a no-op
   after the migration.
4. THE Platform_Runtime `scripts/seed-modules.sh` SHALL be removed after the migration.
5. THE Platform_Runtime `scripts/generate-frontend-config.sh` SHALL continue to generate
   `config/frontend-config.json` correctly, as this file is still needed by `platform-frontend`.
6. THE Platform_Runtime `config/frontend-config.template.json` SHALL NOT contain
   `remotesBaseUrl` after the migration, as CFMDS no longer exists.

---

### Requirement 8: Remove federation-specific e2e tests from platform-frontend

**User Story:** As a developer, I want all e2e tests that test federation lifecycle and
federated auth to be removed, so that the test suite only covers the actual application
behaviour.

#### Acceptance Criteria

1. THE Platform_Frontend SHALL NOT contain `e2e/federation-auth.spec.ts` after the migration.
2. THE Platform_Frontend SHALL NOT contain `e2e/federation-lifecycle.spec.ts` after the
   migration.
3. THE Platform_Frontend SHALL NOT contain `e2e/federation-harness.html` after the migration.
4. THE Platform_Frontend SHALL NOT contain `e2e/standalone-auth-fix.spec.ts` or
   `e2e/standalone-auth-fix-preservation.spec.ts` if these tests exist solely to validate
   federation-related auth fixes after the migration.
5. WHEN `pnpm test` is executed, THE Platform_Frontend SHALL run only tests that are relevant
   to the standalone application behaviour.

---

### Requirement 9: Update developer documentation and Makefile help

**User Story:** As a developer, I want the `Makefile` help text and `README` to reflect the
simplified stack, so that onboarding instructions are accurate and do not reference removed
components.

#### Acceptance Criteria

1. THE Platform_Runtime `Makefile` help target SHALL NOT reference `up-mfes`,
   `build-federation-*`, `seed-modules`, or `ensure-mfe-buckets` targets after the migration.
2. THE Platform_Runtime `Makefile` `up-dev` target description SHALL accurately describe the
   simplified dev workflow (infra + services + frontend container, or infra + services +
   `pnpm start`).
3. THE Platform_Runtime `README.md` SHALL NOT reference `mfe-host`, `cfmds`, or federation
   build steps after the migration.
4. THE Platform_Frontend `README.md` SHALL NOT reference `build:federation`, `Dockerfile.federation`,
   or federated mode after the migration.
5. THE Platform_Runtime `services.yml` SHALL accurately reflect the decommissioned services
   after the migration.

---

### Requirement 10: Preserve all existing application features and authentication

**User Story:** As an end user, I want all existing application features to continue working
after the MFE removal, so that the migration is transparent and does not regress any
functionality.

#### Acceptance Criteria

1. WHEN a user accesses the platform, THE Platform_Frontend SHALL authenticate the user via
   Keycloak OIDC using the existing `AuthService` flow (PKCE, token refresh, idle timeout).
2. WHEN an authenticated user navigates to any feature route, THE Platform_Frontend SHALL
   render the correct feature (SNAP, audit logs, person intelligence, documents, workflows,
   IAM admin, tasks).
3. THE Platform_Frontend SHALL preserve all existing HTTP interceptors (`AuthInterceptor`,
   error interceptor) after the migration.
4. THE Platform_Frontend SHALL preserve all existing guards (`AuthGuard`, role guard,
   security level guard) after the migration.
5. THE Platform_Frontend SHALL preserve the `ShellComponent` (sidebar, header, breadcrumb,
   user menu) as the application chrome after the migration.
6. WHEN the application is served in production via Docker, THE Platform_Frontend SHALL load
   `config.json` at startup to resolve Keycloak coordinates and backend service URLs.
7. THE Platform_Frontend SHALL preserve the existing i18n setup (`@ngx-translate`) and all
   locale files after the migration.
8. THE Platform_Frontend SHALL preserve the existing PrimeNG theme (`ApoloPreset`) after
   the migration.

---

### Requirement 11: Decommission eco-snap-components-library and graph-visualization

**User Story:** As a platform operator, I want `eco-snap-components-library` and
`graph-visualization` to be fully decommissioned from the stack, so that we no longer build,
run, or reference federation remotes that are no longer consumed by any application.

#### Acceptance Criteria

1. THE Platform_Runtime SHALL NOT start the `eco-snap-components-library` container in any
   Docker Compose profile after the migration.
2. THE Platform_Runtime SHALL NOT start the `graph-visualization` container in any Docker
   Compose profile after the migration.
3. THE Platform_Runtime SHALL NOT reference the `eco-snap-components-library` build context
   in any Docker Compose file after the migration.
4. THE Platform_Runtime SHALL NOT reference the `graph-visualization` build context in any
   Docker Compose file after the migration.
5. WHEN `make up` or `make up-full` is executed, THE Platform_Runtime SHALL NOT attempt to
   build or start `eco-snap-components-library` or `graph-visualization`.
6. THE Platform_Runtime `services.yml` SHALL mark `eco-snap-components-library` as
   decommissioned or remove its entry after the migration.
7. THE Platform_Runtime `services.yml` SHALL mark `graph-visualization` as decommissioned
   or remove its entry after the migration.
8. IF `docker-compose.mfes.yml` contains `eco-snap-components-library` or
   `graph-visualization` service definitions, THEN THE Platform_Runtime SHALL remove those
   definitions as part of removing `docker-compose.mfes.yml`.
