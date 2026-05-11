# Requirements Document

## Introduction

This document specifies the requirements for the **platform-frontend-refactor** feature. The goal is to eliminate structural debt accumulated in the Angular 21 frontend codebase by removing duplicate code, establishing a canonical module ownership model, fixing broken and unreachable routes, and reorganising the top-level routing tree into a coherent pillar-based hierarchy.

The refactor covers five areas:
1. Removal of the duplicate sidebar (shared vs. shell)
2. Removal of the duplicate auth guard and interceptor (shared vs. auth module)
3. Consolidation of the person profile pages (profile-new → profile, old profile deleted)
4. Fix of the unreachable `pessoas/cadastro` route shadowed by the `:id` wildcard
5. Establishment of pillar-based routing (`intelligence/` and `admin/` as top-level groups) with correct placement of `snap/`, `audit-logs/`, and `admin/tasks`

---

## Glossary

- **Shell**: The `src/app/shell/` module that owns the application frame (topbar, sidebar, theme).
- **Shared**: The `src/app/shared/` directory that provides cross-cutting utilities, pipes, and directives. After this refactor it must not own sidebar, auth guard, or auth interceptor.
- **Auth module**: The `src/app/auth/` module that owns all OIDC authentication logic, including the canonical guard and interceptor.
- **Canonical sidebar**: The `shell/sidebar/` component — signal-based, i18n-aware, and actively maintained.
- **Legacy sidebar**: The `shared/components/sidebar/` component and `shared/services/sidebar.service.ts` — hardcoded Portuguese routes pointing to non-existent paths; to be deleted.
- **Canonical auth guard**: `auth/guards/auth.guard.ts` — real OIDC guard.
- **Stub auth guard**: `shared/guards/auth.guard.ts` — simple stub using `AuthStateService`; to be deleted.
- **Canonical auth interceptor**: `auth/interceptors/auth.interceptor.ts` — real OIDC interceptor.
- **Stub auth interceptor**: `shared/interceptors/auth.interceptor.ts` — stub; to be deleted.
- **profile-new**: The active person profile page at `features/person/pages/profile-new/`; to be renamed to `profile/`.
- **Old profile**: The inactive person profile page at `features/person/pages/profile/`; to be deleted.
- **Intelligence pillar**: The `intelligence/` top-level route group, owning `snap/` as a child.
- **Admin pillar**: The `admin/` top-level route group, owning `audit-logs/` and `tasks/` as children.
- **Router**: The Angular router configuration in `app.routes.ts` and feature-level `*.routes.ts` files.
- **Dead code**: Files and folders that are unreferenced by any active route, import, or provider registration.
- **Empty folder**: `src/app/routing/` — contains no files; to be deleted.
- **Orphaned intelligence folder**: `src/app/intelligence/` — contains `link-analysis/` and `persons/` models/utils not wired into any route; to be assessed and either wired or removed.

---

## Requirements

### Requirement 1 — Remove Duplicate Sidebar

**User Story:** As a developer, I want a single canonical sidebar implementation, so that sidebar behaviour, navigation items, and i18n are maintained in one place without risk of divergence.

#### Acceptance Criteria

1. THE Codebase SHALL contain exactly one sidebar implementation, located at `src/app/shell/sidebar/`.
2. WHEN the refactor is applied, THE Codebase SHALL have the directory `src/app/shared/components/sidebar/` deleted in its entirety.
3. WHEN the refactor is applied, THE Codebase SHALL have the file `src/app/shared/services/sidebar.service.ts` deleted.
4. IF any component or module imports `SidebarComponent` or `SidebarService` from `shared/`, THEN THE Router SHALL resolve those imports to the canonical `shell/sidebar/` equivalents before deletion.
5. THE Build SHALL produce zero TypeScript compilation errors after the legacy sidebar files are removed.

---

### Requirement 2 — Remove Duplicate Auth Guard and Interceptor

**User Story:** As a developer, I want all authentication logic owned exclusively by the `auth/` module, so that there is no risk of the wrong guard or interceptor being applied to a route.

#### Acceptance Criteria

1. THE Codebase SHALL contain exactly one `AuthGuard`, located at `src/app/auth/guards/auth.guard.ts`.
2. THE Codebase SHALL contain exactly one auth `HttpInterceptor`, located at `src/app/auth/interceptors/auth.interceptor.ts`.
3. WHEN the refactor is applied, THE Codebase SHALL have the file `src/app/shared/guards/auth.guard.ts` deleted.
4. WHEN the refactor is applied, THE Codebase SHALL have the file `src/app/shared/interceptors/auth.interceptor.ts` deleted.
5. IF any route definition or provider registration references the stub guard or stub interceptor from `shared/`, THEN THE Router SHALL be updated to reference the canonical `auth/` versions before deletion.
6. THE Build SHALL produce zero TypeScript compilation errors after the stub files are removed.

---

### Requirement 3 — Consolidate Person Profile Pages

