# Implementatiose Plan: platform-frontend-refactor

## Overview

Structural refactor of the Angular 21 frontend to eliminate duplicate implementations, establish canonical module ownership, fix broken routes, and reorganise the top-level routing tree into a coherent pillar-based hierarchy. No new features are introduced — all changes are file moves, deletions, renames, and route reconfigurations.

The tasks follow the execution order defined in the design to avoid intermediate build failures. Each task ends with a `git commit` to keep the history clean and bisectable.

---

## Tasks

- [x] 1. Fix route order in `person.routes.ts`
  - [x] 1.1 Reorder routes so `cadastro` static segment appears before the `:id` wildcard
    - Open `src/app/features/person/person.routes.ts`
    - Move the `cadastro` route block above the `:id` route block
    - Verify the `loadComponent` path for `cadastro` points to `./pages/person-registration/person-registration.component`
    - _Requirements: 4.2, 4.3_
  - [ ]* 1.2 Write property test for static-route-precedes-wildcard (Property 1)
    - **Property 1: Static route precedes wildcard**
    - Navigating to `intelligence/person/cadastro` SHALL activate `PersonRegistrationComponent` and SHALL NOT activate `ProfileComponent`
    - Use Angular's `TestBed` + `RouterTestingHarness` to assert activated component class
    - **Validates: Requirements 4.1, 4.2**
  - [x] 1.3 Commit task 1
    - Run `git add src/app/features/person/person.routes.ts` (and spec file if 1.2 was done)
    - Run `git commit -m "fix(routing): place cadastro static route before :id wildcard"`

- [x] 2. Merge theme service computed properties and delete shared version
  - [x] 2.1 Add `currentTheme`, `icon`, and `label` computed signals to `shell/theme.service.ts`
    - Open `src/app/shell/theme.service.ts`
    - Copy the three `computed()` signals from `src/app/shared/services/theme.service.ts`
    - Ensure the merged service still manages both `p-dark` and `p-light` CSS classes
    - _Requirements: 7.1, 7.2, 7.3_
  - [x] 2.2 Update all references from `shared/services/theme.service` to `shell/theme.service`
    - Run `grep -r "shared/services/theme.service"` across `src/` to find all importers
    - Update each import path to the correct relative path pointing to `shell/theme.service`
    - _Requirements: 7.3, 8.3_
  - [x] 2.3 Delete `shared/services/theme.service.ts` and its spec files
    - Delete `src/app/shared/services/theme.service.ts`
    - Delete `src/app/shared/services/theme.service.preservation.spec.ts`
    - Run `pnpm build` and confirm zero errors
    - _Requirements: 7.1, 8.1_
  - [x] 2.4 Commit task 2
    - Run `git add -A`
    - Run `git commit -m "refactor(theme): merge shared ThemeService into shell, delete shared stub"`

- [x] 3. Delete legacy sidebar files
  - [x] 3.1 Delete `shared/components/sidebar/` directory and `shared/services/sidebar.service.ts`
    - Confirm zero active imports: `grep -r "shared/components/sidebar"` and `grep -r "shared/services/sidebar.service"` must return no results outside the files being deleted
    - Delete `src/app/shared/components/sidebar/sidebar.ts`
    - Delete `src/app/shared/components/sidebar/sidebar.html`
    - Delete `src/app/shared/components/sidebar/sidebar.css`
    - Delete `src/app/shared/services/sidebar.service.ts`
    - Delete `src/app/shared/services/sidebar.service.spec.ts`
    - Delete `src/app/shared/services/sidebar.service.preservation.spec.ts`
    - Delete `src/app/shared/models/sidebar.model.ts`
    - Run `pnpm build` and confirm zero errors
    - _Requirements: 1.2, 1.3, 1.5_
  - [x] 3.2 Commit task 3
    - Run `git add -A`
    - Run `git commit -m "refactor(sidebar): delete legacy shared sidebar, canonical lives in shell"`

- [x] 4. Delete stub auth guard and remove its export
  - [x] 4.1 Remove `authGuard` export from `shared/guards/index.ts` and delete the stub file
    - Confirm zero active imports: `grep -r "shared/guards/auth.guard"` must return no results outside the files being deleted
    - Open `src/app/shared/guards/index.ts` and remove the `authGuard` export line
    - Delete `src/app/shared/guards/auth.guard.ts`
    - Run `pnpm build` and confirm zero errors
    - _Requirements: 2.1, 2.3, 2.6_
  - [x] 4.2 Commit task 4
    - Run `git add -A`
    - Run `git commit -m "refactor(auth): delete stub AuthGuard from shared, canonical lives in auth/"`

