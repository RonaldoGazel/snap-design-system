# Design Document — platform-frontend-refactor

## Overview

This document describes the technical design for the `platform-frontend-refactor` feature. The refactor eliminates structural debt in the Angular 21 frontend by removing duplicate implementations, establishing canonical module ownership, fixing broken routes, and reorganising the top-level routing tree into a coherent pillar-based hierarchy.

The changes are purely structural — no new features are introduced, no APIs change, and no user-visible behaviour is altered beyond fixing the previously unreachable `pessoas/cadastro` route.

---

## Architecture

### Module Ownership Model (Post-Refactor)

```
src/app/
├── auth/                        ← owns: AuthGuard, AuthInterceptor, OIDC logic
├── shell/                       ← owns: SidebarComponent, SidebarService, ThemeService
├── shared/                      ← owns: pipes, utilities, cross-cutting components
│   └── (no sidebar, no auth guard, no auth interceptor, no theme service)
├── features/
│   ├── person/
│   │   └── pages/
│   │       └── profile/         ← canonical profile page (renamed from profile-new/)
│   ├── snap/
│   ├── audit/
│   ├── tasks/
│   └── iam/
└── intelligence/                ← retained: types/utils referenced by shared layer
    ├── link-analysis/services/  ← GraphEntity, NetworkGraph types (referenced by shared)
    └── persons/                 ← AbaFicha type, calcularIniciais util (referenced by shared)
```

### Routing Hierarchy (Post-Refactor)

```
app.routes.ts
├── ...authRoutes                (root-level, cross-cutting)
└── ShellComponent (canActivate: AuthGuard)
    ├── ''  → redirectTo: 'intelligence/person'
    ├── intelligence/
    │   ├── ''  → redirectTo: 'person'
    │   ├── person/              (lazy: person.routes.ts)
    │   ├── documents/           (lazy: documents.routes.ts)
    │   ├── workflows/           (lazy: workflows.routes.ts)
    │   └── snap/                (lazy: snap.routes.ts)  ← moved from root
    └── admin/
        ├── ''  → iamRoutes      (lazy: iam.routes.ts)
        ├── audit-logs/          (lazy: audit.routes.ts) ← moved from root
        └── tasks/               (lazy: tasks.routes.ts) ← moved from admin/tasks sibling
```

```
person.routes.ts (post-fix)
├── ''          → redirectTo: 'dashboard'
├── 'dashboard' → DashboardComponent
├── 'cadastro'  → PersonRegistrationComponent  ← MUST come before :id
└── ':id'       → ProfileComponent             ← renamed from ProfileNewComponent
```

---

## Components and Interfaces

### 1. Sidebar Consolidation

**Files to delete:**
- `src/app/shared/components/sidebar/sidebar.ts`
- `src/app/shared/components/sidebar/sidebar.html`
- `src/app/shared/components/sidebar/sidebar.css`
- `src/app/shared/services/sidebar.service.ts`
- `src/app/shared/services/sidebar.service.spec.ts`
- `src/app/shared/services/sidebar.service.preservation.spec.ts`
- `src/app/shared/models/sidebar.model.ts`

**Canonical implementation:** `src/app/shell/sidebar/` — signal-based, i18n-aware, uses `ActiveOrgService` for role-based nav items.

**Pre-deletion check:** The legacy `SidebarComponent` (selector `app-sidebar`) is not exported from `shared/components/index.ts` and no active import of `shared/components/sidebar` or `shared/services/sidebar.service` was found in the codebase. The `shared/models/sidebar.model.ts` file defines `SidebarMode` which is only imported by `shared/services/sidebar.service.ts` — both can be deleted together.

### 2. Auth Guard and Interceptor Consolidation

**Files to delete:**
- `src/app/shared/guards/auth.guard.ts`
- `src/app/shared/interceptors/auth.interceptor.ts`
- `src/app/shared/interceptors/auth.interceptor.spec.ts`

**Update required:**
- `src/app/shared/guards/index.ts` — remove the `authGuard` export (the stub `CanActivateFn`).

**Canonical implementations:**
- Guard: `src/app/auth/guards/auth.guard.ts` — class-based `AuthGuard` using `AuthService` with OIDC session state.
- Interceptor: `src/app/auth/interceptors/auth.interceptor.ts` — class-based `AuthInterceptor` with token refresh, org header injection, and replay backpressure.

**Pre-deletion check:** `app.routes.ts` already imports `AuthGuard` from `./auth/guards/auth.guard`. No route or provider registration references the stub guard or stub interceptor from `shared/`.

### 3. Person Profile Page Consolidation

**Step 1 — Delete old profile:**
- Delete `src/app/features/person/pages/profile/` (all files: `profile.component.ts`, `.html`, `.scss`).