**User Story:** As a developer, I want a single active person profile page at the canonical `profile/` path, so that the routing tree is unambiguous and dead code is eliminated.

#### Acceptance Criteria

1. THE Codebase SHALL contain exactly one person profile page component, located at `src/app/features/person/pages/profile/`.
2. WHEN the refactor is applied, THE Codebase SHALL have the directory `src/app/features/person/pages/profile-new/` renamed to `src/app/features/person/pages/profile/`, preserving all component files and their contents.
3. WHEN the refactor is applied, THE Codebase SHALL have the old `src/app/features/person/pages/profile/` directory deleted prior to the rename.
4. THE Router SHALL reference the renamed component at the same route path that previously pointed to `profile-new/`.
5. THE Build SHALL produce zero TypeScript compilation errors after the rename and deletion.

---

### Requirement 4 — Fix Unreachable `pessoas/cadastro` Route

**User Story:** As a developer, I want the `pessoas/cadastro` route to be reachable, so that the registration page is accessible and the route ordering does not silently swallow navigation.

#### Acceptance Criteria

1. WHEN a user navigates to `pessoas/cadastro`, THE Router SHALL activate the cadastro route component without matching the `:id` wildcard.
2. THE `person.routes.ts` file SHALL declare the `cadastro` static route before the `:id` dynamic route.
3. IF the `cadastro` route is currently positioned after the `:id` wildcard in `person.routes.ts`, THEN THE Router configuration SHALL be reordered so that `cadastro` appears first.
4. THE Build SHALL produce zero TypeScript compilation errors after the route reorder.

---

### Requirement 5 — Establish Pillar-Based Routing Hierarchy

**User Story:** As a developer, I want the top-level route tree organised into `intelligence/` and `admin/` pillar groups, so that feature routes are predictably located and the routing structure reflects the application's domain architecture.

#### Acceptance Criteria

1. THE Router SHALL define `intelligence/` as a top-level lazy-loaded route group.
2. THE Router SHALL define `admin/` as a top-level lazy-loaded route group.
3. WHEN the refactor is applied, THE Router SHALL register `snap/` as a child route of `intelligence/`, accessible at `intelligence/snap`.
4. WHEN the refactor is applied, THE Router SHALL register `audit-logs/` as a child route of `admin/`, accessible at `admin/audit-logs`.
5. WHEN the refactor is applied, THE Router SHALL register `tasks/` as a child route of `admin/`, accessible at `admin/tasks`.
6. IF `admin/tasks` is currently defined as a sibling of `admin/` at the root level, THEN THE Router configuration SHALL be updated to nest `tasks/` under the `admin/` route group.
7. THE `auth/` routes SHALL remain at the root level as cross-cutting concerns and SHALL NOT be moved into any pillar group.
8. THE Build SHALL produce zero TypeScript compilation errors after the routing reorganisation.
9. WHILE the application is running, THE Router SHALL not produce any `NavigationError` for routes that were valid before the refactor.

---

### Requirement 6 — Remove Empty and Orphaned Folders

**User Story:** As a developer, I want no empty or orphaned directories in the source tree, so that the project structure is clean and does not mislead contributors about available modules.

#### Acceptance Criteria

1. WHEN the refactor is applied, THE Codebase SHALL have the empty directory `src/app/routing/` deleted.
2. IF the directory `src/app/intelligence/` contains files that are not imported by any active route or component, THEN THE Codebase SHALL have those unreferenced files deleted.
3. IF the directory `src/app/intelligence/` contains files that are referenced by active routes or components, THEN THE Codebase SHALL retain those files and wire them into the appropriate pillar route group.
4. THE Build SHALL produce zero TypeScript compilation errors after empty and orphaned folders are removed.

---

### Requirement 7 — Resolve Theme Service Duplication

**User Story:** As a developer, I want a single canonical theme service, so that theme state is managed in one place and there is no risk of conflicting theme updates.

#### Acceptance Criteria

1. THE Codebase SHALL contain exactly one theme service after the refactor is applied.
2. WHEN the two theme service implementations (`shell/theme.service.ts` and `shared/services/theme.service.ts`) are compared, THE Developer SHALL determine which implementation is canonical based on active usage and signal-based state management.
3. IF one theme service is a subset or stub of the other, THEN THE Codebase SHALL delete the less capable implementation and update all references to point to the canonical one.
4. THE Build SHALL produce zero TypeScript compilation errors after the theme service consolidation.

---

### Requirement 8 — Build and Test Integrity After Refactor

**User Story:** As a developer, I want the application to build and all existing tests to pass after the refactor, so that no regressions are introduced.

#### Acceptance Criteria

1. THE Build SHALL complete without errors after all refactor changes are applied.
2. WHEN the Vitest test suite is executed after the refactor, THE Test Runner SHALL report zero failing tests that were passing before the refactor began.
3. IF a test file imports from a deleted path, THEN THE Test File SHALL be updated to import from the canonical replacement path before the deleted file is removed.
4. THE Linter SHALL report zero new lint errors introduced by the refactor changes.
