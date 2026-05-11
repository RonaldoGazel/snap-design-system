# Requirements Document

## Introduction

This document specifies the requirements for the IAM Admin Panel v2 feature, a cross-repository enhancement to the existing IAM Admin Panel (v1) in the platform-frontend Angular application. The v1 spec (`iam-admin-panel`) built the foundation: routing, ActiveOrgService, all 10 page components, sidebar integration, services, and models. During integration testing, several gaps were identified that require backend API changes, Keycloak Admin API integration, and significant frontend rework.

The v2 scope addresses five design goals:

1. Hide Keycloak from the UI — user creation flows through identity-service, which manages Keycloak Admin API interactions.
2. Make identity-service the source of truth for user lifecycle (creation, password management).
3. Standardize identifiers — replace raw `external_auth_id` / `subject_id` inputs with user search and selection.
4. Treat permissions as governed data — introduce a permission catalog to replace free-text resource_type/action inputs.
5. Separate organizational structure (groups with hierarchy) from authorization (roles), per ADM-031/032/033.

This spec spans three repositories:
- **platform-frontend** (Angular 21): UI changes, new components, updated forms and dialogs.
- **identity-service** (Python/FastAPI): Keycloak Admin API integration, user creation flow, password reset, user search.
- **permission-service** (Python/FastAPI): Group hierarchy, permission catalog endpoint.

The frontend remains strictly a consumption layer. All authorization enforcement happens backend-side (ADM-051). Backend schema changes referenced in this document require separate human approval before implementation.

### Foundational Rules

#### FR-1: Identifier Boundary Rule

The system enforces a strict identifier boundary between the UI layer and external identity providers. The internal `user.id` (UUID assigned by the Identity_Service) is the canonical identifier used across all UI components, frontend services, and inter-service API calls. The `external_auth_id` (Keycloak `sub`) is an internal implementation detail of the Identity_Service and MUST NOT leak into the frontend or into other services' API contracts.

| Layer | Identifier Used | Notes |
|-------|----------------|-------|
| UI components / Angular services | `user.id` (internal UUID) | All user references use the internal ID |
| Identity_Service internal | `external_auth_id` (Keycloak `sub`) | Used only for Keycloak Admin API calls |
| Permission_Service `subject_id` | `user.id` (internal UUID) | Breaking change from v1 where `subject_id` was Keycloak `sub` |
| Inter-service calls | `user.id` (internal UUID) | Identity_Service resolves to `external_auth_id` when calling Keycloak |

This is a breaking change to the Permission_Service API contract. Since the system is in development with no production data, this change is acceptable. All existing role assignments and group memberships that reference Keycloak `sub` values as `subject_id` must be migrated to use internal `user.id` values.

#### FR-2: Cross-Service Consistency Model (Saga Pattern)

Operations that span multiple services (Keycloak, Identity_Service DB, Permission_Service DB) cannot achieve ACID atomicity. These operations use a saga pattern with explicit compensating transactions. Each multi-step flow defines:
- The ordered sequence of steps
- The compensating action for each step if a subsequent step fails
- The final error response indicating which step failed and what was rolled back

The system accepts eventual consistency during the compensation window. Idempotent retries are the primary recovery mechanism for transient failures.

#### FR-3: Audit SDK Usage

All new v2 backend endpoints that perform mutations (create, update, delete, lifecycle actions) MUST use the audit-sdk for mutation tracking, consistent with existing v1 patterns. This applies to both Identity_Service and Permission_Service endpoints introduced in this spec.

### Relationship to v1

This spec builds on top of the completed v1 implementation. All v1 requirements remain in effect. This document specifies only the delta — new capabilities, modified behaviors, and gap closures. Where a v2 requirement modifies a v1 requirement, the v1 requirement number is referenced explicitly.

### Infrastructure Prerequisites

Two infrastructure prerequisites must be satisfied before v2 implementation begins:

1. **Keycloak Admin API access for identity-service**: The identity-service Keycloak client needs the `realm-management` role (or a dedicated admin service account). Environment variables `KEYCLOAK_ADMIN_CLIENT_ID` and `KEYCLOAK_ADMIN_CLIENT_SECRET` must be configured in platform-runtime.
2. **Permission catalog definition**: The set of valid `resource_type` and `action` values must be defined as part of the governance process in CentralRepo and seeded into the permission-service database.
3. **Permission_Service subject_id migration**: Existing role assignments and group memberships must be migrated from Keycloak `sub` to internal `user.id` as `subject_id`, per FR-1.

