# Design Document: MFE Removal

## Overview

This design covers the complete removal of the Micro-Frontend (MFE) architecture from the
platform. After migration, `platform-frontend` is the sole frontend application: it builds as
a standard Angular SPA, authenticates users directly via Keycloak OIDC, and is served behind
the existing Nginx reverse proxy. All federation-specific code, tooling, containers, and
infrastructure are decommissioned.

The migration is a pure deletion/simplification exercise. No new architecture layers,
patterns, or services are introduced. The existing standalone execution path — already
implemented and working — becomes the only path.

### Current State

```
Browser → Nginx → mfe-host (Rspack shell)
                      ↓ Module Federation
                  platform-frontend (remote, loaded via CFMDS)
                  eco-snap-components-library (remote)
                  graph-visualization (remote)
                      ↑
                  CFMDS (ATS + FastAPI sidecar)
                      ↑
                  minio-cfmds (S3 artifact storage)
```

### Target State

```
Browser → Nginx → platform-frontend (Angular SPA, nginx:80)
```

---

## Architecture

### Component Topology After Migration

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS :443
┌──────────────────────────▼──────────────────────────────────────┐
│  Nginx (shared-infra)                                           │
│  ├── /                    → platform-frontend:80 (SPA)          │
│  ├── /auth/callback       → platform-frontend:80               │
│  ├── /auth/session-expired→ platform-frontend:80               │
│  ├── /auth/error          → platform-frontend:80               │
│  ├── /auth/realms/        → keycloak:8080                       │
│  ├── /api/v1/identity/    → identity-service:8000               │
│  ├── /api/v1/permissions/ → permission-service:8000             │
│  ├── /api/v1/audit/       → audit-service:8000                  │
│  ├── /api/v1/poi/         → poi-service:8002                    │
│  ├── /api/v1/documents/   → document-service:8000               │
│  ├── /api/v1/workflows/   → workflow-service:8000               │
│  └── /config.json         → served directly by nginx            │
└─────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  platform-frontend (Docker: node:24-alpine → nginx:1.27-alpine) │
│  ├── Angular 21 SPA (bootstrapApplication → appConfig)          │
│  ├── AuthService (Keycloak OIDC, PKCE)                          │
│  ├── StandaloneTokenProvider (sole TOKEN_PROVIDER)              │
│  ├── ShellComponent (sidebar, header, breadcrumb, user menu)    │
│  └── Feature modules (snap, audit, person, documents,           │
│       workflows, iam, tasks)                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Removed Components

| Component | Repository | Disposition |
|---|---|---|
| `mfe-host` | `mfe-host` | Decommissioned — container removed from all compose profiles |
| `cfmds` | `mfe-cfmds` | Decommissioned — container removed from all compose profiles |
| `minio-cfmds` | `platform-runtime` | Decommissioned — container removed from all compose profiles |
| `minio-cfmds-init` | `platform-runtime` | Decommissioned — container removed from all compose profiles |
| `eco-snap-components-library` | `eco-snap-components-library` | Decommissioned — container removed from all compose profiles |
| `graph-visualization` | `graph-visualization` | Decommissioned — container removed from all compose profiles |
| `docker-compose.mfes.yml` | `platform-runtime` | Deleted entirely |
| `Dockerfile.federation` | `platform-frontend` | Deleted |
| `webpack.config.ts` | `platform-frontend` | Deleted |
| `src/bootstrap.ts` | `platform-frontend` | Deleted |
| `src/app/routing/` | `platform-frontend` | Directory deleted (all contents are federation-only) |
| `ExecutionModeService` | `platform-frontend` | Deleted |
| `ShellContextBridge` | `platform-frontend` | Deleted |
| `shell-context.types.ts` | `platform-frontend` | Deleted |
| `FederatedTokenProvider` | `platform-frontend` | Deleted |

---

## Components and Interfaces

### platform-frontend: Bootstrap Path

After migration, `main.ts` is the sole entry point. It already contains the correct
implementation — no changes needed to its content:

```typescript
// src/main.ts — unchanged, already correct
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

### platform-frontend: Application Config

`app.config.ts` already provides `StandaloneTokenProvider` as the sole `TOKEN_PROVIDER` and
`AuthService` as the sole authentication mechanism. No changes are needed to its content.

The only change is removing the `ExecutionModeService` import and injection from
`ShellComponent` (see Shell Component section below).

### platform-frontend: Shell Component

`ShellComponent` (`src/app/shell/shell.ts`) currently injects `ExecutionModeService` and
uses it to gate the `/me` API call:

```typescript
// Current — to be simplified
if (!this.executionMode.isStandalone()) {
  return;
}
```

After migration, the guard is removed. The `/me` call runs unconditionally on init (it was
already the standalone path). The `ExecutionModeService` injection is removed entirely.

### platform-frontend: Route Configuration

`app.routes.ts` already defines all application routes correctly for standalone mode. It
remains unchanged. The `src/app/routing/` directory (containing all federated routing files)
is deleted entirely.

### platform-frontend: Theme Service

`ThemeService` (`src/app/shell/theme.service.ts`) has a `setFromHost()` method and a
`hostControlled` flag used only in federated mode. These are dead code after migration.

The `setFromHost()` method and `hostControlled` flag are removed. The media query listener
setup and localStorage persistence always apply (standalone behavior). The `ShellContextBridge`
that called `setFromHost()` is also deleted, so there are no callers to update.

### platform-frontend: Build Configuration

Two changes to `angular.json`:
1. Remove the `build-federation` architect target (the entire `"build-federation"` key under
   `architect`).
2. No changes to the `build`, `serve`, or `test` targets — they already use
   `@angular/build:application` and `@angular/build:dev-server`.

Two changes to `package.json`:
1. Remove the `"build:federation"` script from `scripts`.
2. Remove `@angular-architects/module-federation` from `dependencies`.
3. Remove `@angular-builders/custom-webpack` from `devDependencies`.
4. Remove `webpack` from `devDependencies` (only needed for the federation build).

### platform-runtime: Compose Orchestration

`docker-compose.mfes.yml` is deleted entirely. It defines all four decommissioned services:
`minio-cfmds`, `minio-cfmds-init`, `mfe-host`, and `cfmds`. Deleting the file removes all
four in one operation.

The `Makefile` is updated to:
- Remove the `MFES` variable and the `ALL` variable (or redefine `ALL` without
  `docker-compose.mfes.yml`).
- Remove the `up-mfes` target.
- Remove the `build-federation-eco-snap`, `build-federation-platform-frontend`,
  `build-federation-graph-visualization`, and `build-federation-modules` targets.
- Remove the `seed-modules` target.
- Remove the `ensure-mfe-buckets` target.
- Remove all `$(MFES)` and `$(ALL)` invocations from `up`, `up-extended`, `up-full`,
  `up-full-rebuild`, `down`, `reset`, `logs`, `ps` targets.
- Update the `up` target to remove the federation build pipeline steps
  (`build-federation-modules`, `ensure-mfe-buckets`, `seed-modules`).
- Update the `help` target to remove all MFE-related entries.
- Update the `.PHONY` declaration to remove all deleted targets.

The `down`, `reset`, `logs`, and `ps` targets currently use `$(ALL)` which includes
`docker-compose.mfes.yml`. After deletion, these targets use only `$(SERVICES)` (infra +
services).

### platform-runtime: Scripts

| Script | Action |
|---|---|
| `scripts/ensure-mfe-buckets.sh` | Delete |
| `scripts/seed-modules.sh` | Delete |
| `scripts/init-secrets.sh` | Remove `kc_cfmds_service_secret` entry from `SECRET_MAP` |
| `scripts/generate-frontend-config.sh` | No change needed — already correct |

### platform-runtime: Configuration Files

| File | Change |
|---|---|
| `.env.example` | Remove: `PORT_CFMDS`, `KC_CFMDS_SERVICE_SECRET`, `S3_BUCKET_CFMDS`, `MINIO_STAGING_EXPIRY_DAYS`, `PORT_MINIO_CFMDS_API`, `PORT_MINIO_CFMDS_CONSOLE` |
| `config/frontend-config.template.json` | Remove the `"remotesBaseUrl"` key |
| `services.yml` | Mark `mfe-host`, `mfe-cfmds`, `eco-snap-components-library`, and `graph-visualization` as `status: decommissioned` |

### shared-infra: Nginx Configuration

The single change in `shared-infra/config/nginx/nginx.conf` is replacing all occurrences of
`http://mfe-host:80` with `http://platform-frontend:80`. This affects four locations:

1. The root `location /` block — `set $upstream_frontend http://mfe-host:80`
2. The `location /auth/callback` block — `set $upstream_frontend_cb http://mfe-host:80`
3. The `location /auth/session-expired` block — `set $upstream_frontend_se http://mfe-host:80`
4. The `location /auth/error` block — `set $upstream_frontend_err http://mfe-host:80`

Additionally, the two CFMDS-related location blocks are removed:
- `location = /remotes/manifest.json` (CFMDS sidecar proxy)
- `location /remotes/` (CFMDS ATS proxy)

