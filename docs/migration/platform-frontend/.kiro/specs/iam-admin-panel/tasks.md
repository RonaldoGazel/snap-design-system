# Implementation Plan: IAM Admin Panel

## Overview

Implement the IAM Admin Panel feature module (`features/iam/`) for the platform-frontend Angular application. The panel provides administrative UI for identity and access management, supporting Platform Admin (cross-org governance) and Org Admin (org-internal management) workflows. Implementation follows the existing audit feature pattern: standalone components, signals-based state, PrimeNG UI, `@ngx-translate/core` i18n, `HttpClient`-based services, and URL query param sync.

## Tasks

- [x] 1. Foundation: Environment config, TypeScript models, and feature scaffolding
  - [x] 1.1 Add `permissionServiceUrl` to environment configuration
    - Add `permissionServiceUrl: 'http://localhost:8001'` to `src/environments/environment.ts`
    - Add `http://localhost:8001` to the `trustedOrigins` array
    - _Requirements: 1.4_

  - [x] 1.2 Create Identity Service TypeScript model interfaces
    - Create `features/iam/models/identity.model.ts`
    - Define `UserResponse`, `OrganizationResponse`, `InvitationResponse`
    - Define `CreateUserRequest`, `UpdateUserRequest`, `CreateOrganizationRequest`, `UpdateOrganizationRequest`, `CreateInvitationRequest`
    - Define `UserQueryParams`, `OrgQueryParams`, `InvitationQueryParams`
    - _Requirements: 12.1, 12.3_

  - [x] 1.3 Create Permission Service TypeScript model interfaces
    - Create `features/iam/models/permission.model.ts`
    - Define `RoleResponse`, `PermissionResponse`, `RoleAssignmentResponse`, `GroupResponse`, `GroupMemberResponse`
    - Define `RoleCreate`, `RoleUpdate`, `RoleAssignmentCreate`, `GroupCreate`, `GroupUpdate`, `GroupMemberCreate`
    - _Requirements: 12.2, 12.3_

  - [x] 1.4 Create shared pagination model
    - Create `features/iam/models/pagination.model.ts`
    - Define `PaginatedResponse<T>` generic interface with `items`, `total_count`, `limit`, `offset`
    - Define `PaginationParams` interface with `limit` and `offset`
    - _Requirements: 12.4, 12.5_

- [x] 2. ActiveOrgService — central org context state
  - [x] 2.1 Implement ActiveOrgService with three-state model
    - Create `features/iam/services/active-org.service.ts`
    - Implement `userOrganizationId`, `userOrganizationName`, `isPlatformAdmin` signals initialized from `PlatformIdentityService`
    - Implement `activeOrganizationId` and `activeOrganizationName` writable signals
    - Implement derived signals: `isOwnOrg`, `isPlatformView`, `isOrgView`, `canMutate`
    - Implement `switchOrg()`, `switchToPlatformView()`, `resetToOwnOrg()` methods
    - Implement `initialize()` method that checks `sessionStorage` for persisted context, validates via `GET /api/v1/organizations/{orgId}`, and falls back to defaults
    - For Org Admin: `activeOrganizationId` is immutable (always own org)
    - For Platform Admin: `null` = platform view, own org = SNAP (canMutate true), foreign org = read-only (canMutate false)
    - Persist to `sessionStorage` on `switchOrg()`, clear on `switchToPlatformView()`
    - _Requirements: 9.1, 9.5, Foundational Rules 3, 9_

  - [ ]* 2.2 Write property test: ActiveOrgService defaults and persistence (Property 23)
    - **Property 23: ActiveOrgService defaults and persistence**
    - Test that Org Admin always defaults to own org, Platform Admin defaults to null
    - Test sessionStorage restore and validation flow
    - **Validates: Requirements 9.5, Foundational Rule 3**

  - [ ]* 2.3 Write property test: canMutate signal correctness (Property 24)
    - **Property 24: Platform Admin canMutate is false when viewing foreign org or in platform view**
    - Test all combinations: Platform Admin in platform view, own org, foreign org; Org Admin always true
    - **Validates: Foundational Rule 9**