## Glossary

- **Identity_Service**: The backend microservice at `identityServiceUrl` responsible for user CRUD, organization CRUD, invitation lifecycle, clearance levels, identity resolution, and Keycloak Admin API interactions. The Identity_Service is the only service that holds the mapping between internal `user.id` and `external_auth_id` (Keycloak `sub`).
- **Permission_Service**: The backend microservice at `permissionServiceUrl` responsible for role CRUD, role assignments, group CRUD, group membership, permission catalog, and authorization evaluation. The Permission_Service uses internal `user.id` as `subject_id` in all API contracts (per FR-1).
- **Keycloak_Admin_API**: The Keycloak REST API used by the Identity_Service to create users, set passwords, and manage authentication credentials in the Keycloak realm. The frontend never calls this API directly.
- **User_Picker_Component**: A reusable Angular standalone component providing search-as-you-type user selection, backed by `GET /api/v1/users?search=<query>` on the Identity_Service. Emits the selected user's internal `user.id`.
- **Permission_Catalog**: A governed registry of valid `resource_type` and `action` pairs maintained in the Permission_Service, exposed via `GET /api/v1/permissions/catalog`.
- **Group_Hierarchy**: A parent-child relationship between groups, where each group has an optional `parent_group_id` referencing another group. Per ADM-033, child groups do not inherit permissions from parent groups. The hierarchy represents organizational structure only, not an authorization hierarchy.
- **Org_Recovery_Endpoint**: A dedicated backend endpoint `POST /api/v1/organizations/{org_id}/recover` on the Identity_Service that executes a saga to validate the target user, remove the old Org_Owner role, assign the new Org_Owner role, and record an audit event, with compensating transactions on failure.
- **Ownership_Transfer_Endpoint**: A dedicated backend endpoint `POST /api/v1/organizations/{org_id}/transfer-ownership` on the Identity_Service that executes a saga to verify the current owner, verify the target user belongs to the same org, assign Org_Owner to the target, optionally revoke from the current owner, and record an audit event, with compensating transactions on failure.
- **Bootstrap_Endpoint**: A dedicated backend endpoint `POST /api/v1/organizations/bootstrap` on the Identity_Service that executes a saga to create an organization, create or link the initial user, assign the Org_Owner role, and send an invitation, with compensating transactions on failure. Supports idempotent retries via `Idempotency-Key` header.
- **Effective_Permissions_Endpoint**: A dedicated backend endpoint `POST /api/v1/authorize/effective-permissions` on the Permission_Service that returns a user's full resolved permission set, accepting internal `user.id` as `subject_id`.
- **Effective_Permissions_View**: A read-only UI section on the User_Detail_Page showing the user's resolved permissions via the Effective_Permissions_Endpoint, with an optional trace view for debugging.
- **Subject**: An abstract identity reference used by the Permission_Service, defined as `{ type: "user" | "service_account", id: "<internal_id>" }`. For v2, only `type: "user"` is implemented; `service_account` is reserved for future use (API keys, bots).
- **Saga**: A sequence of local transactions across multiple services where each step has a defined compensating action. Used for cross-service operations that cannot be ACID atomic.
- **Compensating_Transaction**: A rollback action executed when a saga step fails, undoing the effects of previously completed steps in reverse order.
- **Platform_Admin**: A user holding the `platform-admin` role with GLOBAL scope, as defined in v1.
- **Org_Admin**: A user holding the `org-admin` role scoped to a specific organization, as defined in v1.
- **Org_Owner**: A special Org_Admin role that cannot be removed unless another owner exists or a Platform_Admin performs an org recovery override, as defined in v1.
- **IAM_Panel**: The Identity and Access Management Admin Panel feature within the platform-frontend application, as defined in v1.
- **User_Detail_Page**: The page component that displays and allows editing of a single user's profile, status, and organizational linkage, as defined in v1.
- **User_List_Page**: The page component that displays a paginated, filterable table of users scoped to the current organization context, as defined in v1.
- **Organization_Detail_Page**: The page component that displays and allows editing of a single organization's details, as defined in v1.
- **Group_Detail_Page**: The page component that displays group details and manages group membership, as defined in v1.
- **Group_List_Page**: The page component that displays a paginated table of groups, as defined in v1.
- **Role_Detail_Page**: The page component that displays role details, permissions, and manages role assignments, as defined in v1.

## Requirements

### Requirement 1: User Creation via Keycloak Admin API

