---
spec_id: ARCH-009
title: Frontend Architecture — Angular SPA
version: "2.0"
status: accepted
owner: platform-architecture
spec_type: architecture
tags:
  - architecture
  - frontend
  - angular
  - primeng
  - spa
  - platform-frontend
supersedes:
  - ARCH-009 v1.0 (mfe-architecture.md — Micro-Frontend Architecture)
  - ARCH-010 v1.0 (mfe-topology.md — MFE Topology)
  - ARCH-012 v1.0 (mfe-infrastructure-evolution.md — MFE Infrastructure Evolution)
last_updated: 2026-05-06
---

# Frontend Architecture — Angular SPA

## Purpose

This specification defines the frontend architecture for the SNAP platform after the removal
of the Micro-Frontend (MFE) architecture in May 2026 (see [ADR-006]). `platform-frontend` is
the sole frontend application: a standard Angular 21 SPA that authenticates users directly
via Keycloak OIDC, renders all application features, and is served behind the Nginx reverse
proxy.

All frontend development must conform to the rules defined here.

## Cross-References

| Spec                           | Relationship                                                              |
| ------------------------------ | ------------------------------------------------------------------------- |
| [ARCH-001] System Architecture | Platform infrastructure, `trillian-net` overlay network, deployment model |
| [ARCH-004] Observability       | Structured logging, health checks                                         |
| [ARCH-006] Infrastructure Config | Docker Swarm secrets, environment variables                             |
| [ARCH-007] CI/CD Standards     | Azure DevOps pipelines                                                    |
| [ARCH-011] Deployment Contract | Bootstrap sequence, frontend runtime config flow                          |
| [SEC-001] Authentication       | Keycloak OIDC, JWT token lifecycle                                        |
| [SEC-002] Authorization        | RBAC, GBAC, OLAC via permission-service                                   |
| [DS-001] PrimeNG Design System | Component library, Apolo theme preset, design tokens                      |
| [DS-002] SMACSS CSS Architecture | CSS naming conventions                                                  |
| [ADR-006] MFE Removal          | Architectural decision record for the MFE decommission                    |
| [STD-005] Frontend Developer Experience | Developer workflow standard                                      |

## Architectural Principles

1. `platform-frontend` is the sole frontend — there is no shell orchestrator, no federation
   host, and no remote module distribution server.
2. Authentication is owned by `platform-frontend` via Keycloak OIDC (PKCE flow). No other
   service manages the browser auth session.
3. All application features (POI intelligence, documents, audit logs, SNAP, IAM, tasks,
   workflows) are lazy-loaded Angular feature modules within a single SPA.
4. The application is served as a static nginx container behind the platform Nginx reverse
   proxy. There is no intermediate shell container.
5. Runtime configuration is injected via `config.json` mounted at container startup — the
   same Docker image works in any environment without rebuilding.
6. PrimeNG (with the Apolo preset) is the sole UI component library. No other component
   framework is introduced.

## System Topology

### Network Flow

```
Browser (HTTPS) → Nginx (shared-infra, :443)
  ├── /                    → platform-frontend:80  (Angular SPA)
  ├── /auth/callback       → platform-frontend:80  (OIDC callback route)
  ├── /auth/session-expired→ platform-frontend:80  (session expiry route)
  ├── /auth/error          → platform-frontend:80  (auth error route)
  ├── /auth/realms/        → keycloak:8080          (OIDC endpoints only)
  ├── /api/v1/identity/    → identity-service:8000
  ├── /api/v1/permissions/ → permission-service:8000
  ├── /api/v1/audit/       → audit-service:8000
  ├── /api/v1/poi/         → poi-service:8002
  ├── /api/v1/documents/   → document-service:8000
  ├── /api/v1/workflows/   → workflow-service:8000
  └── /config.json         → served directly by nginx
```

### Container Topology