- [x] 3. HTTP Services — Identity Service consumers
  - [x] 3.1 Implement UserService
    - Create `features/iam/services/user.service.ts`
    - Inject `HttpClient`, construct base URL from `environment.identityServiceUrl`
    - Implement `listUsers()`, `getUser()`, `createUser()`, `updateUser()`, `deactivateUser()`, `lockUser()`, `unlockUser()`, `deleteUser()`
    - Use `HttpParams` for query parameters, return `Observable<T>` from all methods
    - Follow audit feature `AuditLogService` pattern
    - _Requirements: 11.1, 11.6, 11.7_

  - [x] 3.2 Implement OrganizationService
    - Create `features/iam/services/organization.service.ts`
    - Implement `listOrganizations()`, `getOrganization()`, `createOrganization()`, `updateOrganization()`, `deleteOrganization()`
    - _Requirements: 11.2, 11.6, 11.7_

  - [x] 3.3 Implement InvitationService
    - Create `features/iam/services/invitation.service.ts`
    - Implement `listInvitations()`, `createInvitation()`, `revokeInvitation()`
    - _Requirements: 11.3, 11.6, 11.7_

- [x] 4. HTTP Services — Permission Service consumers
  - [x] 4.1 Implement RoleService
    - Create `features/iam/services/role.service.ts`
    - Inject `HttpClient`, construct base URL from `environment.permissionServiceUrl`
    - Implement `listRoles()`, `getRole()`, `createRole()`, `updateRole()`, `deleteRole()` (with version query param)
    - Implement `listAssignments()`, `assignRole()`, `revokeAssignment()`
    - _Requirements: 11.4, 11.6, 11.7_

  - [x] 4.2 Implement GroupService
    - Create `features/iam/services/group.service.ts`
    - Implement `listGroups()`, `getGroup()`, `createGroup()`, `updateGroup()`, `deleteGroup()` (with version query param)
    - Implement `listMembers()`, `addMember()`, `removeMember()`
    - _Requirements: 11.5, 11.6, 11.7_

  - [ ]* 4.3 Write property test: Service list methods construct correct pagination parameters (Property 3)
    - **Property 3: Service list methods construct correct pagination parameters**
    - Test all six service list methods with arbitrary valid `limit` (1–1000) and `offset` (≥0) values
    - **Validates: Requirements 2.1, 4.1, 5.1, 5.9, 6.1, 7.1, 8.1**

  - [ ]* 4.4 Write property test: Service base URLs derived from environment (Property 20)
    - **Property 20: Service base URLs are derived from environment configuration**
    - Verify UserService, OrganizationService, InvitationService use `identityServiceUrl`; RoleService, GroupService use `permissionServiceUrl`
    - **Validates: Requirements 11.6**

- [x] 5. Checkpoint — Foundation and services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. OrgContextGuard and route setup
  - [x] 6.1 Implement OrgContextGuard functional route guard
    - Create `features/iam/guards/org-context.guard.ts`
    - Implement `CanActivateFn` that checks `ActiveOrgService.activeOrganizationId() !== null`
    - Platform Admin with null org → redirect to `/admin/organizations`
    - Org Admin with null org (fallback) → redirect to `/`
    - _Requirements: 1.5, Foundational Rule 3_

  - [x] 6.2 Create IAM feature routes and register in app.routes.ts
    - Create `features/iam/iam.routes.ts` with all child routes
    - Platform-view routes (no guard): `organizations`, `organizations/:orgId`, `all-users`
    - Org-scoped routes (with `OrgContextGuard`): `users`, `users/:userId`, `groups`, `groups/:groupId`, `roles`, `roles/:roleId`, `invitations`
    - Default redirect: `''` → `'users'`
    - Add lazy-loaded `admin` route in `app.routes.ts` under `ShellComponent`
    - _Requirements: 1.3, 1.5, 14.5_

  - [ ]* 6.3 Write property test: Org-scoped routes are guarded (Property 29)
    - **Property 29: Org-scoped routes are guarded by OrgContextGuard**
    - Test that guard prevents navigation when `activeOrganizationId` is null, redirects correctly per role
    - **Validates: Foundational Rule 3**