**User Story:** As an org-admin, I want to create users by providing a username, email, display name, password, and clearance level, so that I do not need to manually create users in Keycloak and copy internal UUIDs.

#### Acceptance Criteria

1. WHEN the Org_Admin submits the "Create User" form, THE Identity_Service SHALL accept a request containing `username`, `email`, `display_name`, `password`, and `clearance_level` fields (without `external_auth_id`).
2. WHEN the Identity_Service receives a user creation request, THE Identity_Service SHALL create the user in Keycloak via the Keycloak_Admin_API, retrieve the Keycloak `sub` identifier, and create the local user record with that `sub` as `external_auth_id`. The returned response SHALL contain only the internal `user.id`, per FR-1.
3. THE User_List_Page SHALL replace the `external_auth_id` text input in the "Create User" dialog with `username` and `password` fields.
4. THE User_List_Page SHALL enforce that the `password` field uses a password input type (masked characters) and is required for user creation.
5. THE Identity_Service SHALL delegate password policy enforcement to Keycloak — the frontend SHALL NOT implement client-side password policy validation beyond requiring a non-empty value.
6. IF the Keycloak_Admin_API returns an error during user creation (duplicate username, policy violation), THEN THE Identity_Service SHALL return an HTTP 422 response with a descriptive error message, and THE User_List_Page SHALL display that error message.
7. THE User_List_Page SHALL continue to pre-fill `organization_id` from the ActiveOrgService context, consistent with v1 Requirement 3.3.

### Requirement 2: Password Management

**User Story:** As an org-admin, I want to reset a user's password from the User Detail page, so that I can help users who are locked out without accessing Keycloak directly.

#### Acceptance Criteria

1. THE User_Detail_Page SHALL display a "Reset Password" action button, visible when the ActiveOrgService `canMutate()` signal returns true.
2. WHEN the Org_Admin triggers the "Reset Password" action, THE IAM_Panel SHALL open a form dialog requiring a new temporary password.
3. WHEN the password reset is confirmed, THE User_Detail_Page SHALL call `POST /api/v1/users/{user_id}/reset-password` on the Identity_Service with the temporary password, where `user_id` is the internal `user.id`.
4. WHEN the Identity_Service receives a password reset request, THE Identity_Service SHALL resolve the internal `user.id` to the `external_auth_id`, then call the Keycloak_Admin_API to set the temporary password and mark the user as requiring a password change on next login.
5. IF the Identity_Service returns HTTP 404 for the password reset request, THEN THE User_Detail_Page SHALL display a "user not found" error message.
6. IF the Identity_Service returns HTTP 422 for the password reset request (password policy violation), THEN THE User_Detail_Page SHALL display the error message from the response body.
7. THE "Reset Password" confirmation dialog SHALL include the i18n-translated text "This action will be recorded in the audit trail."

### Requirement 3: User Picker Component

**User Story:** As an org-admin, I want to search and select users by name or email when adding group members or assigning roles, so that I do not need to know or type raw Keycloak UUIDs.

#### Acceptance Criteria

1. THE IAM_Panel SHALL provide a reusable User_Picker_Component (Angular standalone component, `OnPush` change detection) that provides search-as-you-type user selection.
2. THE User_Picker_Component SHALL use a PrimeNG AutoComplete component, displaying user `display_name` and `email` in the suggestion list.
3. WHEN the user types at least 2 characters in the User_Picker_Component, THE User_Picker_Component SHALL call `GET /api/v1/users` on the Identity_Service with a `search` query parameter containing the typed text.
4. THE Identity_Service SHALL support a `search` query parameter on `GET /api/v1/users` that filters users by partial match on `display_name` or `email`.
5. WHEN the user selects a suggestion, THE User_Picker_Component SHALL emit the selected user's internal `user.id` as the output value. The UI layer SHALL NOT use `external_auth_id` for any purpose, per FR-1.
6. THE Group_Detail_Page SHALL replace the raw `subject_id` text input in the "Add Member" control with the User_Picker_Component, sending the emitted `user.id` as `subject_id` to the Permission_Service.
7. THE Role_Detail_Page SHALL replace the raw `subject_id` text input in the "Assign Role" form with the User_Picker_Component, sending the emitted `user.id` as `subject_id` to the Permission_Service.
8. THE User_Picker_Component SHALL scope the user search to the current organization via the `organization_id` parameter from ActiveOrgService, consistent with v1 Requirement 9.5.
9. THE User_Picker_Component SHALL use i18n translation keys for the placeholder text and "no results" message.

