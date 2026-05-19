# Standalone Auth Fix — Bugfix Design

## Overview

The frontend's OIDC authentication fails in standalone mode because `platform-runtime/.env` ships with Nginx-proxied values (`KEYCLOAK_EXTERNAL_URL=https://localhost/auth`, `FRONTEND_URL=https://localhost`) while `platform-frontend/src/environments/environment.ts` expects direct Keycloak access at `http://localhost:8180`. The fix is purely documentation and configuration: add clearly documented standalone vs Nginx-proxied sections in `.env.example` with comment/uncomment instructions, and create a standalone development guide in `platform-frontend/README.md`.

No application code changes are required — the frontend code, auth services, and infrastructure templates are all correct. The bug is a configuration documentation gap.

## Glossary

- **Bug_Condition (C)**: The `.env` file contains Nginx-proxied values (`KEYCLOAK_EXTERNAL_URL=https://localhost/auth`, `FRONTEND_URL=https://localhost`) while the frontend runs standalone on port 4200 with `environment.ts` pointing to `http://localhost:8180`
- **Property (P)**: When `.env` has standalone-friendly values (`KEYCLOAK_EXTERNAL_URL=http://localhost:8180`, `FRONTEND_URL=http://localhost:4200`), OIDC discovery succeeds and OAuth redirects work
- **Preservation**: Nginx-proxied mode must continue to work when the Nginx-proxied values are active; existing code behavior (config.json fallback, issuer validation, internal Docker URLs) must remain unchanged
- **KEYCLOAK_EXTERNAL_URL**: The browser-facing URL for Keycloak; sets Keycloak's `--hostname` flag which determines the issuer in OIDC discovery responses
- **FRONTEND_URL**: Used in the Keycloak realm template to set `redirectUris` and `webOrigins` for the `platform-frontend` client
- **KEYCLOAK_URL**: Internal Docker network URL (`http://keycloak:8080`) for inter-service communication — unaffected by this fix
- **Realm import**: Keycloak imports `platform-realm.json.template` on first startup only; changing `.env` after import requires volume deletion or manual Keycloak admin update

## Bug Details

### Bug Condition

The bug manifests when a developer runs `platform-frontend` standalone (`pnpm start` on port 4200) while `platform-runtime/.env` has Nginx-proxied values. The `OidcDiscoveryService` expects the issuer to be `http://localhost:8180/realms/platform` (from `environment.ts`), but Keycloak returns `https://localhost/auth/realms/platform` because its `--hostname` flag is set from `KEYCLOAK_EXTERNAL_URL=https://localhost/auth`.

**Formal Specification:**

```
FUNCTION isBugCondition(envConfig, frontendConfig)
  INPUT: envConfig of type EnvironmentFile, frontendConfig of type EnvironmentTS
  OUTPUT: boolean

  RETURN envConfig.KEYCLOAK_EXTERNAL_URL != frontendConfig.keycloak.baseUrl
         AND frontendMode == 'standalone' (port 4200, no Nginx proxy)
         AND (
           issuerMismatch(envConfig.KEYCLOAK_EXTERNAL_URL, frontendConfig.keycloak.baseUrl)
           OR redirectUriMismatch(envConfig.FRONTEND_URL, frontendConfig.keycloak.redirectUri)
         )
END FUNCTION
```

### Examples

- **Issuer mismatch**: `.env` has `KEYCLOAK_EXTERNAL_URL=https://localhost/auth` → Keycloak returns issuer `https://localhost/auth/realms/platform` → frontend expects `http://localhost:8180/realms/platform` → `AuthError('discovery_failed', 'Issuer mismatch: expected http://localhost:8180/realms/platform, got https://localhost/auth/realms/platform')`
- **Redirect URI rejection**: `.env` has `FRONTEND_URL=https://localhost` → Keycloak client has `redirectUris: ["https://localhost/*"]` → frontend redirects from `http://localhost:4200/auth/callback` → Keycloak rejects with "Invalid redirect_uri"
- **Web origin rejection**: Same `FRONTEND_URL` mismatch → `webOrigins: ["https://localhost"]` doesn't include `http://localhost:4200` → CORS errors on token endpoint calls
- **Correct standalone**: `.env` has `KEYCLOAK_EXTERNAL_URL=http://localhost:8180` and `FRONTEND_URL=http://localhost:4200` → issuer matches, redirects work, authentication succeeds

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Nginx-proxied mode (`KEYCLOAK_EXTERNAL_URL=https://localhost/auth`, `FRONTEND_URL=https://localhost`) must continue to work when the full stack runs behind Nginx
- `RuntimeConfigService` config.json fallback behavior must remain unchanged (no code modifications)
- `OidcDiscoveryService` issuer validation logic must remain unchanged (no code modifications)
- Internal Docker network URLs (`KEYCLOAK_URL=http://keycloak:8080`) must remain unchanged
- Inter-service communication via Docker network must remain unaffected
- The `.env.example` active (uncommented) defaults must remain standalone-friendly