- [x] 7. Sidebar integration and OrgContextSwitcher
  - [x] 7.1 Update SidebarService with role-aware IAM navigation items
    - Convert `sections` signal to `computed()` that derives items from `ActiveOrgService.isPlatformAdmin()`
    - All admin users: Users, Groups, Roles under administration section
    - Org Admin only: Invitations
    - Platform Admin only: Organizations, All Users
    - Use i18n keys: `shell.nav.users`, `shell.nav.organizations`, `shell.nav.groups`, `shell.nav.roles`, `shell.nav.invitations`, `shell.nav.allUsers`
    - _Requirements: 1.1, 1.2, 9.2, 9.3, 9.4_

  - [x] 7.2 Implement OrgContextSwitcherComponent
    - Create `features/iam/components/org-context-switcher/org-context-switcher.component.ts`
    - Standalone component, `OnPush`, signals-based
    - Show current mode: "Platform" or active org name
    - PrimeNG Select dropdown to switch org (fetched from OrganizationService) or back to "Platform" view
    - Read-only badge when viewing foreign org (`!isOwnOrg && isOrgView`)
    - Hidden for Org Admin users
    - _Requirements: 9.1, Foundational Rule 3_

  - [ ]* 7.3 Write property test: Sidebar navigation items match user role (Property 1)
    - **Property 1: Sidebar navigation items match user role**
    - Test all role configurations produce correct nav item sets
    - **Validates: Requirements 1.1, 8.3, 9.2, 9.3, 9.4**

  - [ ]* 7.4 Write property test: All navigation item labels are valid i18n keys (Property 2)
    - **Property 2: All navigation item labels are valid i18n keys**
    - **Validates: Requirements 1.2, 13.2**

  - [ ]* 7.5 Write property test: Org context switcher visibility (Property 26)
    - **Property 26: Org context switcher is visible only to Platform Admin**
    - **Validates: Foundational Rule 3**

- [x] 8. Checkpoint — Routing, sidebar, and org context
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. User management pages
  - [x] 9.1 Implement UserListPage
    - Create `features/iam/pages/user-list/user-list.component.ts`
    - Standalone, `OnPush`, signals for state (`users`, `totalRecords`, `loading`, `forbidden`, `errorMessage`)
    - PrimeNG Table with lazy pagination, status filter (PrimeNG Select), URL query param sync
    - Inject `ActiveOrgService`, use `activeOrganizationId()` for org-scoped API calls
    - "Create User" button (visible when `canMutate()`) opens form dialog
    - Row click navigates to `/admin/users/:userId`
    - Error handling: 403 → forbidden view, 503 → warning + retry, 400 → error message
    - i18n keys under `admin.users.*` namespace
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 13.1, 13.2, 14.2, 14.3, 14.4_

  - [x] 9.2 Implement UserDetailPage
    - Create `features/iam/pages/user-detail/user-detail.component.ts`
    - Fetch user via `GET /api/v1/users/{user_id}`, display full profile
    - Edit form for email, display_name, clearance_level (visible when `canMutate()`)
    - Lifecycle action buttons conditional on user status: active → Deactivate + Lock; locked → Unlock; inactive → none
    - All lifecycle buttons hidden when `canMutate()` is false
    - Delete button with confirmation dialog including audit trail text
    - Informational messages: no org (ADM-044), no roles (ADM-045)
    - Error handling: 404 → not-found with back nav, 400 → error message, 403 → forbidden
    - _Requirements: 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 10.1, 10.3, 10.4, 15.1, 15.2, 20.1, 20.4_

  - [ ]* 9.3 Write property test: Lifecycle action buttons match user status (Property 7)
    - **Property 7: Lifecycle action buttons are conditionally visible based on user status**
    - **Validates: Requirements 3.6**

  - [ ]* 9.4 Write property test: Lifecycle actions call correct endpoint (Property 8)
    - **Property 8: Lifecycle actions call the correct endpoint**
    - **Validates: Requirements 3.7**

  - [ ]* 9.5 Write property test: Mutation controls hidden when canMutate is false (Property 25)
    - **Property 25: Mutation controls are hidden when canMutate is false**
    - Test across UserListPage and UserDetailPage
    - **Validates: Foundational Rule 9**

  - [ ]* 9.6 Write property test: Org-scoped operations use ActiveOrgService (Property 4)
    - **Property 4: Org-scoped operations use ActiveOrgService**
    - Verify user list API calls use `activeOrganizationId` from ActiveOrgService
    - **Validates: Requirements 2.2, 3.3, 8.2, 9.5**