### Requirement 4: Group Hierarchy

**User Story:** As an org-admin, I want to organize groups into a parent-child hierarchy, so that I can model the organizational structure of sectors and sub-sectors per ADM-031.

#### Acceptance Criteria

1. THE Permission_Service groups table SHALL support an optional `parent_group_id` column (nullable foreign key referencing the same table), enabling parent-child relationships between groups.
2. WHEN creating a group, THE Group_List_Page SHALL provide an optional "Parent Group" selector (PrimeNG Select) populated from the existing groups list, allowing the Org_Admin to place the new group under a parent.
3. WHEN updating a group, THE Group_Detail_Page SHALL allow changing the parent group via a "Parent Group" selector.
4. THE Permission_Service `GroupCreate` and `GroupUpdate` schemas SHALL accept an optional `parent_group_id` field.
5. THE Permission_Service SHALL provide a `GET /api/v1/groups/tree` endpoint that returns groups structured as a tree (each node includes its children), enabling the frontend to render the hierarchy.
6. THE Group_List_Page SHALL display groups as a tree structure (PrimeNG TreeTable or nested list) instead of a flat table, showing the parent-child relationships.
7. THE Group_Detail_Page SHALL display the parent group name (with a navigation link) and list child groups when they exist.
8. THE Group_Detail_Page SHALL display a prominent, persistent banner (PrimeNG Message component with `warn` severity) stating that groups represent organizational structure only and child groups do not inherit permissions from parent groups, per ADM-033 and ADM-035. This banner SHALL be visible at the top of the page, not as a dismissible tooltip or footnote.
9. THE Group_List_Page tree view SHALL display a tooltip on each tree node clarifying that the hierarchy is organizational, not authorization-based (e.g., "Organizational grouping — permissions are not inherited").
10. THE Permission_Service SHALL reject group hierarchy operations that would create circular references (a group cannot be its own ancestor), returning HTTP 422 with a descriptive error message.
11. IF the Permission_Service returns HTTP 422 for a circular reference violation, THEN THE Group_Detail_Page SHALL display the error message from the response body.

### Requirement 5: Permission Catalog

**User Story:** As an org-admin, I want to select permissions from a governed catalog when creating or editing roles, so that I do not need to manually type resource_type and action values and risk typos or invalid combinations.

#### Acceptance Criteria

1. THE Permission_Service SHALL provide a `GET /api/v1/permissions/catalog` endpoint that returns the list of valid `resource_type` values and, for each resource_type, the list of valid `action` values.
2. THE Role_Detail_Page SHALL replace the free-text `resource_type` and `action` inputs in the permission editor with PrimeNG Select or AutoComplete components populated from the Permission_Catalog.
3. WHEN the Role_Detail_Page loads the permission editor (for create or edit), THE Role_Detail_Page SHALL fetch the Permission_Catalog from `GET /api/v1/permissions/catalog` and populate the dropdown options.
4. WHEN the Org_Admin selects a `resource_type`, THE Role_Detail_Page SHALL filter the `action` dropdown to show only actions valid for the selected resource_type.
5. THE Role_List_Page "Create Role" dialog SHALL use the same catalog-driven dropdowns for permission entry.
6. IF the Permission_Service returns HTTP 503 when fetching the catalog, THEN THE Role_Detail_Page SHALL display a warning message with a retry button and fall back to free-text inputs until the catalog loads.
7. THE Permission_Catalog endpoint SHALL be cacheable — the frontend MAY cache the catalog response for the duration of the browser session.

### Requirement 6: Organization Bootstrap Flow

**User Story:** As a platform-admin, I want to create an organization with a single action that also creates the initial owner user and sends an invitation, so that the full bootstrap sequence is consistent and recoverable.

#### Acceptance Criteria

