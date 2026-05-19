# Implementation Plan: IAM Admin Panel v2

## Overview

Implement the v2 delta for the IAM Admin Panel. All v1 foundation exists (10 page components, 6 services, models, routing, ActiveOrgService, sidebar). This plan covers only the new capabilities: Keycloak-integrated user creation, password reset, UserPickerComponent, group hierarchy, permission catalog, saga-based org operations (bootstrap, recovery, transfer), effective permissions view, enhanced delete warnings, last-owner 409 handling, and i18n additions.

Tasks are organized to handle backend-dependent frontend work (needs endpoints or mocks first) and pure frontend work (can proceed independently). Angular 21, standalone components, signals, PrimeNG 21, TypeScript 5.9 strict, Vitest + fast-check.

## Tasks

- [x] 0. RequestState utility — shared async state management
  - [x] 0.1 Create RequestState utility
    - Create `shared/utils/request-state.ts`
    - Implement `RequestState<T>` interface with `status`, `data`, `error`, `retryable` fields
    - Implement `createRequestState<T>()` factory returning a `WritableSignal<RequestState<T>>` initialized to idle
    - Implement `executeRequest<T>()` that manages the full lifecycle: sets loading, handles success/error, classifies HTTP status codes (403→not retryable, 404→not retryable, 400/422→not retryable with `err.error.detail`, 409→not retryable, 503→retryable, 0→retryable)
    - Implement double-submission guard: if `status === 'loading'`, `executeRequest` is a no-op
    - Implement `resetRequestState<T>()` to reset to idle
    - Implement convenience derived signals: `isLoading()`, `isError()`, `hasData()`
    - Export all types and functions
    - _Design: RequestState utility section_

  - [ ]* 0.2 Write property test: RequestState prevents double-submission
    - **Property 45: RequestState prevents double-submission**
    - Verify that calling `executeRequest()` when status is 'loading' makes no HTTP request and no state change
    - **Validates: Design — RequestState utility**

  - [x] 0.3 Write unit tests for RequestState utility
    - Test idle → loading → success lifecycle
    - Test idle → loading → error lifecycle with each HTTP status classification
    - Test retryable flag for 503 and network errors
    - Test non-retryable flag for 400, 403, 404, 409, 422
    - Test `resetRequestState` returns to idle
    - Test derived signals (`isLoading`, `isError`, `hasData`)

- [x] 1. TypeScript model updates and new service scaffolding
  - [x] 1.1 Update identity model interfaces for v2
    - In `features/iam/models/identity.model.ts`:
    - Replace `external_auth_id` in `CreateUserRequest` with `username: string` and `password: string`
    - Add `ResetPasswordRequest` interface (`temporary_password: string`)
    - Add `BootstrapOrganizationRequest` interface (`org_name`, `owner_username`, `owner_email`, `owner_display_name`, `owner_password`)
    - Add `OrgRecoveryRequest` interface (`target_user_id?: string`, `target_email?: string`)
    - Add `OwnershipTransferRequest` interface (`target_user_id: string`, `revoke_current: boolean`)
    - Add optional `search?: string` to `UserQueryParams`
    - _Requirements: 14.1, 14.7, 14.9_

  - [x] 1.2 Update permission model interfaces for v2
    - In `features/iam/models/permission.model.ts`:
    - Add `parent_group_id: string | null` to `GroupResponse`
    - Add optional `parent_group_id?: string | null` to `GroupCreate` and `GroupUpdate`
    - Add `GroupTreeNode` interface (extends GroupResponse with `children: GroupTreeNode[]`)
    - Add `PermissionCatalogEntry` interface (`resource_type: string`, `actions: string[]`)
    - Add `PermissionCatalogResponse` interface (`entries: PermissionCatalogEntry[]`)
    - Add `EffectivePermissionsRequest` interface (`subject_id: string`)
    - Add `EffectivePermissionEntry`, `PermissionTraceEntry`, `EffectivePermissionsResponse` interfaces
    - _Requirements: 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.10_

  - [ ]* 1.3 Write property test: CreateUserRequest contains username and password, not external_auth_id
    - **Property 31: CreateUserRequest contains username and password, not external_auth_id**
    - Verify constructed request has `username`, `password`, no `external_auth_id`, and `organization_id` equals ActiveOrgService value
    - **Validates: Requirements 1.1, 1.3, 14.1**