- [x] 10. Organization management pages
  - [x] 10.1 Implement OrganizationListPage
    - Create `features/iam/pages/organization-list/organization-list.component.ts`
    - PrimeNG Table with lazy pagination, columns: name, status, created_at, updated_at
    - "Create Organization" button opens form dialog with bootstrap flow (create org → create/link user → assign Org Owner → send invitation)
    - Row click navigates to `/admin/organizations/:orgId`
    - URL query param sync for pagination
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.10, 4.11_

  - [x] 10.2 Implement OrganizationDetailPage
    - Create `features/iam/pages/organization-detail/organization-detail.component.ts`
    - Fetch org via `GET /api/v1/organizations/{organization_id}`, display details
    - Edit form for name and status
    - Display current Org Owner(s)
    - Delete button with confirmation dialog (handle 409 for orgs with users)
    - "Org Recovery" button visible only to Platform Admin — opens dialog to assign new Org Owner
    - "Transfer Ownership" button visible only to current Org Owner — opens dialog to select target user within same org
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6_

  - [ ]* 10.3 Write property test: Destructive actions require confirmation with audit text (Property 9)
    - **Property 9: Destructive actions require confirmation with audit trail text**
    - **Validates: Requirements 3.9, 20.1**

  - [ ]* 10.4 Write property test: Org Recovery button visibility (Property 22)
    - **Property 22: Org Recovery button visibility is restricted to Platform Admin**
    - **Validates: Requirements 16.1**

  - [ ]* 10.5 Write property test: Ownership transfer target must belong to same org (Property 18)
    - **Property 18: Ownership transfer target must belong to same organization**
    - **Validates: Requirements 19.1, 19.5**

- [x] 11. Checkpoint — User and organization pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Group management pages
  - [x] 12.1 Implement GroupListPage
    - Create `features/iam/pages/group-list/group-list.component.ts`
    - PrimeNG Table with lazy pagination, columns: name, description, version, created_at, updated_at
    - "Create Group" button (visible when `canMutate()`) opens form dialog (name required, description optional)
    - Row click navigates to `/admin/groups/:groupId`
    - _Requirements: 5.1, 5.2, 5.3, 5.13_

  - [x] 12.2 Implement GroupDetailPage with member management
    - Create `features/iam/pages/group-detail/group-detail.component.ts`
    - Fetch group via `GET /api/v1/groups/{group_id}`, display details
    - Edit form for name and description, send `version` for optimistic locking
    - Handle 409 on update: version conflict message with reload button
    - Delete button with version query param, handle 409 (active members)
    - Paginated member list from `GET /api/v1/groups/{group_id}/members`
    - "Add Member" control (subject_id input), handle 409 (duplicate)
    - "Remove" action per member row with confirmation dialog
    - Informational note: group membership does not inherit permissions (ADM-033/035)
    - All mutation controls hidden when `canMutate()` is false
    - _Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 15.4, 15.5_

  - [ ]* 12.3 Write property test: Optimistic locking version included in requests (Property 10)
    - **Property 10: Optimistic locking version is included in update and delete requests**
    - Test Group and Role update/delete requests include version
    - **Validates: Requirements 5.5, 5.7, 6.5, 6.7**