1. THE Identity_Service SHALL provide a `POST /api/v1/organizations/bootstrap` endpoint (Bootstrap_Endpoint) that accepts: organization name, initial owner email, initial owner display name, initial owner username, initial owner password, and an `Idempotency-Key` request header.
2. WHEN the Bootstrap_Endpoint is called, THE Identity_Service SHALL execute the following saga steps in order: (a) create the organization in the Identity_Service DB, (b) create the initial user in Keycloak via the Keycloak_Admin_API, (c) create the local user record linked to the new organization in the Identity_Service DB, (d) assign the Org_Owner role to the initial user via the Permission_Service (using internal `user.id` as `subject_id`, per FR-1), and (e) send an invitation to the initial owner's email.
3. IF step (b) fails (Keycloak user creation), THEN THE Identity_Service SHALL execute compensating transactions: roll back the organization created in step (a), and return HTTP 422 with a descriptive error message indicating Keycloak user creation failed.
4. IF step (c) fails (local user record creation), THEN THE Identity_Service SHALL execute compensating transactions: delete the Keycloak user created in step (b), roll back the organization created in step (a), and return HTTP 422 with a descriptive error message indicating local user creation failed.
5. IF step (d) fails (role assignment), THEN THE Identity_Service SHALL execute compensating transactions: delete the local user record created in step (c), delete the Keycloak user created in step (b), roll back the organization created in step (a), and return HTTP 422 with a descriptive error message indicating role assignment failed.
6. IF step (e) fails (invitation), THEN THE Identity_Service SHALL execute compensating transactions: revoke the Org_Owner role assigned in step (d), delete the local user record created in step (c), delete the Keycloak user created in step (b), roll back the organization created in step (a), and return HTTP 422 with a descriptive error message indicating invitation sending failed.
7. WHEN the Bootstrap_Endpoint receives a request with an `Idempotency-Key` header value that matches a previously completed bootstrap request, THE Identity_Service SHALL return the result of the original operation (HTTP 200 with the original response body) without re-executing the saga.
8. THE Organization_List_Page "Create Organization" dialog SHALL collect: organization name, initial owner username, initial owner email, initial owner display name, and initial owner password.
9. WHEN the Platform_Admin submits the "Create Organization" dialog, THE Organization_List_Page SHALL call the Bootstrap_Endpoint with a generated `Idempotency-Key` header, instead of the individual `POST /api/v1/organizations` endpoint.
10. IF the Bootstrap_Endpoint returns HTTP 422, THEN THE Organization_List_Page SHALL display the error message from the response body, including which saga step failed.
11. THE "Create Organization" confirmation dialog SHALL include the i18n-translated text "This action will be recorded in the audit trail."

### Requirement 7: Organization Recovery Flow

**User Story:** As a platform-admin, I want to perform a full organization recovery that validates the target user, removes the old owner, and assigns the new owner through a coordinated saga, so that the recovery is consistent and fully auditable.

#### Acceptance Criteria

1. THE Identity_Service SHALL provide a `POST /api/v1/organizations/{org_id}/recover` endpoint (Org_Recovery_Endpoint) that accepts a `target_user_id` (internal `user.id`) or `target_email`.
2. WHEN the Org_Recovery_Endpoint is called, THE Identity_Service SHALL execute the following saga steps in order: (a) validate the target user exists and has `active` status, (b) identify the current (unavailable) Org_Owner and revoke the Org_Owner role via the Permission_Service (using internal `user.id` as `subject_id`), (c) assign the Org_Owner role to the target user via the Permission_Service (using internal `user.id` as `subject_id`), and (d) emit an audit event recording the recovery action.
3. IF step (c) fails (new owner role assignment), THEN THE Identity_Service SHALL execute compensating transactions: re-assign the Org_Owner role to the previous owner revoked in step (b), and return HTTP 422 with a descriptive error message indicating role assignment to the new owner failed.
4. IF the target user does not exist or is not active (step (a) validation fails), THEN THE Org_Recovery_Endpoint SHALL return HTTP 422 with a descriptive error message.
5. THE Organization_Detail_Page "Org Recovery" dialog SHALL replace the raw text input with the User_Picker_Component, scoped to users within the target organization.
6. WHEN the Platform_Admin confirms the recovery, THE Organization_Detail_Page SHALL call the Org_Recovery_Endpoint instead of directly calling `POST /api/v1/roles/{role_id}/assignments`.
7. IF the Org_Recovery_Endpoint returns HTTP 422, THEN THE Organization_Detail_Page SHALL display the error message from the response body, including which saga step failed.
8. THE "Org Recovery" confirmation dialog SHALL clearly state that this is an administrative override action and that the current owner's role will be revoked.

### Requirement 8: Ownership Transfer Flow

**User Story:** As an org-owner, I want to transfer ownership to another user in my organization through a coordinated saga that verifies eligibility and optionally revokes my own ownership, so that the transfer is safe and auditable.

#### Acceptance Criteria

