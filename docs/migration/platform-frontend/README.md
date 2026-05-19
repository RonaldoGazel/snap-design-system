# Platform Frontend

Angular 21 application that delivers the core business UI for the SNAP Apolo platform. It runs as a **standalone** Angular SPA with its own shell, authentication, and routing. All domain features — POI intelligence, document management, audit logs, SNAP graph, and IAM administration — live here.

## What This Project Delivers

- **Business feature modules** — Person/POI intelligence, document management, audit log viewer, SNAP graph integration, and IAM administration, all lazy-loaded via Angular router.
- **Standalone execution** — Runs with its own Keycloak OIDC auth flow (PKCE, token refresh, idle timeout).
- **Shell component** — `ShellComponent` provides the application chrome (sidebar, header, breadcrumb, user menu).
- **Runtime configuration** — Loads `config.json` at startup to resolve Keycloak coordinates and backend service URLs.

## Architecture Overview

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
│  └── /api/v1/*            → backend microservices              │
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

## Project Structure

```
src/
├── main.ts                              # Application entry point
├── index.html                           # SPA root document
├── styles.scss                          # Global styles (PrimeNG theme, fonts)
├── app/
│   ├── app.ts                           # Root component
│   ├── app.config.ts                    # ApplicationConfig (providers)
│   ├── app.routes.ts                    # Route tree
│   ├── app.routes.spec.ts               # Property-based route completeness test
│   ├── app.html / app.scss              # Root template and styles
│   ├── auth/
│   │   ├── components/                  # Auth UI components
│   │   ├── guards/                      # AuthGuard, role guards
│   │   ├── integration/                 # Keycloak integration layer
│   │   ├── interceptors/                # AuthInterceptor (token injection)
│   │   ├── models/                      # Auth data models
│   │   ├── pages/                       # Login, callback, logout pages
│   │   ├── services/                    # TokenProvider, CredentialStrategy, OIDC
│   │   ├── utils/                       # Auth utilities
│   │   └── auth.routes.ts              # Auth route definitions
│   ├── features/
│   │   ├── person/                      # POI / Person intelligence module
│   │   ├── documents/                   # Document management module
│   │   ├── audit/                       # Audit log viewer module
│   │   ├── snap/                        # SNAP graph integration module
│   │   ├── iam/                         # IAM administration module
│   │   ├── tasks/                       # Tasks module
│   │   └── workflows/                   # Workflows module
│   ├── services/
│   │   ├── runtime-config.service.ts    # Loads /config.json (runtime overrides)
│   │   ├── api-error.service.ts         # Centralized API error handling
│   │   └── multi-file-translate-loader.ts # i18n loader for multiple JSON files
│   ├── shared/
│   │   └── utils/                       # Shared utility functions
│   ├── shell/
│   │   ├── shell.ts / shell.html        # Shell component
│   │   ├── theme.service.ts             # Light/dark mode management
│   │   ├── header/                      # Header component
│   │   ├── sidebar/                     # Sidebar navigation component
│   │   ├── breadcrumb/                  # Breadcrumb component
│   │   └── user-menu/                   # User menu component
│   ├── themes/
│   │   ├── apolo-preset.ts             # PrimeNG Apolo theme preset
│   │   └── inteligencia-preset.ts      # PrimeNG Inteligência theme preset
│   └── environments/
│       └── environment.ts               # Default environment config
├── locales/                             # i18n translation files (en, pt-BR)
└── styles/                              # Global SCSS partials

e2e/                                     # End-to-end test specs
└── test_login_flow.py                   # Standalone auth flow test
```

## Tech Stack

| Tool           | Version     | Purpose                                               |
| -------------- | ----------- | ----------------------------------------------------- |
| Angular        | 21.x        | Application framework                                 |
| TypeScript     | 5.9.x       | Type safety                                           |
| PrimeNG        | 21.x        | UI component library                                  |
| @ngx-translate | 17.x        | i18n (multi-file JSON loader)                         |
| RxJS           | 7.8.x       | Reactive programming                                  |
| Vitest         | 4.1.x       | Unit + property-based testing                         |
| fast-check     | 4.x         | Property-based test generation                        |
| Nginx          | 1.27-alpine | Production static file server                         |
| SCSS           | —           | Styling (PrimeNG theme presets)                       |

## Running the Project

### Option A: Standalone Dev Mode (for feature development)

Use this when working on business features. Requires the infrastructure stack for Keycloak authentication and backend APIs.

**Prerequisites**: Infrastructure stack running via platform-runtime.

```bash
# Start infrastructure (from platform-runtime/)
make up-dev

# Install dependencies
pnpm install

# Start Angular dev server
pnpm start
```

The application is available at `http://localhost:4200`.

### Option B: Full Docker Stack (via platform-runtime)

Use this to run the complete stack where platform-frontend is served behind Nginx.

```bash
cd platform-runtime/
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# Full pipeline: infra → services → platform-frontend container
make up
```

Access the platform at `https://localhost`.

## Scripts

```bash
pnpm start    # Angular dev server (standalone mode, port 4200)
pnpm build    # Production build → dist/platform-frontend/
pnpm test     # Run tests (ng test)
```

## Testing

- **Unit + property-based tests**: Vitest with jsdom environment.
- **Route completeness**: `src/app/app.routes.spec.ts` — property-based test verifying all known routes resolve correctly.
- **E2E**: `e2e/test_login_flow.py` — standalone auth flow test.

```bash
# Run all Vitest tests
npx vitest --run
```

## Auth Flow

1. **`environment.ts`** — Provides default Keycloak config (`baseUrl`, `realm`, `clientId`, `redirectUri`)
2. **`RuntimeConfigService`** — Attempts to load `/config.json` for runtime overrides; falls back to `environment.ts` on 404
3. **`OidcDiscoveryService`** — Fetches `.well-known/openid-configuration`, validates issuer
4. **Keycloak** — OAuth2 authorization code flow (PKCE), token issuance, session management
5. **`AuthInterceptor`** — Injects bearer token into outgoing API requests

## Documentation

| Document | Description |
|---|---|
| [Post-Refresh Redirect Fix](docs/post-refresh-redirect-fix.md) | Why F5 used to redirect to `/intelligence/person/dashboard` and how it was fixed (auth `returnUrl` persistence, `OrgContextGuard` initialization race, `ActiveOrgService.ensureInitialized()`) |

## Troubleshooting

### Issuer mismatch

**Error**: `Issuer mismatch: expected http://localhost:8180/realms/platform, got https://localhost/auth/realms/platform`

**Cause**: `KEYCLOAK_EXTERNAL_URL` in `.env` is set to `https://localhost/auth` (nginx-proxied mode) instead of `http://localhost:8180` (standalone mode).

**Fix**: Set `KEYCLOAK_EXTERNAL_URL=http://localhost:8180` in `platform-runtime/.env`.

### Redirect URI rejection

**Error**: Keycloak returns "Invalid redirect_uri" after login

**Cause**: `FRONTEND_URL` in `.env` doesn't match the access mode. The Keycloak realm template uses `FRONTEND_URL` for `redirectUris`.

**Fix**: Set `FRONTEND_URL=http://localhost:4200` for standalone, or `https://localhost` for nginx-proxied.

### CORS errors on token endpoint

**Cause**: `FRONTEND_URL` mismatch — `webOrigins` in the Keycloak client is derived from `FRONTEND_URL`.

**Fix**: Align `FRONTEND_URL` with the actual browser origin.

### Realm import caveat

Keycloak imports `platform-realm.json.template` on **first startup only**. If you switch modes after the realm was imported, delete the Keycloak volume:

```bash
cd platform-runtime/
docker compose down -v
docker compose -f docker-compose.infra.yml --profile core up -d
```

## Mode Switching

Edit `platform-runtime/.env` to switch between standalone dev and nginx-proxied modes:

```env
# Standalone mode (default for local development)
KEYCLOAK_EXTERNAL_URL=http://localhost:8180
FRONTEND_URL=http://localhost:4200
API_GATEWAY_URL=http://localhost:8080

# Nginx-proxied mode (full stack behind reverse proxy)
# KEYCLOAK_EXTERNAL_URL=https://localhost/auth
# FRONTEND_URL=https://localhost
# API_GATEWAY_URL=https://localhost/api
```