- [x] 5. Delete stub auth interceptor
  - [x] 5.1 Delete `shared/interceptors/auth.interceptor.ts` and its spec file
    - Confirm zero active imports: `grep -r "shared/interceptors/auth.interceptor"` must return no results outside the files being deleted
    - Delete `src/app/shared/interceptors/auth.interceptor.ts`
    - Delete `src/app/shared/interceptors/auth.interceptor.spec.ts`
    - Run `pnpm build` and confirm zero errors
    - _Requirements: 2.2, 2.4, 2.6_
  - [x] 5.2 Commit task 5
    - Run `git add -A`
    - Run `git commit -m "refactor(auth): delete stub AuthInterceptor from shared, canonical lives in auth/"`

- [x] 6. Consolidate person profile pages
  - [x] 6.1 Delete the old (inactive) `profile/` directory
    - Confirm zero active imports: `grep -r "pages/profile/profile.component"` must return no results (the active route points to `profile-new`)
    - Delete `src/app/features/person/pages/profile/profile.component.ts`
    - Delete `src/app/features/person/pages/profile/profile.component.html`
    - Delete `src/app/features/person/pages/profile/profile.component.scss`
    - _Requirements: 3.3_
  - [x] 6.2 Rename `profile-new/` directory and files to `profile/`
    - Rename directory `src/app/features/person/pages/profile-new/` → `src/app/features/person/pages/profile/`
    - Rename `profile-new.component.ts` → `profile.component.ts` (and `.html`, `.scss`)
    - Rename `profile-new.component.spec.ts` → `profile.component.spec.ts`
    - Rename `profile-new.preservation.spec.ts` → `profile.preservation.spec.ts`
    - Update class name `ProfileNewComponent` → `ProfileComponent` inside the component file
    - Update selector `app-profile-new` → `app-profile` inside the component file
    - Update all internal imports within the renamed spec files
    - _Requirements: 3.2_
  - [x] 6.3 Update the `:id` route in `person.routes.ts` to reference the renamed component
    - Change `loadComponent` path from `./pages/profile-new/profile-new.component` to `./pages/profile/profile.component`
    - Change the imported class from `ProfileNewComponent` to `ProfileComponent`
    - Run `pnpm build` and confirm zero errors
    - _Requirements: 3.1, 3.4, 3.5_
  - [x] 6.4 Commit task 6
    - Run `git add -A`
    - Run `git commit -m "refactor(person): rename profile-new to profile, delete old inactive profile page"`

- [x] 7. Checkpoint — Ensure all tests pass after steps 1–6
  - Run `pnpm test --run` and confirm zero failing tests
  - If any test fails, fix it before proceeding to task 8
  - Ask the user if questions arise

- [x] 8. Reorganise pillar routing in `app.routes.ts`
  - [x] 8.1 Move `snap/` under `intelligence/` and `audit-logs/` + `tasks/` under `admin/`
    - Open `src/app/app.routes.ts`
    - Nest `snap` as a child of the `intelligence` route group
    - Nest `audit-logs` as a child of the `admin` route group
    - Ensure `tasks` is a child of `admin` (not a root-level sibling)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  - [x] 8.2 Add backward-compatibility redirect rules for old paths
    - Add `{ path: 'snap', redirectTo: 'intelligence/snap', pathMatch: 'prefix' }` at root level
    - Add `{ path: 'audit-logs', redirectTo: 'admin/audit-logs', pathMatch: 'prefix' }` at root level
    - Verify `auth/` routes remain at root level and are not moved into any pillar group
    - Run `pnpm build` and confirm zero errors
    - _Requirements: 5.7, 5.8, 5.9_
  - [ ]* 8.3 Write property test for previously-valid routes remain navigable (Property 2)
    - **Property 2: Previously-valid routes remain navigable**
    - For each route that was valid before the refactor, navigation SHALL succeed or redirect — it SHALL NOT produce an unhandled `NavigationError`
    - Test paths: `/snap/...`, `/audit-logs/...`, `/admin/tasks`, `/intelligence/person`
    - Use `RouterTestingHarness` and assert no `NavigationError` events are emitted
    - **Validates: Requirements 5.9**
  - [x] 8.4 Commit task 8
    - Run `git add -A`
    - Run `git commit -m "refactor(routing): establish pillar-based hierarchy (intelligence/, admin/)"`