1. THE Identity_Service SHALL provide a `POST /api/v1/organizations/{org_id}/transfer-ownership` endpoint (Ownership_Transfer_Endpoint) that accepts `target_user_id` (internal `user.id`) and an optional `revoke_current` boolean flag.
2. WHEN the Ownership_Transfer_Endpoint is called, THE Identity_Service SHALL execute the following saga steps in order: (a) verify the requesting user currently holds the Org_Owner role for the organization, (b) verify the target user belongs to the same organization and has `active` status, (c) assign the Org_Owner role to the target user via the Permission_Service (using internal `user.id` as `subject_id`), and (d) if `revoke_current` is true, revoke the Org_Owner role from the requesting user via the Permission_Service.
3. IF step (d) fails (revoking current owner), THEN THE Identity_Service SHALL execute compensating transactions: revoke the Org_Owner role from the target user assigned in step (c), and return HTTP 422 with a descriptive error message indicating the revocation of the current owner failed.
4. IF the target user does not belong to the same organization, THEN THE Ownership_Transfer_Endpoint SHALL return HTTP 422 with a descriptive error message.
5. IF the requesting user does not hold the Org_Owner role, THEN THE Ownership_Transfer_Endpoint SHALL return HTTP 403.
6. THE Organization_Detail_Page "Transfer Ownership" dialog SHALL replace the raw `subject_id` text input with the User_Picker_Component, scoped to active users within the current organization.
7. THE "Transfer Ownership" dialog SHALL include a checkbox labeled "Revoke my ownership after transfer" (i18n-translated), defaulting to unchecked.
8. WHEN the Org_Owner confirms the transfer, THE Organization_Detail_Page SHALL call the Ownership_Transfer_Endpoint instead of directly calling `POST /api/v1/roles/{role_id}/assignments`.
9. IF the Ownership_Transfer_Endpoint returns HTTP 403, THEN THE Organization_Detail_Page SHALL display an error message indicating only the current Org_Owner can transfer ownership.
10. IF the Ownership_Transfer_Endpoint returns HTTP 422, THEN THE Organization_Detail_Page SHALL display the error message from the response body, including which saga step failed.

### Requirement 9: Last Org Owner Backend Protection

**User Story:** As a platform architect, I want the backend to reject operations that would remove the last Org_Owner from an organization, so that organizations cannot be orphaned regardless of frontend behavior.

#### Acceptance Criteria

1. WHEN a user deactivation, user deletion, or role revocation request would result in an organization having zero Org_Owners, THE Identity_Service or Permission_Service SHALL reject the request with HTTP 409 and a descriptive error message indicating the last owner cannot be removed.
2. THE User_Detail_Page SHALL display the HTTP 409 error message from the response body when a lifecycle action is rejected due to last-owner protection.
3. THE Role_Detail_Page SHALL display the HTTP 409 error message from the response body when a role revocation is rejected due to last-owner protection.
4. THE IAM_Panel SHALL continue to display client-side warnings before these actions (per v1 Requirement 20.2 and 20.3), but the backend remains the authoritative enforcement layer.

### Requirement 10: User Delete Warning Enhancement

**User Story:** As an org-admin, I want the user deletion warning to show how many active roles and group memberships the user has, so that I understand the full impact before confirming.

#### Acceptance Criteria

1. WHEN the Org_Admin triggers a user deletion, THE User_Detail_Page SHALL fetch the user's active role assignment count and group membership count before displaying the confirmation dialog.
2. THE User_Detail_Page deletion confirmation dialog SHALL display the count of active role assignments and group memberships that will be affected, using i18n-translated text (e.g., "This user has {roleCount} active roles and {groupCount} group memberships that will be removed.").
3. IF the user has zero role assignments and zero group memberships, THEN THE User_Detail_Page SHALL display the standard deletion confirmation without the role/group counts.

### Requirement 11: Effective Permissions View

**User Story:** As an org-admin, I want to see a user's full resolved permissions on the User Detail page, so that I can debug access issues and verify that roles and groups are configured correctly without relying on a representative sample.

#### Acceptance Criteria