```
┌─────────────────────────────────────────────────────────────────┐
│  platform-frontend (node:24-alpine → nginx:1.27-alpine)         │
│                                                                  │
│  ├── Angular 21 SPA                                             │
│  │   ├── bootstrapApplication(App, appConfig)                   │
│  │   ├── AuthService (Keycloak OIDC, PKCE)                      │
│  │   ├── StandaloneTokenProvider (sole TOKEN_PROVIDER)          │
│  │   ├── ShellComponent (sidebar, header, breadcrumb, user menu)│
│  │   └── Feature modules (lazy-loaded)                          │
│  │       ├── /snap              → SnapModule                    │
│  │       ├── /audit-logs        → AuditModule                   │
│  │       ├── /intelligence/person → PersonModule                │
│  │       ├── /intelligence/documents → DocumentsModule          │
│  │       ├── /intelligence/workflows → WorkflowsModule          │
│  │       ├── /admin             → IamModule                     │
│  │       └── /admin/tasks       → TasksModule                   │
│  │                                                               │
│  └── nginx:1.27-alpine                                          │
│      ├── Serves /usr/share/nginx/html (Angular build output)    │
│      ├── SPA fallback: all non-asset paths → index.html         │
│      └── /config.json mounted from platform-runtime at startup  │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Technology              | Version    | Purpose                                              |
| ----------------------- | ---------- | ---------------------------------------------------- |
| **Angular**             | `^21.x`    | Application framework                                |
| **TypeScript**          | `~5.9`     | Type-safe language                                   |
| **PrimeNG**             | `^21.x`    | UI component library (Apolo preset)                  |
| **@primeuix/themes**    | `^2.x`     | PrimeNG theme presets and design tokens              |
| **@ngx-translate/core** | `^17.x`    | Runtime i18n with JSON translation files             |
| **RxJS**                | `^7.x`     | Reactive state and async stream management           |
| **Vitest**              | `^4.x`     | Unit and property-based testing                      |
| **fast-check**          | `^4.x`     | Property-based test generation                       |
| **pnpm**                | `^10.33.0` | Package manager                                      |
| **Node.js**             | `24.x LTS` | Build runtime                                        |
| **nginx**               | `1.27-alpine` | Production static file server                     |

## Application Structure

```
src/
├── main.ts                          # Sole entry point — bootstrapApplication()
├── index.html                       # SPA root document
├── styles.scss                      # Global styles (PrimeNG theme, fonts)
├── app/
│   ├── app.ts                       # Root component
│   ├── app.config.ts                # ApplicationConfig (providers)
│   ├── app.routes.ts                # Route tree (single source of truth)
│   ├── app.routes.spec.ts           # Property-based route completeness test
│   ├── auth/
│   │   ├── guards/                  # AuthGuard, role guards, security level guard
│   │   ├── interceptors/            # AuthInterceptor (token injection, 401 handling)
│   │   ├── services/                # AuthService, StandaloneTokenProvider, OIDC
│   │   └── auth.routes.ts           # Auth route definitions
│   ├── features/
│   │   ├── snap/                    # SNAP graph integration
│   │   ├── audit/                   # Audit log viewer
│   │   ├── person/                  # POI / Person intelligence
│   │   ├── documents/               # Document management
│   │   ├── workflows/               # Workflow management
│   │   ├── iam/                     # IAM administration
│   │   └── tasks/                   # Tasks
│   ├── services/
│   │   ├── runtime-config.service.ts # Loads /config.json at startup
│   │   └── api-error.service.ts     # Centralized API error handling
│   ├── shared/                      # Shared utilities and components
│   └── shell/
│       ├── shell.ts / shell.html    # Application chrome (sidebar, header, breadcrumb)
│       ├── theme.service.ts         # Light/dark mode (localStorage + OS preference)
│       ├── header/
│       ├── sidebar/
│       ├── breadcrumb/
│       └── user-menu/
├── locales/                         # i18n translation files (en, pt-BR)
└── environments/
    └── environment.ts               # Default environment config (dev fallbacks)
```

## Bootstrap and Configuration

### Bootstrap Path

There is a single entry point. `main.ts` calls `bootstrapApplication(App, appConfig)` directly.
There is no conditional mode detection, no federation lifecycle, and no remote entry point.

```typescript
// src/main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

### Runtime Configuration

`RuntimeConfigService` loads `/config.json` at application startup via `APP_INITIALIZER`.
This file is mounted by `platform-runtime` at container startup from
`config/frontend-config.json`, which is generated from `config/frontend-config.template.json`
by `scripts/generate-frontend-config.sh`.

The config provides:
- Keycloak coordinates (`baseUrl`, `realm`, `clientId`, `redirectUri`)
- Backend service URLs (`identityServiceUrl`, `permissionServiceUrl`, etc.)

If `/config.json` is not found (e.g., local `pnpm start` without the Docker stack), the
service falls back to `environment.ts` defaults.

### Authentication

`AuthService` owns the Keycloak OIDC session:
- PKCE authorization code flow
- Token refresh with idle timeout detection
- `StandaloneTokenProvider` is the sole `TOKEN_PROVIDER` implementation
- `AuthInterceptor` attaches `Bearer` tokens to all trusted API requests and handles 401
  responses with token refresh + idempotent request replay

## Routing

`app.routes.ts` is the single route configuration. All routes are lazy-loaded:

```
/                         → redirect to /intelligence/person
/auth/*                   → auth routes (callback, session-expired, error)
/ (ShellComponent, AuthGuard)
  ├── /snap               → SnapModule
  ├── /audit-logs         → AuditModule
  ├── /intelligence/person → PersonModule
  ├── /intelligence/documents → DocumentsModule
  ├── /intelligence/workflows → WorkflowsModule
  ├── /admin              → IamModule
  └── /admin/tasks        → TasksModule
```

