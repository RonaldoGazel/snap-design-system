# Bugfix Requirements Document

## Introduction

When running `platform-frontend` in standalone mode (`pnpm start` on port 4200), authentication fails with an OIDC issuer mismatch error. The frontend's OIDC discovery service expects the issuer to be `http://localhost:8180/realms/platform` (matching `environment.ts`), but Keycloak returns `https://localhost/auth/realms/platform` because its `--hostname` flag is set from `KEYCLOAK_EXTERNAL_URL=https://localhost/auth` in `platform-runtime/.env`.

The root cause is a divergence between the `.env` file (configured for Nginx-proxied mode) and the frontend's built-in environment defaults (configured for standalone/direct-access mode). The fix involves adding clearly documented standalone-friendly alternatives in `.env.example` and documenting the workflow for switching between modes.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `platform-runtime/.env` has `KEYCLOAK_EXTERNAL_URL=https://localhost/auth` AND the frontend is started standalone on port 4200 with `environment.ts` pointing to `http://localhost:8180` THEN the system fails OIDC discovery with error `Issuer mismatch: expected http://localhost:8180/realms/platform, got https://localhost/auth/realms/platform`

1.2 WHEN `platform-runtime/.env` has `FRONTEND_URL=https://localhost` AND Keycloak imports the realm template THEN the `platform-frontend` client's `redirectUris` and `webOrigins` are set to `https://localhost/*` which does not match the standalone frontend origin `http://localhost:4200`, causing redirect failures after authentication

1.3 WHEN a developer clones the repository and copies `.env.example` to `.env` THEN the `.env.example` has standalone-friendly values but lacks documentation explaining the two modes (standalone vs Nginx-proxied), leaving developers unaware of the configuration relationship between `.env` values and frontend behavior

1.4 WHEN a developer needs to switch between standalone mode and Nginx-proxied mode THEN there is no documented procedure or clearly marked configuration sections in `.env.example` explaining which values to use for each mode

### Expected Behavior (Correct)

2.1 WHEN `platform-runtime/.env` has `KEYCLOAK_EXTERNAL_URL=http://localhost:8180` (standalone mode) AND the frontend is started standalone on port 4200 THEN the system SHALL complete OIDC discovery successfully because Keycloak's issuer (`http://localhost:8180/realms/platform`) matches the frontend's expected issuer (`http://localhost:8180/realms/platform`)

2.2 WHEN `platform-runtime/.env` has `FRONTEND_URL=http://localhost:4200` (standalone mode) AND Keycloak imports the realm template THEN the `platform-frontend` client's `redirectUris` and `webOrigins` SHALL be set to `http://localhost:4200/*`, matching the standalone frontend origin and allowing successful OAuth redirects

2.3 WHEN a developer reads `.env.example` THEN the file SHALL contain clearly documented sections showing both standalone-friendly values and Nginx-proxied values with comments explaining when to use each set, including the relationship between these values and frontend authentication

2.4 WHEN a developer needs to switch between standalone mode and Nginx-proxied mode THEN they SHALL be able to do so by commenting/uncommenting clearly labeled value pairs in `.env`, following inline documentation that explains the switch procedure

### Unchanged Behavior (Regression Prevention)

3.1 WHEN `platform-runtime/.env` has `KEYCLOAK_EXTERNAL_URL=https://localhost/auth` AND `FRONTEND_URL=https://localhost` AND the full stack is running behind Nginx THEN the system SHALL CONTINUE TO authenticate successfully through the Nginx reverse proxy with matching issuer URLs

3.2 WHEN `platform-frontend` is running in standalone mode AND `/config.json` returns 404 THEN the system SHALL CONTINUE TO fall back to `environment.ts` defaults without error, using the built-in `keycloak.baseUrl` value for OIDC discovery

3.3 WHEN the OIDC discovery service receives a response where the issuer matches the expected value (`{baseUrl}/realms/{realm}`) THEN the system SHALL CONTINUE TO validate and accept the discovery response, regardless of whether the URL scheme is HTTP or HTTPS

3.4 WHEN inter-service communication uses internal Docker network URLs (e.g., `http://keycloak:8080`) THEN the system SHALL CONTINUE TO route correctly because `KEYCLOAK_URL` (internal) is separate from `KEYCLOAK_EXTERNAL_URL` (browser-facing) and remains unchanged

3.5 WHEN `platform-runtime/.env.example` is copied to `.env` without modification THEN the system SHALL CONTINUE TO work in standalone mode by default (the existing standalone-friendly defaults are preserved as the active values)