- [x] 2. Modify existing services and create new services
  - [x] 2.1 Add new methods to UserService
    - Add `resetPassword(userId: string, body: ResetPasswordRequest): Observable<void>` calling `POST /api/v1/users/{user_id}/reset-password`
    - Ensure `listUsers()` passes optional `search` query parameter from `UserQueryParams`
    - _Requirements: 15.1, 15.2_

  - [x] 2.2 Add new methods to OrganizationService
    - Add `bootstrapOrganization(body, idempotencyKey)` calling `POST /api/v1/organizations/bootstrap` with `Idempotency-Key` header
    - Add `recoverOrganization(orgId, body)` calling `POST /api/v1/organizations/{org_id}/recover`
    - Add `transferOwnership(orgId, body)` calling `POST /api/v1/organizations/{org_id}/transfer-ownership`
    - _Requirements: 15.3, 15.4, 15.5_

  - [x] 2.3 Add getGroupTree to GroupService
    - Add `getGroupTree(): Observable<GroupTreeNode[]>` calling `GET /api/v1/groups/tree`
    - _Requirements: 15.6_

  - [x] 2.4 Create PermissionCatalogService
    - Create `features/iam/services/permission-catalog.service.ts`
    - `@Injectable({ providedIn: 'root' })`, inject `HttpClient`
    - Implement `getCatalog()` with session-level cache (return cached if available, else fetch)
    - Implement `refreshCatalog()` that clears cache and re-fetches
    - Implement `clearCache()` for programmatic use
    - _Requirements: 5.7, 15.7_

  - [x] 2.5 Create EffectivePermissionsService
    - Create `features/iam/services/effective-permissions.service.ts`
    - `@Injectable({ providedIn: 'root' })`, inject `HttpClient`
    - Implement `getEffectivePermissions(body, trace?)` calling `POST /api/v1/authorize/effective-permissions` with optional `trace=true` query param
    - _Requirements: 15.8_

  - [ ]* 2.6 Write property test: v2 API calls use internal user.id, never external_auth_id
    - **Property 32: v2 API calls use internal user.id, never external_auth_id**
    - Verify `resetPassword` and `getEffectivePermissions` use `user.id`, not `external_auth_id`
    - **Validates: Requirements 2.3, 11.4, FR-1**

  - [ ]* 2.7 Write property test: Permission catalog is cached for the session
    - **Property 37: Permission catalog is cached for the session**
    - Verify first call makes HTTP request, subsequent calls return cache, `clearCache()` forces new request
    - **Validates: Requirements 5.7**

- [x] 3. Checkpoint — Models and services
  - Ensure all tests pass, ask the user if questions arise.


- [x] 4. UserPickerComponent — new shared component
  - [x] 4.1 Implement UserPickerComponent
    - Create `features/iam/components/user-picker/user-picker.component.ts`
    - Standalone, `OnPush`, uses PrimeNG `AutoComplete`
    - `userSelected` output emitting internal `user.id` (FR-1)
    - `organizationId` input (optional, defaults to `ActiveOrgService.activeOrganizationId()`)
    - `placeholder` input (i18n key, default `admin.userPicker.placeholder`)
    - Internal RxJS pipeline: `filter(≥2 chars) → debounceTime(300) → distinctUntilChanged() → switchMap(listUsers with search param)`
    - Display `display_name` and `email` in suggestion dropdown
    - i18n keys: `admin.userPicker.placeholder`, `admin.userPicker.noResults`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.8, 3.9_

  - [ ]* 4.2 Write property test: UserPicker triggers search only when input length ≥ 2
    - **Property 33: UserPicker triggers search only when input length ≥ 2**
    - **Validates: Requirements 3.3**

  - [ ]* 4.3 Write property test: UserPicker emits internal user.id on selection
    - **Property 34: UserPicker emits internal user.id on selection**
    - **Validates: Requirements 3.5, FR-1**

  - [ ]* 4.4 Write property test: UserPicker scopes search to current organization
    - **Property 35: UserPicker scopes search to current organization**
    - **Validates: Requirements 3.8**

  - [ ]* 4.5 Write property test: UserPicker cancels stale requests (debounce + switchMap)
    - **Property 42: UserPicker cancels stale requests (debounce + switchMap)**
    - Verify only the latest query result is rendered, previous in-flight requests are cancelled
    - **Validates: Requirements 3.3**