The `$cfmds_content_type` map and the CFMDS reference in the `Content-Security-Policy` header
are also removed.

The `platform-frontend` service must be on the `trillian-net` Docker network for Nginx to
resolve its hostname. This is already the case in the existing `docker-compose.mfes.yml`
`mfe-host` service definition — the same network configuration applies to `platform-frontend`.

### platform-frontend: E2E Tests

The following files in `platform-frontend/e2e/` are deleted:
- `federation-auth.spec.ts`
- `federation-lifecycle.spec.ts`
- `federation-harness.html`
- `standalone-auth-fix.spec.ts`
- `standalone-auth-fix-preservation.spec.ts`

The remaining file `test_login_flow.py` is preserved (it tests the standalone auth flow).

---

## Data Models

### Runtime Configuration (`config.json`)

The `frontend-config.template.json` currently produces:

```json
{
  "keycloak": { ... },
  "identityServiceUrl": "...",
  "permissionServiceUrl": "...",
  "auditServiceUrl": "...",
  "poiServiceUrl": "...",
  "personServiceUrl": "...",
  "remotesBaseUrl": "${FRONTEND_URL}/remotes"
}
```

After migration, `remotesBaseUrl` is removed. The `RuntimeConfigService` in
`platform-frontend` does not reference `remotesBaseUrl` — it is only consumed by `mfe-host`
to locate CFMDS. Removing it from the template is safe.

The resulting template:

```json
{
  "keycloak": {
    "baseUrl": "${KEYCLOAK_BROWSER_URL}",
    "realm": "${KEYCLOAK_REALM}",
    "clientId": "platform-frontend",
    "redirectUri": "${FRONTEND_URL}/auth/callback",
    "postLogoutRedirectUri": "${FRONTEND_URL}"
  },
  "identityServiceUrl": "${FRONTEND_URL}/api/v1/identity",
  "permissionServiceUrl": "${FRONTEND_URL}/api/v1/permissions",
  "auditServiceUrl": "${FRONTEND_URL}/api/v1/audit",
  "poiServiceUrl": "${FRONTEND_URL}/api/v1/poi",
  "personServiceUrl": "${FRONTEND_URL}/api/v1/poi"
}
```

### Docker Compose Service Definition for platform-frontend

`platform-frontend` needs a service definition in `platform-runtime` so it can be started as
a container (for the Nginx-proxied production workflow). The service definition mirrors the
decommissioned `mfe-host` service:

```yaml
# To be added to docker-compose.services.yml
platform-frontend:
  profiles: [ core, extended, full ]
  deploy:
    resources:
      limits:
        memory: 128M
      reservations:
        memory: 64M
  build:
    context: ${REPOS_ROOT:-..}/platform-frontend
    dockerfile: Dockerfile
  volumes:
    - ./config/frontend-config.json:/usr/share/nginx/html/config.json:ro
  networks:
    - trillian-net
  healthcheck:
    test: [ "CMD-SHELL", "wget -qO- http://127.0.0.1:80/ || exit 1" ]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 10s
```

This service definition is added to `docker-compose.services.yml` (not a new file), keeping
CI pipeline changes to a minimum. No new Docker Compose files are introduced.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions
of a system — essentially, a formal statement about what the system should do. Properties
serve as the bridge between human-readable specifications and machine-verifiable correctness
guarantees.*

**PBT Applicability Assessment:** This feature is primarily a deletion/simplification
exercise. Most acceptance criteria are file-existence checks, configuration checks, and
infrastructure verifications — none of which benefit from property-based testing. The one
area where PBT applies is route resolution: the Angular router must correctly resolve any
valid application route to the expected feature module. This is a pure function (route path →
component) with a meaningful input space.

### Property 1: Route resolution completeness

*For any* route path in the set of known application routes (`/snap`, `/audit-logs`,
`/intelligence/person`, `/intelligence/documents`, `/intelligence/workflows`, `/admin`,
`/admin/tasks`), the Angular router configured in `app.routes.ts` SHALL resolve the path to
a non-null activated route with the correct lazy-loaded module.

**Validates: Requirements 3.3, 10.2**

---

## Error Handling

### Build-time errors

If `@angular-architects/module-federation` or `@angular-builders/custom-webpack` are not
removed from `package.json`, the `ng build` command will still succeed (the packages are
present but unused). The `build-federation` architect target in `angular.json` must be
removed to prevent `ng run platform-frontend:build-federation` from being invocable.

### Runtime: missing `platform-frontend` container on `trillian-net`