1. THE Permission_Service SHALL provide a `POST /api/v1/authorize/effective-permissions` endpoint (Effective_Permissions_Endpoint) that accepts `subject_id` (internal `user.id`, per FR-1) and returns the user's full resolved permission set — all granted permissions across all roles, groups, and policies.
2. THE Effective_Permissions_Endpoint SHALL support an optional `trace=true` query parameter. WHEN `trace=true` is provided, THE Effective_Permissions_Endpoint SHALL include an `evaluation_trace` field in the response showing how each permission was derived (which role, group, or policy contributed it).
3. THE User_Detail_Page SHALL display a read-only "Effective Permissions" section below the user profile.
4. WHEN the User_Detail_Page loads, THE User_Detail_Page SHALL call the Effective_Permissions_Endpoint with the user's internal `user.id` as `subject_id` to retrieve the full resolved permission set.
5. THE "Effective Permissions" section SHALL display a summary view listing all granted permissions (resource_type and action pairs) for the user.
6. THE "Effective Permissions" section SHALL provide an expandable "Trace" toggle. WHEN the trace toggle is activated, THE User_Detail_Page SHALL call the Effective_Permissions_Endpoint with `trace=true` and display the permission evaluation chain showing which roles, groups, and policies contributed to each permission decision.
7. IF the Permission_Service returns HTTP 403 or HTTP 503 for the effective permissions request, THEN THE User_Detail_Page SHALL display an informational message indicating effective permissions are unavailable, without blocking the rest of the page.
8. THE "Effective Permissions" section SHALL use i18n translation keys for all labels and messages.

### Requirement 12: i18n Completeness

**User Story:** As a user, I want all IAM Panel v2 text to be displayed in my preferred language, so that new features are fully internationalized.

#### Acceptance Criteria

1. THE IAM_Panel SHALL provide i18n translation keys for all new v2 UI elements: password reset dialog labels, User_Picker_Component placeholder and "no results" text, permission catalog dropdown labels, group hierarchy labels (parent group, child groups), group hierarchy "no inheritance" banner and tooltips, bootstrap dialog fields, recovery dialog fields, transfer dialog fields (including the revoke checkbox), effective permissions section labels (summary view and trace toggle), and all new error messages.
2. THE IAM_Panel SHALL add the new translation keys to both `en.json` and `pt-BR.json` locale files.
3. THE IAM_Panel SHALL verify that no raw i18n key strings (e.g., `admin.users.resetPassword.title`) are displayed to the user — all keys must resolve to translated text.

### Requirement 13: Cross-Repository Coordination

**User Story:** As a developer, I want clear documentation of which backend changes are required for each v2 feature, so that cross-repository work can be planned and executed in the correct order.

#### Acceptance Criteria

1. THE IAM_Panel v2 implementation SHALL NOT begin frontend work for a requirement until the corresponding backend endpoint is available or a mock is in place.
2. THE following backend changes on the Identity_Service require implementation before their corresponding frontend requirements:
   - `POST /api/v1/users` modified to accept `username` and `password`, returning internal `user.id` only (Requirement 1)
   - `POST /api/v1/users/{user_id}/reset-password` accepting internal `user.id` (Requirement 2)
   - `search` query parameter on `GET /api/v1/users` (Requirement 3)
   - `POST /api/v1/organizations/bootstrap` with `Idempotency-Key` support and saga compensation (Requirement 6)
   - `POST /api/v1/organizations/{org_id}/recover` with saga compensation (Requirement 7)
   - `POST /api/v1/organizations/{org_id}/transfer-ownership` with saga compensation (Requirement 8)
   - Last-owner protection on deactivate/delete/role-revoke (Requirement 9)
3. THE following backend changes on the Permission_Service require implementation before their corresponding frontend requirements:
   - Migration of `subject_id` from Keycloak `sub` to internal `user.id` across all tables and endpoints (FR-1)
   - `parent_group_id` column on groups table and updated CRUD endpoints (Requirement 4)
   - `GET /api/v1/groups/tree` endpoint (Requirement 4)
   - `GET /api/v1/permissions/catalog` endpoint (Requirement 5)
   - `POST /api/v1/authorize/effective-permissions` endpoint (Requirement 11)
4. THE IAM_Panel SHALL use the existing v1 TypeScript model interfaces and extend them with new fields as needed (e.g., `username` and `password` on `CreateUserRequest`, `parent_group_id` on `GroupResponse`).
5. ALL new v2 backend endpoints that perform mutations SHALL integrate with the audit-sdk for mutation tracking, per FR-3.

### Requirement 14: Updated TypeScript Models

**User Story:** As a developer, I want the TypeScript model interfaces to reflect the v2 API changes, so that the frontend has type-safe data contracts for the new endpoints and fields.

#### Acceptance Criteria