- [x] 5. Checkpoint — UserPickerComponent
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. UserListPage — v2 create dialog changes
  - [x] 6.1 Update UserListPage create dialog
    - Replace `external_auth_id` text input with `username` (`pInputText`, required) and `password` (`pInputText` type="password", required) fields
    - Remove `external_auth_id` field entirely from template and `createForm` state
    - Update `onCreateUser()` to construct v2 `CreateUserRequest` with `username` + `password`
    - Continue pre-filling `organization_id` from `ActiveOrgService`
    - No client-side password policy validation (delegated to Keycloak)
    - Handle HTTP 422: display `err.error.detail` (Keycloak errors: duplicate username, policy violation)
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 7. UserDetailPage — v2 additions
  - [x] 7.1 Add Reset Password action
    - Add "Reset Password" button visible when `canMutate()` is true
    - Open dialog with `temporary_password` field (type="password")
    - Dialog includes audit trail text: `admin.users.detail.resetPassword.auditHint`
    - Call `UserService.resetPassword(userId, { temporary_password })` where `userId` is internal `user.id`
    - Handle 404 (user not found), 422 (password policy violation) — display `err.error.detail`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 7.2 Add enhanced delete warning with role/group counts
    - Before showing delete confirmation, fetch role count via `RoleService.listAssignments()` (limit=1 for `total_count`) and group count via `GroupService.listMembers()` (limit=1 for `total_count`)
    - Display counts in confirmation: `admin.users.detail.deleteWarning` with `{roleCount}` and `{groupCount}` interpolation
    - If both counts are 0, show standard confirmation without counts
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 7.3 Add last-owner 409 handling
    - When deactivate/delete/lock returns HTTP 409, display `err.error.detail` message from backend (last-owner protection)
    - _Requirements: 9.1, 9.2_

  - [x] 7.4 Add Effective Permissions section
    - Read-only section below user profile
    - Call `EffectivePermissionsService.getEffectivePermissions({ subject_id: user.id })` on load
    - Display permission summary as `resource_type:action` chips (same style as RoleDetailPage)
    - "Show Trace" toggle — re-fetches with `trace=true`, displays `evaluation_trace` in collapsible panel
    - Handle 403/503 gracefully: show "Effective permissions unavailable" without blocking page
    - i18n keys under `admin.users.detail.effectivePermissions.*`
    - _Requirements: 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [ ]* 7.5 Write property test: User delete warning includes role and group counts
    - **Property 39: User delete warning includes role and group counts**
    - **Validates: Requirements 10.1, 10.2, 10.3**

  - [ ]* 7.6 Write property test: Effective permissions summary displays all returned permissions
    - **Property 40: Effective permissions summary displays all returned permissions**
    - **Validates: Requirements 11.5**

  - [ ]* 7.7 Write property test: Trace toggle sends trace=true query parameter
    - **Property 41: Trace toggle sends trace=true query parameter**
    - **Validates: Requirements 11.6**

- [x] 8. Checkpoint — User pages v2
  - Ensure all tests pass, ask the user if questions arise.


