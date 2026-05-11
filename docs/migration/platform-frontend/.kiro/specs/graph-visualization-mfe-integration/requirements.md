# Requirements: Graph Visualization MFE Integration

## Overview

Integrate `graph-visualization-remote` into the SNAP Apolo micro-frontend platform as a fully federated module. This covers documentation, CFMDS hosting, mfe-host routing, and a profile page entry point.

---

## Functional Requirements

### REQ-1: graph-visualization README Documentation

**User Story**: As a developer or AI agent working on `graph-visualization`, I need a comprehensive README that follows the same gold-standard pattern as `mfe-host/README.md`, so I can understand the architecture, run the project, and make changes confidently.

**Acceptance Criteria**:

1. `graph-visualization/README.md` exists and covers: What This Project Delivers, Architecture Overview, Project Structure, Tech Stack table, Running the Project (standalone and integrated modes), How It Interacts with Other Components, Remote Module Contract, CFMDS Artifact Layout, Scripts, Testing, Troubleshooting, and a "For AI Agents" section.
2. The README includes an architecture diagram showing the remote's position in the platform topology.
3. The README documents the `ShellContext` property mapping (auth, theme, i18n, navigation, eventBus, permissions, routeParams).
4. The README documents the events emitted (`graph:node-selected`, `graph:edge-inspected`, `graph:viewport-changed`) and consumed (`host:entity-focus`, `host:filter-changed`).
5. The README includes a "For AI Agents" section with key invariants, file ownership map, and common modification patterns.
6. The README documents both standalone dev mode (`pnpm dev`) and integrated mode (via `platform-runtime`).

**Correctness Properties**:

- Every file listed in the Project Structure section must exist in the repository.
- Every script listed in the Scripts section must be defined in `package.json`.

---

### REQ-2: CFMDS Artifact Registration

**User Story**: As a platform operator, I need `graph-visualization-remote` artifacts published to MinIO CFMDS so `mfe-host` can load the remote at runtime without manual intervention.

**Acceptance Criteria**:

1. `platform-runtime/scripts/seed-modules.sh` (or equivalent) includes a step that copies `graph-visualization/dist/` artifacts to `minio/${S3_BUCKET_CFMDS}/modules/graph-visualization-remote/0.1.0/`.
2. The seeded artifacts include `remoteEntry.js`, all chunk files, and `checksums.json`.
3. `make seed-modules` from `platform-runtime` successfully seeds `graph-visualization-remote` artifacts alongside existing remotes.
4. The CFMDS sidecar manifest aggregation includes a `graph-visualization-remote` entry with `routes: ["/intelligence/graph/**"]`, `exposedModule: "./bootstrap"`, `remoteEntryType: "module"`, and `requiredPermissions: ["intelligence:graph-viewer"]`.
5. The artifact path follows the immutable versioned layout: `/modules/graph-visualization-remote/{version}/`.

**Correctness Properties**:

- Seeding is idempotent — running `make seed-modules` twice produces the same artifact state.
- The `remoteEntry.js` cache header is `no-store`; chunk files have `immutable, max-age=31536000`.

---

### REQ-3: mfe-host Route Overlay Registration

**User Story**: As the shell orchestrator, `mfe-host` needs to know which routes belong to `graph-visualization-remote` and what contract to validate before mounting it.

**Acceptance Criteria**:

1. `mfe-host/src/shell/route-overlay.ts` contains an entry for `graph-visualization-remote` with `routes: ['/intelligence/graph/**']`, `exposedModule: './bootstrap'`, and `remoteEntryType: 'module'`.
2. The route overlay entry specifies `requiredPermission: 'intelligence:graph-viewer'`.
3. `mfe-host/README.md` route overlay table is updated to include the `graph-visualization-remote` row.
4. No changes to `mfe-host/rspack.config.ts` are required — remotes are loaded dynamically at runtime.
5. The shell correctly mounts `graph-visualization-remote` when navigating to `/intelligence/graph/**` and unmounts it when navigating away.

**Correctness Properties**:

- Route matching for `/intelligence/graph/**` must not conflict with existing `platform-frontend` routes (`/intelligence/**`). The more specific path takes precedence.
- The shell must not attempt to load `graph-visualization-remote` for users lacking `intelligence:graph-viewer`.

---

### REQ-4: ProfileComponent "Open Graph" Button

**User Story**: As an analyst viewing a person's profile, I want a button that opens the relationship graph for that person, so I can explore their connections without manually navigating.

**Acceptance Criteria**:

1. The `ProfileComponent` page header (`<div class="page-header__actions">`) contains a button with label `'person.profile.openGraph' | translate`, icon `pi pi-share-alt`, and `[outlined]="true"`.
2. Clicking the button navigates to `/intelligence/graph/person/:personId` where `:personId` is the current person's ID as a **path segment** — not a query param.
3. The button is only rendered when `person` is non-null (i.e., inside the `@else if (person)` block).
4. The button is disabled or absent when `personId()` returns a falsy value.
5. The button does not appear in loading, 404, 403, or generic error states.
6. The `openGraph()` method in `ProfileComponent` performs the navigation using `this.router.navigate(['/intelligence/graph/person', id])`.

**Correctness Properties**:

- `openGraph()` must never navigate with a null or empty `personId`.
- The person ID must be a path segment so the URL is canonical, bookmarkable, and immune to query-param stripping by proxies or router guards.
- The graph remote must read `ShellContext.routeParams.personId` on mount to load the correct profile's graph.

---

### REQ-5: i18n Translation Keys

**User Story**: As a user of the platform in either Portuguese or English, I need the "Open Graph" button label to appear in my active locale.

**Acceptance Criteria**:

1. `platform-frontend/src/locales/pt-BR.json` contains `person.profile.openGraph` with value `"Ver Grafo de Vínculos"`.
2. `platform-frontend/src/locales/en.json` contains `person.profile.openGraph` with value `"Open Relationship Graph"`.
3. Both locale files remain valid JSON after the addition.
4. The translation key follows the existing `person.profile.*` namespace convention.

**Correctness Properties**:

- The key path `person.profile.openGraph` must exist in both locale files.
- No existing translation keys are modified or removed.

---

## Non-Functional Requirements

### NFR-1: Documentation Parity

The `graph-visualization/README.md` must match the structural depth and section coverage of `mfe-host/README.md`. Sections may be adapted to the React/Rspack context but must not be omitted.

### NFR-2: Zero Breaking Changes

All changes are additive. No existing routes, components, locale keys, or build configurations are modified in a way that breaks existing functionality.

### NFR-3: Artifact Immutability

Published artifacts follow the CFMDS immutable versioning contract. No overwrite of existing versioned paths is permitted.

### NFR-4: Permission Enforcement

The `intelligence:graph-viewer` permission is enforced at the shell level (route overlay) before any remote bundle is fetched. The remote itself may additionally check permissions for write operations.

### NFR-5: Locale Coverage

Both `pt-BR` and `en` locales must be updated simultaneously. Partial locale updates are not acceptable.