- [x] 9. Update sidebar nav links for reorganised routes
  - [x] 9.1 Update `audit-logs` link in `shell/sidebar/sidebar.service.ts`
    - Open `src/app/shell/sidebar/sidebar.service.ts`
    - Change the nav item link from `/audit-logs` to `/admin/audit-logs`
    - Verify no other nav links reference old root-level paths that have moved
    - Run `pnpm build` and confirm zero errors
    - _Requirements: 5.3, 5.4_
  - [x] 9.2 Commit task 9
    - Run `git add src/app/shell/sidebar/sidebar.service.ts`
    - Run `git commit -m "fix(sidebar): update audit-logs nav link to /admin/audit-logs"`

- [x] 10. Delete empty `src/app/routing/` folder
  - [x] 10.1 Confirm the folder is empty and delete it
    - Run `ls src/app/routing/` to confirm no files exist
    - Delete the empty directory `src/app/routing/`
    - _Requirements: 6.1_
  - [x] 10.2 Commit task 10
    - Run `git add -A`
    - Run `git commit -m "chore(cleanup): delete empty src/app/routing/ folder"`

- [x] 11. Final checkpoint — Run full build and test suite
  - Run `pnpm build` and confirm zero TypeScript compilation errors
  - Run `pnpm test --run` (Vitest) and confirm zero failing tests that were passing before the refactor
  - Run the linter and confirm zero new lint errors introduced by the refactor
  - Ask the user if questions arise
  - _Requirements: 8.1, 8.2, 8.4_
  - [ ]* 11.1 Write property test for test suite regression-free (Property 3)
    - **Property 3: Test suite regression-free**
    - Every test that was passing before the refactor SHALL still pass after all changes are applied
    - Capture the pre-refactor passing test list and diff against post-refactor results
    - **Validates: Requirements 8.2**
  - [x] 11.2 Commit final checkpoint
    - Run `git add -A`
    - Run `git commit -m "test(refactor): add regression property tests for routing and test suite integrity"`

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster execution
- Each task ends with a dedicated commit step — never commit across task boundaries
- Steps 1–6 are independent enough to be applied sequentially with a build check after each deletion
- Steps 8–9 must be applied together (routing reorganisation + sidebar link update) to avoid broken nav links
- The `src/app/intelligence/` folder is **retained** — its files are actively imported by the shared layer and must not be deleted
- Property tests use Angular's `RouterTestingHarness` from `@angular/router/testing`
- All grep checks before deletion are mandatory to prevent broken imports

---

## Commit Message Convention

| Task | Commit message |
|------|----------------|
| 1 | `fix(routing): place cadastro static route before :id wildcard` |
| 2 | `refactor(theme): merge shared ThemeService into shell, delete shared stub` |
| 3 | `refactor(sidebar): delete legacy shared sidebar, canonical lives in shell` |
| 4 | `refactor(auth): delete stub AuthGuard from shared, canonical lives in auth/` |
| 5 | `refactor(auth): delete stub AuthInterceptor from shared, canonical lives in auth/` |
| 6 | `refactor(person): rename profile-new to profile, delete old inactive profile page` |
| 8 | `refactor(routing): establish pillar-based hierarchy (intelligence/, admin/)` |
| 9 | `fix(sidebar): update audit-logs nav link to /admin/audit-logs` |
| 10 | `chore(cleanup): delete empty src/app/routing/ folder` |
| 11 | `test(refactor): add regression property tests for routing and test suite integrity` |

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["4.1", "5.1"] },
    { "id": 5, "tasks": ["6.1"] },
    { "id": 6, "tasks": ["6.2"] },
    { "id": 7, "tasks": ["6.3"] },
    { "id": 8, "tasks": ["8.1"] },
    { "id": 9, "tasks": ["8.2", "9.1"] },
    { "id": 10, "tasks": ["8.3", "10.1"] },
    { "id": 11, "tasks": ["11.1"] }
  ]
}
```