- [x] 13. Role and permission management pages
  - [x] 13.1 Implement RoleListPage
    - Create `features/iam/pages/role-list/role-list.component.ts`
    - PrimeNG Table with lazy pagination, columns: name, type, permission count, version, created_at
    - "Create Role" button (visible when `canMutate()`) opens form dialog
    - Non-Platform-Admin: type field restricted to `service`, disabled
    - Row click navigates to `/admin/roles/:roleId`
    - _Requirements: 6.1, 6.2, 6.3, 6.9, 6.10_

  - [x] 13.2 Implement RoleDetailPage with assignment management
    - Create `features/iam/pages/role-detail/role-detail.component.ts`
    - Fetch role via `GET /api/v1/roles/{role_id}`, display details and permissions
    - Edit form for name, type, permissions list, send `version` for optimistic locking
    - Handle 409 on update/delete
    - Permission editor: add/remove `{ resource_type, action }` pairs
    - Paginated assignment list from `GET /api/v1/roles/{role_id}/assignments`
    - "Assign Role" form: subject_id, scope_type selector, scope_id field
      - Role type `platform` → scope_type locked to `GLOBAL`; type `service` → locked to `ORG`
      - Non-Platform-Admin: `GLOBAL` option hidden, scope_type defaults to `ORG`, scope_id auto-filled from `activeOrganizationId` (read-only)
      - Platform Admin: both `GLOBAL` and `ORG` available
      - `GLOBAL` → scope_id set to null and disabled; `ORG` → scope_id required (auto-filled from active org, read-only)
    - "Revoke" action per assignment row with confirmation dialog
    - Handle 403 (GLOBAL assignment by non-admin), 409 (duplicate), 422 (max roles)
    - All mutation controls hidden when `canMutate()` is false
    - _Requirements: 6.4, 6.5, 6.6, 6.7, 6.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10, 15.3, 18.1, 18.2, 18.3, 18.4, 18.5_

  - [ ]* 13.3 Write property test: Role type determines assignable scope type (Property 11)
    - **Property 11: Role type determines assignable scope type**
    - **Validates: Requirements 18.4**

  - [ ]* 13.4 Write property test: Scope options restricted based on user role (Property 12)
    - **Property 12: Scope options are restricted based on user role**
    - **Validates: Requirements 7.4, 7.5, 7.6, 18.1, 18.2, 18.3**

  - [ ]* 13.5 Write property test: GLOBAL scope implies null scope_id, ORG requires non-null (Property 13)
    - **Property 13: GLOBAL scope implies null scope_id, ORG scope requires non-null scope_id**
    - **Validates: Requirements 7.5, 7.6**

  - [ ]* 13.6 Write property test: ORG-scoped assignment scope_id auto-filled and read-only (Property 28)
    - **Property 28: ORG-scoped role assignment scope_id is auto-filled and read-only**
    - **Validates: Requirements 7.6, 15.3**

  - [ ]* 13.7 Write property test: Non-Platform-Admin cannot create platform-type roles (Property 15)
    - **Property 15: Non-Platform-Admin users cannot create platform-type roles**
    - **Validates: Requirements 6.9**

- [x] 14. Checkpoint — Group and role pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Invitation management and All Users pages
  - [x] 15.1 Implement InvitationListPage
    - Create `features/iam/pages/invitation-list/invitation-list.component.ts`
    - PrimeNG Table with lazy pagination, columns: email, status, invited_by_user_id, expires_at, created_at
    - Status filter (PrimeNG Select): pending, accepted, expired, revoked
    - "Create Invitation" button opens form dialog (email field), handle idempotent response for existing pending invitation
    - "Revoke" action per row: enabled only when status is `pending`, disabled otherwise
    - Confirmation dialog before revoke with audit trail text
    - Handle 422 errors from response body
    - URL query param sync for pagination and status filter
    - Use `activeOrganizationId` as `org_id` path parameter
    - _Requirements: 8.1, 8.2, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10, 8.11, 8.12_

  - [x] 15.2 Implement AllUsersPage
    - Create `features/iam/pages/all-users/all-users.component.ts`
    - PrimeNG Table with lazy pagination, columns: display_name, email, status, organization_id, clearance_level, created_at
    - Filter controls: organization select, status select, text search for name/email
    - Strictly read-only — no create, edit, delete, or lifecycle controls
    - URL query param sync for pagination and filters
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.6, 17.7_

  - [ ]* 15.3 Write property test: Invitation revoke availability matches status (Property 14)
    - **Property 14: Invitation revoke action availability matches invitation status**
    - **Validates: Requirements 8.8, 8.9**

  - [ ]* 15.4 Write property test: All Users Page is strictly read-only (Property 19)
    - **Property 19: All Users Page is strictly read-only**
    - **Validates: Requirements 17.4**

  - [ ]* 15.5 Write property test: Pagination and filter state round-trips through URL (Property 5)
    - **Property 5: Pagination and filter state round-trips through URL query parameters**
    - Test across UserListPage, OrganizationListPage, InvitationListPage, AllUsersPage
    - **Validates: Requirements 2.6, 4.11, 8.12, 17.7**