**Scope:**
This fix modifies only documentation and configuration example files. No application code, Docker Compose files, or infrastructure templates are changed. All existing runtime behavior is preserved.

## Hypothesized Root Cause

Based on the bug analysis, the root cause is a **documentation and configuration gap**:

1. **Missing mode documentation in `.env.example`**: The file has standalone-friendly defaults but no explanation of the two modes (standalone vs Nginx-proxied) or how to switch between them. A developer who copies `.env.example` gets standalone values, but a developer working with an existing `.env` (or one shared by a team) may have Nginx-proxied values without understanding the implications.

2. **No standalone development guide**: `platform-frontend/README.md` is Angular CLI boilerplate with no project-specific instructions. Developers don't know that:
   - The infrastructure stack must be running first
   - `.env` values directly affect Keycloak's issuer URL
   - Keycloak realm import is a one-time operation (changing `.env` after import requires volume deletion)
   - `environment.ts` already has correct standalone defaults

3. **Divergence between `.env` and `.env.example`**: The actual `.env` has Nginx-proxied values while `.env.example` has standalone values, suggesting someone manually changed the `.env` for Nginx mode without a documented procedure for switching back.

## Correctness Properties

Property 1: Bug Condition - Standalone .env values enable successful OIDC authentication

_For any_ `.env` configuration where `KEYCLOAK_EXTERNAL_URL` equals the frontend's `environment.ts` `keycloak.baseUrl` value (`http://localhost:8180`) AND `FRONTEND_URL` equals the frontend's origin (`http://localhost:4200`), the system SHALL complete OIDC discovery successfully with matching issuer URLs and OAuth redirects SHALL succeed because `redirectUris` and `webOrigins` match the frontend origin.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Nginx-proxied mode configuration remains available and functional

_For any_ `.env` configuration where `KEYCLOAK_EXTERNAL_URL=https://localhost/auth` AND `FRONTEND_URL=https://localhost` AND the full stack runs behind Nginx, the system SHALL authenticate successfully through the Nginx reverse proxy, preserving the existing Nginx-proxied workflow. The `.env.example` SHALL contain these values (commented) so developers can switch to this mode.

**Validates: Requirements 3.1, 3.5**

Property 3: Preservation - No application code changes

_For any_ file in `platform-frontend/src/`, `shared-infra/config/`, or `platform-runtime/docker-compose*.yml`, the fix SHALL NOT modify the file content, preserving all existing runtime behavior including config.json fallback, issuer validation, internal Docker URLs, and inter-service communication.

**Validates: Requirements 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `platform-runtime/.env.example`

**Changes**:

1. **Add mode documentation header**: Add a section explaining the two modes (standalone vs Nginx-proxied) at the top of the Keycloak section
2. **Add comment/uncomment pattern**: Show both sets of values with clear labels indicating which to use for each mode
3. **Keep standalone values as active defaults**: The uncommented values remain `KEYCLOAK_EXTERNAL_URL=http://localhost:8180` and `FRONTEND_URL=http://localhost:4200`
4. **Add Nginx-proxied values as comments**: Include `# KEYCLOAK_EXTERNAL_URL=https://localhost/auth` and `# FRONTEND_URL=https://localhost` with instructions
5. **Document the realm import caveat**: Add a note explaining that Keycloak imports the realm on first startup only, and switching modes after import requires volume deletion

**File**: `platform-frontend/README.md`

**Changes**:

1. **Replace Angular CLI boilerplate** with project-specific standalone development guide
2. **Document prerequisites**: Infrastructure stack must be running (`docker compose --profile core up -d` in `platform-runtime/`)
3. **Document .env configuration**: Explain the relationship between `.env` values and frontend authentication
4. **Document the auth flow**: How `environment.ts` → `RuntimeConfigService` → `OidcDiscoveryService` → Keycloak works
5. **Document troubleshooting**: Common auth errors and their `.env`-related causes
6. **Document mode switching**: How to switch between standalone and Nginx-proxied modes
7. **Document the realm import caveat**: Volume deletion or manual Keycloak admin update when switching modes after first startup

### Files NOT Changed (Preservation)