**Step 2 — Rename profile-new to profile:**
- Rename directory `profile-new/` → `profile/`
- Rename files: `profile-new.component.ts` → `profile.component.ts`, etc.
- Update class name: `ProfileNewComponent` → `ProfileComponent`
- Update selector: `app-profile-new` → `app-profile`
- Update internal import in `profile-new-mapper.ts` if it self-references the component.

**Step 3 — Update route reference:**
- In `person.routes.ts`, update the `:id` route's `loadComponent` path from `./pages/profile-new/profile-new.component` to `./pages/profile/profile.component` and the exported class from `ProfileNewComponent` to `ProfileComponent`.

**Step 4 — Update test files:**
- `profile-new.component.spec.ts` → `profile.component.spec.ts`
- `profile-new.preservation.spec.ts` → `profile.preservation.spec.ts`
- Update all internal imports within those spec files.

### 4. Route Order Fix — `pessoas/cadastro`

**Problem:** In `person.routes.ts`, the `:id` wildcard route is declared before `pessoas/cadastro`, making the cadastro path unreachable.

**Fix:** Reorder routes so `cadastro` appears before `:id`:

```typescript
// person.routes.ts — corrected order
export const personRoutes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    // Static route MUST precede the :id wildcard
    path: 'cadastro',
    loadComponent: () => import('./pages/person-registration/person-registration.component').then(m => m.PersonRegistrationComponent),
  },
  {
    path: ':id',
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent),
  },
];
```

Note: The current route uses `pessoas/cadastro` as the path segment, but since `personRoutes` is mounted at `intelligence/person`, the correct child path is simply `cadastro` (not `pessoas/cadastro`). The fix removes the erroneous `pessoas/` prefix and places the static segment before `:id`.

### 5. Pillar-Based Routing Reorganisation

**Current state:**
- `snap/` is a root-level sibling of `intelligence/`
- `audit-logs/` is a root-level sibling of `admin/`
- `admin/tasks` is declared as a separate root-level entry before `admin/`

**Target state in `app.routes.ts`:**

```typescript
export const routes: Routes = [
  ...authRoutes,
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'intelligence/person', pathMatch: 'full' },
      {
        path: 'intelligence',
        children: [
          { path: '', redirectTo: 'person', pathMatch: 'full' },
          {
            path: 'person',
            loadChildren: () => import('./features/person/person.routes').then(m => m.personRoutes),
          },
          {
            path: 'documents',
            loadChildren: () => import('./features/documents/documents.routes').then(m => m.documentsRoutes),
          },
          {
            path: 'workflows',
            loadChildren: () => import('./features/workflows/workflows.routes').then(m => m.workflowsRoutes),
          },
          {
            path: 'snap',
            loadChildren: () => import('./features/snap/snap.routes').then(m => m.snapRoutes),
          },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            path: '',
            loadChildren: () => import('./features/iam/iam.routes').then(m => m.iamRoutes),
          },
          {
            path: 'audit-logs',
            loadChildren: () => import('./features/audit/audit.routes').then(m => m.auditRoutes),
          },
          {
            path: 'tasks',
            loadChildren: () => import('./features/tasks/tasks.routes').then(m => m.tasksRoutes),
          },
        ],
      },
    ],
  },
];
```

**Sidebar nav links to update:** The canonical `shell/sidebar/sidebar.service.ts` already references `/audit-logs` and `/admin/tasks`. After the routing reorganisation these must be updated to `/admin/audit-logs` and `/admin/tasks` respectively. The `snap` feature is not currently in the sidebar nav; no sidebar change is needed for it.

### 6. Empty and Orphaned Folder Cleanup

**Empty folder — delete:**
- `src/app/routing/` — confirmed empty, no files.

**Orphaned `src/app/intelligence/` — retain and wire:**

Analysis shows the files in `src/app/intelligence/` are actively imported by the `shared/` layer:

| File | Imported by |
|------|-------------|
| `intelligence/link-analysis/services/link-analysis.service.ts` | `shared/utils/dto-transformers.ts`, `shared/models/network-graph.model.ts` |
| `intelligence/persons/models/person.model.ts` | `shared/models/notification.model.ts` |
| `intelligence/persons/utils/iniciais.ts` | `shared/components/pessoa-card/pessoa-card.ts` |

These files are stubs that serve as the canonical type/utility source for the shared layer. They must be **retained**. Since they are pure type/utility files (no route, no component), they do not need to be wired into a route group. They should remain in `src/app/intelligence/` as a domain type library until the full intelligence feature is ported.

### 7. Theme Service Consolidation

**Comparison:**