`AuthGuard` protects the shell route. Unauthenticated users are redirected to Keycloak login.

## Build and Deployment

### Build

```bash
pnpm build    # ng build → dist/platform-frontend/browser/
```

Uses `@angular/build:application` (esbuild-based). No webpack customization.
Output: `dist/platform-frontend/browser/index.html` + hashed JS/CSS chunks.

### Docker Image

Multi-stage build:
1. `node:24-alpine` — installs dependencies, runs `pnpm build`
2. `nginx:1.27-alpine` — serves the build output

The image is built by `platform-runtime` using the `Dockerfile` in the `platform-frontend`
repository root. The `config.json` is NOT baked into the image — it is mounted at runtime:

```yaml
# docker-compose.services.yml
platform-frontend:
  build:
    context: ${REPOS_ROOT:-..}/platform-frontend
    dockerfile: Dockerfile
  volumes:
    - ./config/frontend-config.json:/usr/share/nginx/html/config.json:ro
  networks:
    - trillian-net
```

### CI/CD Pipeline

The Azure Pipelines definition (`azure-pipelines.yml`) runs on every PR and branch push:
1. Install Node.js and pnpm via corepack
2. `pnpm install --frozen-lockfile`
3. `pnpm build` — validates the production build
4. `pnpm test -- --run` — runs all Vitest unit and property-based tests

## Testing

### Unit Tests

Vitest with jsdom environment. Run with `pnpm test -- --run`.

Key test files:
- `src/app/app.routes.spec.ts` — property-based test verifying all known routes resolve
  correctly (fast-check, 100 runs). Validates Requirements 3.3 and 10.2 of the MFE removal spec.
- `src/app/shell/theme.service.spec.ts` — ThemeService standalone behavior
- `src/app/auth/services/auth.service.spec.ts` — AuthService OIDC flow

### Property-Based Testing

The project uses **fast-check** for property-based tests. The route completeness property
asserts that for any path in the set of known application routes, the Angular router
configured in `app.routes.ts` resolves it to a non-null route config.

## Content Security Policy

The Nginx CSP header covers all legitimate sources for the standalone SPA:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' ws: wss: https://api-gateway.trillian-net https://keycloak.trillian-net;
frame-src 'self';
object-src 'none';
base-uri 'self';
```

CFMDS (`https://cfmds.trillian-net`) has been removed from `script-src` and `connect-src`
as CFMDS is decommissioned. Any CSP changes require security review per [SEC-003].

## Decommissioned Components

The following components were removed as part of the MFE decommission (May 2026, [ADR-005]):

| Component                       | Repository          | Disposition                                    |
| ------------------------------- | ------------------- | ---------------------------------------------- |
| `mfe-host`                      | `mfe-host`          | Decommissioned — no longer built or deployed   |
| `cfmds` (CFMDS)                 | `mfe-cfmds`         | Decommissioned — no longer built or deployed   |
| `minio-cfmds`                   | `platform-runtime`  | Decommissioned — removed from compose stack    |
| `eco-snap-components-library`   | `eco-snap-*`        | Decommissioned as a federation remote          |
| `graph-visualization`           | `graph-visualization` | Decommissioned as a federation remote        |
| `docker-compose.mfes.yml`       | `platform-runtime`  | Deleted                                        |
| `Dockerfile.federation`         | `platform-frontend` | Deleted                                        |
| `webpack.config.ts`             | `platform-frontend` | Deleted                                        |
| `src/bootstrap.ts`              | `platform-frontend` | Deleted                                        |
| `src/app/routing/`              | `platform-frontend` | Directory deleted (all federation-only files)  |
| `ExecutionModeService`          | `platform-frontend` | Deleted                                        |
| `ShellContextBridge`            | `platform-frontend` | Deleted                                        |
| `FederatedTokenProvider`        | `platform-frontend` | Deleted                                        |

## Prohibited Patterns

| Anti-Pattern                                    | Description                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| Module Federation configuration                 | `platform-frontend` builds as a standard Angular SPA — no webpack MF    |
| Dual entry points                               | There is one entry point: `main.ts`. No `bootstrap.ts` or remote entry   |
| Execution mode branching                        | No `isFederated()` / `isStandalone()` checks — there is only one mode   |
| Shell context bridge                            | No `ShellContextBridge` — auth and config are owned by the app itself    |
| Federated token provider                        | `StandaloneTokenProvider` is the sole `TOKEN_PROVIDER`                   |
| Per-remote Docker services                      | All frontend is served by a single `platform-frontend` container         |
| Hardcoded API URLs                              | All API access goes through the Nginx reverse proxy                      |
| Hardcoded design tokens                         | Use PrimeNG Apolo preset tokens (`--p-*`) and SCSS variables             |
| `remoteEntry.js` artifacts                      | The build produces no federation artifacts                               |