1. THE `CreateUserRequest` interface SHALL replace the `external_auth_id` field with `username` and `password` fields (both required strings).
2. THE `GroupResponse` interface SHALL add an optional `parent_group_id` field (string or null).
3. THE `GroupCreate` interface SHALL add an optional `parent_group_id` field (string or null).
4. THE `GroupUpdate` interface SHALL add an optional `parent_group_id` field (string or null).
5. THE IAM_Panel SHALL define a `PermissionCatalogEntry` interface with fields: `resource_type` (string) and `actions` (string array).
6. THE IAM_Panel SHALL define a `PermissionCatalogResponse` interface with field: `entries` (array of `PermissionCatalogEntry`).
7. THE IAM_Panel SHALL define request interfaces for the new endpoints: `BootstrapOrganizationRequest` (org_name, owner_username, owner_email, owner_display_name, owner_password), `OrgRecoveryRequest` (target_user_id or target_email), `OwnershipTransferRequest` (target_user_id, revoke_current boolean), `ResetPasswordRequest` (temporary_password), and `EffectivePermissionsRequest` (subject_id as internal `user.id`).
8. THE IAM_Panel SHALL define response interfaces for the new endpoints: `EffectivePermissionsResponse` (permissions array of resource_type/action pairs, optional evaluation_trace).
9. THE IAM_Panel SHALL ensure that no TypeScript model interface references `external_auth_id` as a field that the frontend reads or writes. The `UserResponse` interface MAY retain `external_auth_id` as a read-only field for display purposes, but all functional references (subject_id, user selection, API calls) SHALL use internal `user.id`, per FR-1.
10. THE IAM_Panel SHALL place all new model interfaces in the existing `features/iam/models/` directory, following the v1 file organization pattern.

### Requirement 15: Updated Angular Services

**User Story:** As a developer, I want the Angular services to expose methods for the new v2 backend endpoints, so that page components can consume the new APIs through the existing service layer.

#### Acceptance Criteria

1. THE `UserService` SHALL add a `resetPassword(userId: string, body: ResetPasswordRequest): Observable<void>` method that calls `POST /api/v1/users/{user_id}/reset-password` on the Identity_Service, where `userId` is the internal `user.id`.
2. THE `UserService` `listUsers()` method SHALL support an optional `search` query parameter for the User_Picker_Component typeahead.
3. THE `OrganizationService` SHALL add a `bootstrapOrganization(body: BootstrapOrganizationRequest, idempotencyKey: string): Observable<OrganizationResponse>` method that calls `POST /api/v1/organizations/bootstrap` on the Identity_Service with the `Idempotency-Key` header.
4. THE `OrganizationService` SHALL add a `recoverOrganization(orgId: string, body: OrgRecoveryRequest): Observable<void>` method that calls `POST /api/v1/organizations/{org_id}/recover` on the Identity_Service.
5. THE `OrganizationService` SHALL add a `transferOwnership(orgId: string, body: OwnershipTransferRequest): Observable<void>` method that calls `POST /api/v1/organizations/{org_id}/transfer-ownership` on the Identity_Service.
6. THE `GroupService` SHALL add a `getGroupTree(): Observable<GroupTreeNode[]>` method that calls `GET /api/v1/groups/tree` on the Permission_Service.
7. THE `RoleService` or a new `PermissionCatalogService` SHALL add a `getCatalog(): Observable<PermissionCatalogResponse>` method that calls `GET /api/v1/permissions/catalog` on the Permission_Service.
8. THE `RoleService` or a new `EffectivePermissionsService` SHALL add a `getEffectivePermissions(body: EffectivePermissionsRequest, trace?: boolean): Observable<EffectivePermissionsResponse>` method that calls `POST /api/v1/authorize/effective-permissions` on the Permission_Service.
9. THE IAM_Panel SHALL follow the existing v1 service pattern: `@Injectable({ providedIn: 'root' })`, inject `HttpClient`, use `HttpParams` for query parameters, return `Observable<T>` from all public methods.

### Note: Identity Sync (Out of Scope)

Identity synchronization from Keycloak (email updates, display name changes, account disable/delete) is already handled by the existing JIT User Provisioning feature (`identity-service/.specs/jit-user-provisioning/`). Specifically:
- **Email and display_name sync**: The JIT `_refresh_profile` method updates these fields from JWT claims on every authenticated request (JIT Req 4).
- **Keycloak-side disable/delete**: Auth-sdk rejects invalid/expired tokens at the authentication layer, so disabled or deleted Keycloak users simply cannot authenticate. No additional detection logic is needed.
- **Locked/inactive users**: The JIT spec (Req 7.2, 7.3) preserves locked/inactive status — JIT does not auto-reactivate these users.

No new implementation is required for identity sync in v2.
