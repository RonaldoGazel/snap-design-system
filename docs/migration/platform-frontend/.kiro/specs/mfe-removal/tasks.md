# Implementation Plan: MFE Removal

## Overview

Remove the Micro-Frontend architecture from the platform. This is a deletion/simplification
exercise: federation-specific files are deleted, dual-mode code is simplified to its
standalone path, build config is cleaned up, orchestration files are pruned, Nginx is
re-pointed, and the `platform-frontend` service definition is added to the compose stack.
The property-based test is written first to lock in route completeness before any changes
are made.

## Tasks

- [x] 1. Write property-based test for route resolution completeness
  - Create `src/app/app.routes.spec.ts` using Vitest and fast-check
  - Use `fc.constantFrom` over the set of known application routes: `/snap`, `/audit-logs`,
    `/intelligence/person`, `/intelligence/documents`, `/intelligence/workflows`, `/admin`,
    `/admin/tasks`
  - For each sampled path, assert that the shell route's `children` array contains a matching
    route config (non-null, path matches top-level or two-segment path)
  - Run with `{ numRuns: 100 }`
  - **Property 1: Route resolution completeness**
  - **Validates: Requirements 3.3, 10.2**

- [x] 2. Delete federation source files from platform-frontend
  - [x] 2.1 Delete `src/bootstrap.ts`
    - _Requirements: 2.1_
  - [x] 2.2 Delete `webpack.config.ts`
    - _Requirements: 1.3_
  - [x] 2.3 Delete `Dockerfile.federation`
    - _Requirements: 1.4_
  - [x] 2.4 Delete the entire `src/app/routing/` directory
    - Removes: `federated-app.routes.ts`, `federated-route-config.ts`,
      `federated-route-map.ts`, `federated-navigation.service.ts`, and any barrel files
    - _Requirements: 2.5, 2.6, 3.2_
  - [x] 2.5 Delete `ExecutionModeService` (`src/app/services/execution-mode.service.ts`)
    - _Requirements: 2.2_
  - [x] 2.6 Delete `ShellContextBridge` and related types
    - Delete `src/app/shell/shell-context-bridge.service.ts` (or wherever it lives)
    - Delete `shell-context.types.ts` / `RemoteModuleContract` interface file
    - _Requirements: 2.3_
  - [x] 2.7 Delete `FederatedTokenProvider`
    - _Requirements: 2.4_

- [x] 3. Simplify ShellComponent to remove ExecutionModeService dependency
  - Open `src/app/shell/shell.ts`
  - Remove the `ExecutionModeService` constructor injection
  - Remove the `if (!this.executionMode.isStandalone()) { return; }` guard from the `ngOnInit`
    `/me` call — the call now runs unconditionally
  - Verify no other references to `ExecutionModeService` remain in the file
  - _Requirements: 2.2, 10.5_

- [x] 4. Simplify ThemeService to remove federated-mode dead code
  - Open `src/app/shell/theme.service.ts`
  - Remove the `setFromHost()` method
  - Remove the `hostControlled` flag and any logic that reads or sets it
  - Verify the media query listener setup and localStorage persistence remain intact
    (standalone behavior is preserved)
  - _Requirements: 2.2, 10.8_

- [x] 5. Checkpoint — verify platform-frontend compiles and tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Update build configuration in platform-frontend
  - [x] 6.1 Update `angular.json`
    - Remove the entire `"build-federation"` key from the `architect` section
    - Leave `build`, `serve`, and `test` targets untouched
    - _Requirements: 1.1, 1.5_
  - [x] 6.2 Update `package.json`
    - Remove the `"build:federation"` entry from `scripts`
    - Remove `@angular-architects/module-federation` from `dependencies`
    - Remove `@angular-builders/custom-webpack` from `devDependencies`
    - Remove `webpack` from `devDependencies`
    - _Requirements: 1.5, 1.7_

- [x] 7. Delete federation-related unit test files from platform-frontend
  - Delete `src/app/routing/bootstrap-mount.spec.ts`
  - Delete `src/app/routing/federated-navigation.service.spec.ts`
  - Delete `src/app/routing/federated-route-config.spec.ts`
  - Delete `src/app/routing/federated-route-map.spec.ts`
  - Delete `src/app/services/execution-mode.service.spec.ts`
  - Delete `src/app/shell/shell-context-bridge.service.spec.ts`
  - _Requirements: 8.5_

- [x] 8. Update theme.service.spec.ts to remove federated-mode test block
  - Open `src/app/shell/theme.service.spec.ts`
  - Delete the entire `describe('setFromHost (federated mode)')` block
  - Leave `describe('standalone mode preservation')` and all other describe blocks untouched
  - _Requirements: 8.5, 10.8_

- [x] 9. Delete federation-related e2e test files from platform-frontend
  - Delete `e2e/federation-auth.spec.ts`
  - Delete `e2e/federation-lifecycle.spec.ts`
  - Delete `e2e/federation-harness.html`
  - Delete `e2e/standalone-auth-fix.spec.ts`
  - Delete `e2e/standalone-auth-fix-preservation.spec.ts`
  - Verify `e2e/test_login_flow.py` is preserved (standalone auth flow test)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 10. Checkpoint — verify platform-frontend build and remaining tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Delete docker-compose.mfes.yml from platform-runtime
  - Delete `docker-compose.mfes.yml` from the `platform-runtime` repository root
  - This single deletion removes the `mfe-host`, `cfmds`, `minio-cfmds`, and
    `minio-cfmds-init` service definitions in one operation
  - _Requirements: 4.4, 5.1, 11.8_