If `platform-frontend` is not on `trillian-net`, Nginx will fail to resolve
`platform-frontend:80` and return 502. The service definition in `docker-compose.services.yml`
must include `networks: [trillian-net]`.

### Runtime: stale `config.json` with `remotesBaseUrl`

If `generate-frontend-config.sh` is run before `frontend-config.template.json` is updated,
the generated `config.json` will still contain `remotesBaseUrl`. This is harmless (the
Angular app ignores unknown keys), but the template should be updated to keep the config
clean.

### Runtime: `kc_cfmds_service_secret` secret file

The file `platform-runtime/secrets/kc_cfmds_service_secret` exists on disk (it was generated
by `init-secrets.sh`). After removing the entry from `init-secrets.sh`, the file will not be
regenerated on the next `make init-secrets` run. The existing file on disk is harmless but
can be deleted manually as part of cleanup.

### Nginx: CFMDS CSP header reference

The `Content-Security-Policy` header in `nginx.conf` currently includes
`https://cfmds.trillian-net` in `script-src` and `connect-src`. This reference must be
removed when the CFMDS location blocks are removed, otherwise the CSP header references a
non-existent service.

---

## Testing Strategy

This feature is a deletion/simplification exercise. The testing strategy focuses on
verifying that the correct files are absent, the correct files are present and unmodified,
and the application continues to function correctly after the migration.

### Unit Tests

**Files to delete (their tests are also deleted):**
- `src/app/routing/bootstrap-mount.spec.ts` — tests `deriveBasePath` and `resolveAngularRoute` from deleted files
- `src/app/routing/federated-navigation.service.spec.ts` — tests deleted service
- `src/app/routing/federated-route-config.spec.ts` — tests deleted function
- `src/app/routing/federated-route-map.spec.ts` — tests deleted module
- `src/app/services/execution-mode.service.spec.ts` — tests deleted service
- `src/app/shell/shell-context-bridge.service.spec.ts` — tests deleted service

**Tests to update:**
- `src/app/shell/theme.service.spec.ts` — the `describe('setFromHost (federated mode)')` block
  tests the `setFromHost()` method which is being removed. This describe block is deleted.
  The `describe('standalone mode preservation')` block and all other tests remain.
- `src/app/shell/shell.ts` — no spec file exists for `ShellComponent`, but if one is created
  it should not reference `ExecutionModeService`.

**Tests to preserve (no changes):**
- All feature module specs (`snap`, `audit`, `person`, `documents`, `workflows`, `iam`, `tasks`)
- `src/app/auth/` specs (auth.guard, auth.interceptor, auth.service, etc.)
- `src/app/shared/` specs
- `src/app/shell/theme.service.spec.ts` (minus the federated mode describe block)

### Property-Based Tests

The project uses **Vitest** with **fast-check** (already in `devDependencies`).

**Property 1: Route resolution completeness**

```typescript
// src/app/app.routes.spec.ts (new file)
// Feature: mfe-removal, Property 1: Route resolution completeness
import fc from 'fast-check';
import { routes } from './app.routes';

describe('app.routes — route resolution completeness', () => {
  it('should resolve all known application routes to a non-null route config', () => {
    const knownRoutes = [
      '/snap',
      '/audit-logs',
      '/intelligence/person',
      '/intelligence/documents',
      '/intelligence/workflows',
      '/admin',
      '/admin/tasks',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...knownRoutes), (path) => {
        // The route tree must contain a matching route for every known path
        const segments = path.split('/').filter(Boolean);
        const topLevel = segments[0];
        const shellRoute = routes.find((r) => r.component !== undefined && r.children);
        expect(shellRoute).toBeDefined();
        const childRoutes = shellRoute!.children ?? [];
        const matchingChild = childRoutes.find(
          (r) => r.path === topLevel || r.path === segments.slice(0, 2).join('/'),
        );
        expect(matchingChild).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});
```

### Integration / Smoke Tests

The existing `e2e/test_login_flow.py` covers the end-to-end authentication flow and should
continue to pass after migration. No new e2e tests are required.

Manual smoke test checklist (to be run after migration):
1. `pnpm build` completes without errors and produces `dist/platform-frontend/browser/index.html`
2. No `remoteEntry.js` in `dist/platform-frontend/browser/`
3. `pnpm start` starts the dev server and the app loads at `http://localhost:4200`
4. Authentication flow completes (Keycloak redirect → callback → authenticated state)
5. All feature routes render correctly (`/snap`, `/audit-logs`, `/intelligence/person`, etc.)
6. `make up` starts the stack without errors (no MFE-related build steps)
7. Nginx serves `platform-frontend` at `https://localhost/`