| Aspect | `shell/theme.service.ts` | `shared/services/theme.service.ts` |
|--------|--------------------------|-------------------------------------|
| Signal `isDark` | ✓ | ✓ |
| `currentTheme` computed | ✗ | ✓ |
| `icon` computed | ✗ | ✓ |
| `label` computed | ✗ | ✓ |
| `LIGHT_CLASS` management | ✓ (sets both `p-dark` and `p-light`) | ✗ (only `p-dark`) |
| `toggle()` | ✓ | ✓ |
| Media query listener | ✓ | ✓ |
| `ngOnDestroy` cleanup | ✓ | ✓ |

**Decision:** `shell/theme.service.ts` is the canonical implementation. It correctly manages both `p-dark` and `p-light` CSS classes, which is required by the `_colors.scss` media query block. The `shared/services/theme.service.ts` only manages `p-dark`, which is a subset.

The `shared/` version adds `currentTheme`, `icon`, and `label` computed signals that are useful for UI components. These three computed properties should be **merged into `shell/theme.service.ts`** before deleting the shared version.

**Files to delete after merge:**
- `src/app/shared/services/theme.service.ts`
- `src/app/shared/services/theme.service.preservation.spec.ts`

**References to update:** Any component importing `ThemeService` from `shared/services/theme.service` must be updated to import from `shell/theme.service`.

---

## Data Models

No new data models are introduced. The refactor only moves, renames, or deletes existing files.

The `SidebarMode` type (`'pinned' | 'auto' | 'collapsed'`) currently defined in `shared/models/sidebar.model.ts` is already re-defined inline in `shell/sidebar/sidebar.service.ts` as `SidebarMode`. The shared model file can be deleted without any migration.

---

## Error Handling

### Route Navigation Errors

After moving `snap/` under `intelligence/` and `audit-logs/` under `admin/`, any bookmarked or hardcoded URL using the old paths (`/snap/...`, `/audit-logs/...`) will produce a `NavigationError`. To prevent silent failures:

1. Add redirect rules in `app.routes.ts` for the old paths:

```typescript
{ path: 'snap', redirectTo: 'intelligence/snap', pathMatch: 'prefix' },
{ path: 'audit-logs', redirectTo: 'admin/audit-logs', pathMatch: 'prefix' },
```

2. The `admin/tasks` path is unchanged (it was already at `admin/tasks` in the old config as a separate entry), so no redirect is needed for tasks.

### Build Errors

Each deletion step must be preceded by a grep for all imports of the file being deleted. The sequence is:

1. Verify zero active imports → delete file → run `pnpm build` → confirm zero errors.
2. Never delete a file before confirming its import graph is clean.

---

## Execution Order

The changes must be applied in this sequence to avoid intermediate build failures:

1. **Fix route order** in `person.routes.ts` (lowest risk, no deletions).
2. **Merge theme service** computed properties into `shell/theme.service.ts`, update all references, then delete `shared/services/theme.service.ts`.
3. **Delete legacy sidebar** (`shared/components/sidebar/`, `shared/services/sidebar.service.ts`, `shared/models/sidebar.model.ts`) — no active imports confirmed.
4. **Delete stub auth guard** (`shared/guards/auth.guard.ts`) and remove its export from `shared/guards/index.ts`.
5. **Delete stub auth interceptor** (`shared/interceptors/auth.interceptor.ts`).
6. **Delete old profile page** (`features/person/pages/profile/`), then rename `profile-new/` → `profile/`, update route reference and test files.
7. **Reorganise pillar routing** in `app.routes.ts` — move `snap/` under `intelligence/`, move `audit-logs/` and `tasks/` under `admin/`, add backward-compat redirects.
8. **Update sidebar nav links** in `shell/sidebar/sidebar.service.ts` for `audit-logs` → `admin/audit-logs`.
9. **Delete empty folder** `src/app/routing/`.
10. **Run full build and test suite** — confirm zero errors and zero regressions.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Static route precedes wildcard

*For any* navigation to the path `intelligence/person/cadastro`, the Angular router SHALL activate the `PersonRegistrationComponent` and SHALL NOT activate the `ProfileComponent` (`:id` wildcard match).

**Validates: Requirements 4.1, 4.2**

### Property 2: Previously-valid routes remain navigable

*For any* route path that produced a successful navigation before the refactor (i.e., no `NavigationError`), navigating to that same path after the refactor SHALL either succeed with the same component or be redirected to an equivalent path via an explicit redirect rule — it SHALL NOT produce an unhandled `NavigationError`.

**Validates: Requirements 5.9**

### Property 3: Test suite regression-free

*For any* test that was in a passing state before the refactor began, executing that same test after all refactor changes are applied SHALL produce a passing result. No previously-passing test SHALL transition to a failing state as a result of the refactor.

**Validates: Requirements 8.2**