- [x] 12. Update the Makefile in platform-runtime
  - Remove the `MFES` variable definition
  - Redefine (or remove) the `ALL` variable so it no longer references
    `docker-compose.mfes.yml`; remaining compose files are `$(INFRA)` and `$(SERVICES)`
  - Remove the `up-mfes` target
  - Remove the `build-federation-eco-snap`, `build-federation-platform-frontend`,
    `build-federation-graph-visualization`, and `build-federation-modules` targets
  - Remove the `seed-modules` target
  - Remove the `ensure-mfe-buckets` target
  - Update `up`, `up-extended`, `up-full`, `up-full-rebuild` targets: remove
    `$(MFES)` / `$(ALL)` compose file flags and remove the federation build pipeline steps
    (`build-federation-modules`, `ensure-mfe-buckets`, `seed-modules`)
  - Update `down`, `reset`, `logs`, `ps` targets to use only `$(SERVICES)` (and `$(INFRA)`
    where applicable) instead of `$(ALL)`
  - Update the `help` target to remove all MFE-related entries
  - Update the `.PHONY` declaration to remove all deleted target names
  - _Requirements: 4.3, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 9.1, 9.2_

- [x] 13. Delete and update MFE-related scripts in platform-runtime
  - Delete `scripts/ensure-mfe-buckets.sh`
  - Delete `scripts/seed-modules.sh`
  - Edit `scripts/init-secrets.sh`: remove the `kc_cfmds_service_secret` entry from
    `SECRET_MAP` (leave all other entries untouched)
  - Verify `scripts/generate-frontend-config.sh` is unchanged
  - _Requirements: 5.3, 5.4, 7.2, 7.3, 7.4, 7.5_

- [x] 14. Update platform-runtime configuration files
  - [x] 14.1 Update `.env.example`
    - Remove: `PORT_CFMDS`, `KC_CFMDS_SERVICE_SECRET`, `S3_BUCKET_CFMDS`,
      `MINIO_STAGING_EXPIRY_DAYS`, `PORT_MINIO_CFMDS_API`, `PORT_MINIO_CFMDS_CONSOLE`
    - _Requirements: 7.1_
  - [x] 14.2 Update `config/frontend-config.template.json`
    - Remove the `"remotesBaseUrl"` key
    - _Requirements: 7.6_
  - [x] 14.3 Update `services.yml`
    - Mark `mfe-host`, `mfe-cfmds`, `eco-snap-components-library`, and
      `graph-visualization` as `status: decommissioned`
    - _Requirements: 4.5, 5.10, 9.5, 11.6, 11.7_

- [x] 15. Update Nginx configuration in shared-infra
  - Open `shared-infra/config/nginx/nginx.conf`
  - Replace all four occurrences of `http://mfe-host:80` with `http://platform-frontend:80`
    (root `/` block, `/auth/callback` block, `/auth/session-expired` block, `/auth/error`
    block)
  - Remove the `location = /remotes/manifest.json` block (CFMDS sidecar proxy)
  - Remove the `location /remotes/` block (CFMDS ATS proxy)
  - Remove the `$cfmds_content_type` map declaration
  - Remove the CFMDS reference from the `Content-Security-Policy` header (`script-src` and
    `connect-src`)
  - _Requirements: 6.1, 6.2, 6.4, 6.5_
  - **Security note:** CSP header changes affect browser security policy — verify the updated
    header still covers all legitimate script and connect sources before merging.

- [x] 16. Add platform-frontend service definition to docker-compose.services.yml
  - Open `platform-runtime/docker-compose.services.yml`
  - Add the `platform-frontend` service block:
    - `profiles: [core, extended, full]`
    - `deploy.resources.limits.memory: 128M` / `reservations.memory: 64M`
    - `build.context: ${REPOS_ROOT:-..}/platform-frontend` with `dockerfile: Dockerfile`
    - `volumes`: mount `./config/frontend-config.json` at
      `/usr/share/nginx/html/config.json:ro`
    - `networks: [trillian-net]`
    - `healthcheck`: `wget -qO- http://127.0.0.1:80/ || exit 1`, interval 10s, timeout 5s,
      retries 5, start_period 10s
  - Do NOT create a new compose file — add to the existing `docker-compose.services.yml`
  - _Requirements: 6.6, 6.7, 6.8_

- [x] 17. Update documentation
  - [x] 17.1 Update `platform-runtime/README.md`
    - Remove references to `mfe-host`, `cfmds`, and federation build steps
    - Update the dev workflow description to reflect the simplified stack
    - _Requirements: 9.3_
  - [x] 17.2 Update `platform-frontend/README.md`
    - Remove references to `build:federation`, `Dockerfile.federation`, and federated mode
    - _Requirements: 9.4_

- [x] 18. Final checkpoint — verify the full stack wires together
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP. No optional tasks
  exist in this plan — all tasks are required deletions or simplifications.
- The property-based test (task 1) is written before any deletions so it can serve as a
  regression guard throughout the migration.
- Tasks 2–10 are scoped entirely to `platform-frontend`.
- Tasks 11–14 are scoped entirely to `platform-runtime`.
- Task 15 is scoped to `shared-infra`.
- Task 16 is scoped to `platform-runtime`.
- Task 17 spans `platform-runtime` and `platform-frontend` READMEs.
- `main.ts`, `app.config.ts`, and `app.routes.ts` require NO changes — they are already
  correct for standalone mode.
- The CSP header change in task 15 touches security policy and should receive a security
  review before merging (per security-policy.md).