- [x] 16. Checkpoint — Invitation and All Users pages
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Cross-cutting concerns: error handling, warnings, and i18n
  - [x] 17.1 Implement consistent error handling across all pages
    - Verify all pages follow the HTTP status code → UI pattern mapping from the design
    - 403 → ForbiddenViewComponent, 404 → not-found with back nav, 400/422 → error from body, 409 → conflict message, 503 → warning + retry, 0 → network error + retry
    - Reuse or create shared `ForbiddenViewComponent` in `features/iam/components/forbidden-view/` (or reuse from audit feature if extractable)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 17.2 Implement last Org Owner protection warnings
    - In UserDetailPage: warn before deactivating/deleting last Org Owner
    - In RoleDetailPage: warn before revoking Org Owner role when no other owner exists
    - Display warning with `warn` severity, prevent action
    - In UserDetailPage: include active role/group counts in delete warning
    - _Requirements: 20.2, 20.3, 20.4, 20.5, 20.6, 20.7_

  - [x] 17.3 Create i18n translation keys for the admin namespace
    - Add `admin.*` keys to translation files for all page titles, column headers, button labels, form labels, status values, error messages, confirmation dialogs, and business rule informational messages
    - Include `shell.nav.*` keys for sidebar navigation items
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]* 17.4 Write property test: HTTP error status codes map to correct UI patterns (Property 6)
    - **Property 6: HTTP error status codes map to correct UI patterns**
    - **Validates: Requirements 2.7, 2.8, 3.10, 3.11, 4.9, 5.6, 5.8, 5.12, 6.6, 6.8, 7.8, 7.9, 7.10, 8.10, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6**

  - [ ]* 17.5 Write property test: Last Org Owner protection (Property 17)
    - **Property 17: Last Org Owner protection prevents orphaning**
    - **Validates: Requirements 20.2, 20.3**

  - [ ]* 17.6 Write property test: User deletion warning includes role/group counts (Property 21)
    - **Property 21: User deletion warning includes active role and group counts**
    - **Validates: Requirements 20.4**

  - [ ]* 17.7 Write property test: User missing org or roles triggers informational messages (Property 16)
    - **Property 16: User missing organization or roles triggers informational messages**
    - **Validates: Requirements 15.1, 15.2**

- [x] 18. Data re-fetch on org context switch
  - [x] 18.1 Wire org-scoped pages to re-fetch data on ActiveOrgService context change
    - Add `effect()` or explicit signal subscription in UserListPage, GroupListPage, RoleListPage, InvitationListPage to re-fetch when `activeOrganizationId` changes
    - Ensure stale data from previous org is cleared before new data loads
    - _Requirements: 9.5_

  - [ ]* 18.2 Write property test: Switching org context triggers data re-fetch (Property 27)
    - **Property 27: Switching org context triggers data re-fetch**
    - **Validates: Requirements 9.5**

  - [ ]* 18.3 Write property test: Platform-view pages require Platform Admin role (Property 30)
    - **Property 30: Platform-view pages require null activeOrganizationId or Platform Admin role**
    - **Validates: Requirements 9.2, 17.1**

- [x] 19. Final checkpoint — Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- The existing audit feature (`features/audit/`) is the reference implementation for all patterns
- Requirement 21 (Effective Permissions View) is explicitly marked as future/optional and is excluded from this plan