- `platform-frontend/src/environments/environment.ts` — Already correct for standalone mode
- `platform-frontend/src/app/auth/services/oidc-discovery.service.ts` — Issuer validation logic is correct
- `platform-frontend/src/app/services/runtime-config.service.ts` — config.json fallback is correct
- `shared-infra/config/keycloak/realm/platform-realm.json.template` — Uses `${FRONTEND_URL}` correctly
- `platform-runtime/docker-compose.infra.yml` — Uses `${KEYCLOAK_EXTERNAL_URL}` correctly

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, verify the bug condition exists with the current `.env` values, then verify the fix (documentation + correct `.env.example`) resolves the issue and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Confirm the bug exists by demonstrating the issuer mismatch with Nginx-proxied `.env` values. Confirm or refute the root cause analysis.

**Test Plan**: Verify that when `.env` has `KEYCLOAK_EXTERNAL_URL=https://localhost/auth`, the Keycloak OIDC discovery endpoint returns an issuer that doesn't match `environment.ts` expectations.

**Test Cases**:

1. **Issuer mismatch test**: With `KEYCLOAK_EXTERNAL_URL=https://localhost/auth` in `.env`, call Keycloak's `/.well-known/openid-configuration` and verify the issuer is `https://localhost/auth/realms/platform` (not `http://localhost:8180/realms/platform`) — demonstrates the mismatch
2. **Redirect URI test**: With `FRONTEND_URL=https://localhost` in `.env`, inspect the Keycloak client configuration and verify `redirectUris` is `["https://localhost/*"]` — doesn't match `http://localhost:4200/auth/callback`
3. **Standalone values test**: With `KEYCLOAK_EXTERNAL_URL=http://localhost:8180` in `.env`, call Keycloak's discovery endpoint and verify the issuer matches `http://localhost:8180/realms/platform`

**Expected Counterexamples**:

- Keycloak returns issuer `https://localhost/auth/realms/platform` when `KEYCLOAK_EXTERNAL_URL=https://localhost/auth`
- Frontend's `OidcDiscoveryService.validateDiscoveryResponse()` throws `AuthError('discovery_failed', 'Issuer mismatch: ...')`

### Fix Checking

**Goal**: Verify that the `.env.example` documentation fix enables developers to configure standalone mode correctly.

**Pseudocode:**

```
FOR ALL envConfig WHERE isBugCondition(envConfig, frontendConfig) DO
  updatedEnv := applyStandaloneDefaults(envConfig)  // use .env.example active values
  result := validateOidcDiscovery(updatedEnv, frontendConfig)
  ASSERT result.issuer == frontendConfig.keycloak.baseUrl + "/realms/" + frontendConfig.keycloak.realm
  ASSERT result.redirectUris CONTAINS frontendConfig.keycloak.redirectUri
END FOR
```

### Preservation Checking

**Goal**: Verify that the Nginx-proxied values remain available in `.env.example` and that no application code was modified.

**Pseudocode:**

```
FOR ALL file IN [environment.ts, oidc-discovery.service.ts, runtime-config.service.ts,
                 platform-realm.json.template, docker-compose.infra.yml] DO
  ASSERT file.content == file.originalContent  // no modifications
END FOR

ASSERT .env.example CONTAINS "KEYCLOAK_EXTERNAL_URL=https://localhost/auth"  // commented
ASSERT .env.example CONTAINS "FRONTEND_URL=https://localhost"  // commented
ASSERT .env.example.activeValue("KEYCLOAK_EXTERNAL_URL") == "http://localhost:8180"  // standalone default
ASSERT .env.example.activeValue("FRONTEND_URL") == "http://localhost:4200"  // standalone default
```

**Testing Approach**: Since this is a documentation/configuration fix (no code changes), preservation checking focuses on verifying:

- No source files were modified
- The `.env.example` retains both sets of values
- The active (uncommented) defaults remain standalone-friendly

### Unit Tests

- Verify `.env.example` contains both standalone and Nginx-proxied value sections
- Verify `.env.example` active (uncommented) values match `environment.ts` expectations
- Verify `README.md` contains prerequisite documentation, auth flow explanation, and troubleshooting section
- Verify no source code files in `platform-frontend/src/` were modified

### Property-Based Tests

- Generate random combinations of `KEYCLOAK_EXTERNAL_URL` and `FRONTEND_URL` values and verify that when they match `environment.ts` expectations, the issuer URL construction produces matching values
- Generate various `.env` configurations and verify the comment/uncomment pattern correctly toggles between modes

### Integration Tests

- Start infrastructure with standalone `.env` values → start frontend → verify OIDC discovery succeeds
- Verify Keycloak admin console shows correct `redirectUris` for `platform-frontend` client after clean import with standalone values
- Verify switching to Nginx-proxied mode (after volume deletion + re-import) produces correct Nginx-proxied behavior