- [x] 9. OrganizationListPage — bootstrap dialog
  - [x] 9.1 Replace create dialog with bootstrap flow
    - Replace existing "Create Organization" dialog (name + status) with bootstrap dialog
    - Fields: `org_name`, `owner_username`, `owner_email`, `owner_display_name`, `owner_password` (type="password")
    - On submit: generate UUID as `Idempotency-Key`, call `OrganizationService.bootstrapOrganization(body, idempotencyKey)`
    - Store idempotency key in component state for retry
    - Retry UX: on network error (status 0) or 503, keep dialog open with "Retry" button reusing same key; on 422 (saga failure), display error but no retry (generate new key on fresh dialog or data change)
    - Handle 422: display `err.error.detail` including which saga step failed
    - Dialog includes audit trail text
    - _Requirements: 6.8, 6.9, 6.10, 6.11_

  - [ ]* 9.2 Write property test: Bootstrap call includes Idempotency-Key header
    - **Property 38: Bootstrap call includes Idempotency-Key header**
    - Verify HTTP request includes non-empty UUID `Idempotency-Key` header
    - **Validates: Requirements 6.9**

  - [ ]* 9.3 Write property test: Bootstrap retry reuses same Idempotency-Key
    - **Property 44: Bootstrap retry reuses same Idempotency-Key**
    - Verify retry on network/503 reuses same key; fresh dialog generates new key
    - **Validates: Requirements 6.7, 6.9**

- [x] 10. OrganizationDetailPage — recovery and transfer via saga endpoints
  - [x] 10.1 Update recovery dialog to use UserPicker and saga endpoint
    - Replace raw text input with `UserPickerComponent` scoped to target organization's users
    - On confirm: call `OrganizationService.recoverOrganization(orgId, { target_user_id: selectedUserId })` instead of direct `roleService.assignRole()`
    - Handle 422: display saga step failure message from `err.error.detail`
    - Update dialog text to clearly state this is an administrative override and current owner's role will be revoked
    - _Requirements: 7.5, 7.6, 7.7, 7.8_

  - [x] 10.2 Update transfer dialog to use UserPicker and saga endpoint
    - Replace raw `subject_id` text input with `UserPickerComponent` scoped to active users in current org
    - Add checkbox: "Revoke my ownership after transfer" (`revoke_current`), default unchecked, i18n-translated
    - On confirm: call `OrganizationService.transferOwnership(orgId, { target_user_id, revoke_current })` instead of direct `roleService.assignRole()`
    - Handle 403: display "Only the current Org Owner can transfer ownership"
    - Handle 422: display saga step failure message from `err.error.detail`
    - _Requirements: 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

- [x] 11. GroupListPage — tree view and parent selector
  - [x] 11.1 Replace flat table with TreeTable
    - On load, call `GroupService.getGroupTree()` to get hierarchical data
    - Display as PrimeNG TreeTable with expandable nodes
    - Each node shows: name, description, version, created_at
    - Tooltip on each node: `admin.groups.list.hierarchyTooltip` ("Organizational grouping — permissions are not inherited")
    - Fallback: if `getGroupTree()` returns 503, fall back to flat table with `listGroups()`
    - _Requirements: 4.5, 4.6, 4.9_

  - [x] 11.2 Add parent group selector to create dialog
    - Add optional "Parent Group" PrimeNG Select populated from flat group list
    - Include `parent_group_id` in `GroupCreate` request body
    - _Requirements: 4.2_

  - [ ]* 11.3 Write property test: Group parent selector excludes self and descendants
    - **Property 43: Group parent selector excludes self and descendants**
    - For edit form: verify current group and all descendants are excluded from options
    - For create dialog: no filtering needed (no ID yet)
    - **Validates: Requirements 4.10**

- [x] 12. GroupDetailPage — hierarchy display and UserPicker
  - [x] 12.1 Add hierarchy display and parent selector
    - Display parent group name with navigation link (if `parent_group_id` is set)
    - Display child groups list with navigation links
    - Add "Parent Group" PrimeNG Select in edit form with UI-side cycle prevention (exclude self and descendants)
    - Handle 422 for circular reference violations from backend
    - _Requirements: 4.3, 4.7, 4.10, 4.11_

  - [x] 12.2 Replace raw subject_id input with UserPicker for members
    - Replace raw `subject_id` text input in "Add Member" with `UserPickerComponent`
    - Send emitted `user.id` as `subject_id` to Permission_Service
    - _Requirements: 3.6_

  - [x] 12.3 Upgrade no-inheritance banner to warn severity
    - Change the ADM-033/035 informational message from `info` to `warn` severity per Req 4.8
    - Ensure banner is prominent and persistent at top of page
    - _Requirements: 4.8_

- [x] 13. Checkpoint — Organization and group pages v2
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. RoleDetailPage — catalog dropdowns and UserPicker
  - [x] 14.1 Replace free-text permission inputs with catalog dropdowns
    - On page load, fetch catalog via `PermissionCatalogService.getCatalog()`
    - Replace `resource_type` text input with PrimeNG Select populated from catalog entries
    - Replace `action` text input with PrimeNG Select filtered by selected `resource_type`
    - When `resource_type` changes, reset `action` and update action options
    - Add "Refresh Catalog" icon button next to permission editor header calling `PermissionCatalogService.refreshCatalog()`
    - Fallback: if catalog 503, show warning + retry button and fall back to free-text inputs
    - _Requirements: 5.2, 5.3, 5.4, 5.6_

  - [x] 14.2 Replace raw subject_id input with UserPicker for assignments
    - Replace raw `subject_id` text input in "Assign Role" form with `UserPickerComponent`
    - Send emitted `user.id` as `subject_id` to Permission_Service
    - _Requirements: 3.7_

  - [x] 14.3 Add last-owner 409 handling for role revocation
    - When role revocation returns HTTP 409, display `err.error.detail` from backend (last-owner protection)
    - _Requirements: 9.3_

  - [ ]* 14.4 Write property test: Catalog action dropdown is filtered by selected resource_type
    - **Property 36: Catalog action dropdown is filtered by selected resource_type**
    - Verify action options match exactly the actions for the selected resource_type; action cleared on resource_type change if invalid
    - **Validates: Requirements 5.4**

- [x] 15. RoleListPage — catalog dropdowns in create dialog
  - [x] 15.1 Add catalog-driven dropdowns to create role dialog
    - Same catalog-driven PrimeNG Select dropdowns as RoleDetailPage for permission entry in "Create Role" dialog
    - Fetch catalog on dialog open, apply same resource_type → action filtering
    - Same 503 fallback to free-text
    - _Requirements: 5.5_

- [x] 16. Checkpoint — Role pages v2
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. i18n — add v2 translation keys
  - [x] 17.1 Add v2 translation keys to en.json and pt-BR.json
    - Add keys for: password reset dialog, UserPicker placeholder/noResults, permission catalog labels, group hierarchy labels (parent group, child groups), hierarchy banner and tooltips, bootstrap dialog fields, recovery dialog fields, transfer dialog fields (including revoke checkbox), effective permissions section (summary + trace toggle), all new error messages, last-owner 409 messages
    - Verify no raw i18n key strings are displayed
    - _Requirements: 12.1, 12.2, 12.3_

- [x] 18. Final checkpoint — Full v2 integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (31–44) from the v2 design document using fast-check
- All v1 foundation (routing, ActiveOrgService, sidebar, 10 pages, 6 services) is assumed complete
- Backend-dependent tasks (7.1, 7.4, 9.1, 10.1, 10.2, 11.1) require corresponding backend endpoints or mocks before implementation
- Pure frontend tasks (0.x, 1.x, 4.1, 6.1, 12.3, 17.1) can proceed independently
- All v2 async operations in page modifications (tasks 6–15) should use `RequestState<T>` from task 0 instead of ad-hoc boolean signals
- Requirement 13 (cross-repo coordination) is addressed by task ordering — model/service tasks first, then page modifications
