# Requirements Document

## Introduction

This document specifies the requirements for the IAM Admin Panel feature in the platform-frontend Angular application. The IAM Admin Panel provides the frontend UI for Module 1.1 (Identity and Access Management) of the SNAP Apolo platform, enabling administrators to manage users, organizations, groups, roles, permissions, and invitations through a governed web interface.

The panel operates under two scope levels: Global scope (platform-admin) for cross-organization governance, and Org scope (org-admin) for organization-internal management. The frontend is strictly a consumption layer — all authorization enforcement happens backend-side (ADM-051). The UI hides or disables actions the current user cannot perform, but the backend remains the authoritative guard.

### Foundational Rules

1. **No global users.** There is no concept of a "global user." Every user MUST belong to exactly one organization. Platform-level permissions are assigned to users via GLOBAL-scoped roles, but user lifecycle and identity always remain tied to an organization.
2. **System organization.** The system SHALL define a special internal system organization (e.g., "SNAP") to which platform-level users belong. This organization functions like any other, except it is the only organization whose users may hold GLOBAL-scoped roles.
3. **Global governs, does not participate.** Platform admins govern organizations (create, update, suspend, recover) but do not participate in org-internal operations. Org-internal management (users, groups, roles, invitations) is the responsibility of the Org Owner / Org Admin.
4. **GLOBAL-scoped role assignments are restricted to Platform_Admin users only.** The system SHALL NOT allow Org_Admin users to create or modify GLOBAL-scoped role assignments. The backend enforces this; the UI SHALL NOT present the option.
5. **Backend enforces org scoping on user queries.** WHEN the current user is an Org_Admin, the Identity_Service is expected to restrict `GET /api/v1/users` to the user's organization_id. WHEN the current user is a Platform_Admin, the Identity_Service MAY allow unfiltered access. The frontend passes the organization_id filter as a convenience, but the backend is the authoritative enforcement layer.
6. **Role type determines assignable scope.** Roles with type `platform` SHALL only be assignable with `GLOBAL` scope. Roles with type `service` SHALL only be assignable with `ORG` scope. This prevents nonsensical assignments (e.g., a platform role at org level, or a service role globally).
7. **Last Org Owner invariant.** The system SHALL prevent removal of the last Org_Owner from an organization. This applies to role revocation, user deactivation, user deletion, and user org change. The only exception is Org Recovery performed by a Platform_Admin.
8. **Organization change triggers full detachment.** When a user's organization_id changes, ALL role assignments and ALL group memberships from the previous organization MUST be revoked/removed. This is primarily a backend concern, but the UI SHALL warn the user that this detachment will occur.
9. **Platform Admin read-only cross-org access.** Platform_Admin users can view any user across organizations (read-only via All_Users_Page) but SHALL NOT mutate users outside the System_Organization (SNAP). Direct user management is always org-scoped.
10. **Bootstrap prerequisite.** The first Platform_Admin user and the System_Organization (SNAP) MUST be seeded via infrastructure migration/seed scripts. This is an out-of-scope prerequisite for this feature — the IAM Panel assumes at least one Platform_Admin and the SNAP org already exist.

## Glossary

- **IAM_Panel**: The Identity and Access Management Admin Panel feature within the platform-frontend application, providing UI screens for user, organization, group, role, and invitation management.
- **Identity_Service**: The backend microservice at `identityServiceUrl` (`http://localhost:8000`) responsible for user CRUD, organization CRUD, invitation lifecycle, clearance levels, and identity resolution.
- **Permission_Service**: The backend microservice at `permissionServiceUrl` (`http://localhost:8001`) responsible for role CRUD, role assignments, group CRUD, group membership, and authorization evaluation.
- **Platform_Admin**: A user holding the `platform-admin` role with GLOBAL scope, authorized to govern organizations (create, update, suspend, recover) and manage platform-level roles. Platform admins do not participate in org-internal operations.
- **Org_Admin**: A user holding the `org-admin` role scoped to a specific organization, authorized to manage users, groups, org-scoped roles, and invitations within that organization.
- **Org_Owner**: A special Org_Admin role that cannot be removed unless another owner exists or a Platform_Admin performs an org recovery override. The first Org_Owner is assigned during organization bootstrap.
- **System_Organization**: The special internal organization (e.g., "SNAP") to which platform-level users belong. Functions like any other organization, except it is the only organization whose users may hold GLOBAL-scoped roles.
- **All_Users_Page**: A read-only page accessible only to Platform_Admin users, displaying users across all organizations for support, recovery, and audit purposes.
- **Org_Recovery**: A controlled override capability allowing a Platform_Admin to assign a new Org_Owner to an organization when the current owner is unavailable (disabled, locked, deleted).
- **User_List_Page**: The page component that displays a paginated, filterable table of users scoped to the current organization context.
- **User_Detail_Page**: The page component that displays and allows editing of a single user's profile, status, and organizational linkage.
- **Organization_List_Page**: The page component that displays a paginated table of organizations (accessible to Platform_Admin only).
- **Organization_Detail_Page**: The page component that displays and allows editing of a single organization's name and status.
- **Group_List_Page**: The page component that displays a paginated table of groups with member counts.
- **Group_Detail_Page**: The page component that displays group details and manages group membership.
- **Role_List_Page**: The page component that displays a paginated table of roles with their type and permission count.
- **Role_Detail_Page**: The page component that displays role details, permissions, and manages role assignments.
- **Invitation_List_Page**: The page component that displays a paginated, filterable table of invitations for an organization.
- **Scope_Type**: The authorization scope for a role assignment, either `GLOBAL` (platform-wide) or `ORG` (organization-specific with a `scope_id`).
- **Optimistic_Locking**: A concurrency control mechanism where the UI sends a `version` field with update/delete requests; the backend rejects the operation with HTTP 409 if the version has changed.
- **Identity_Context**: The authenticated user's identity information returned by `GET /api/v1/identity/me`, including user profile, organization, sections, and optionally roles.
- **Sidebar_Service**: The Angular service that manages navigation sections and items in the application shell sidebar.

## Requirements

### Requirement 1: IAM Panel Navigation and Routing

**User Story:** As an administrator, I want to access the IAM Admin Panel from the sidebar navigation under the "administration" section, so that I can manage identity and access resources from a consistent location.

#### Acceptance Criteria

1. THE IAM_Panel SHALL register navigation items under the "administration" sidebar section in the Sidebar_Service, including entries for Users, Groups, Roles, and Invitations (visible to Org_Admin), and Organizations and All Users (visible to Platform_Admin only).
2. THE IAM_Panel SHALL use i18n translation keys for all navigation item labels (e.g., `shell.nav.users`, `shell.nav.organizations`, `shell.nav.groups`, `shell.nav.roles`, `shell.nav.invitations`, `shell.nav.allUsers`).
3. THE IAM_Panel SHALL define lazy-loaded child routes under the `/admin` path prefix in `app.routes.ts`, with sub-paths `/admin/users`, `/admin/organizations`, `/admin/groups`, `/admin/roles`, `/admin/invitations`, and `/admin/all-users`.
4. THE IAM_Panel SHALL add `permissionServiceUrl` with value `http://localhost:8001` to the environment configuration file alongside the existing `identityServiceUrl`.
5. WHEN an unauthenticated user navigates to any `/admin` route, THE IAM_Panel SHALL redirect the user to the authentication flow via the existing `AuthGuard`.

### Requirement 2: User Management — List and Filter

**User Story:** As an org-admin, I want to view and filter users within my organization, so that I can find and manage user accounts efficiently.

#### Acceptance Criteria

1. THE User_List_Page SHALL display a paginated table of users retrieved from `GET /api/v1/users` on the Identity_Service, using the `limit` and `offset` query parameters for pagination.
2. WHEN the Org_Admin accesses the User_List_Page, THE User_List_Page SHALL filter the user list by the current user's `organization_id` obtained from the Identity_Context.
3. THE User_List_Page SHALL provide filter controls for user status (`active`, `inactive`, `locked`) using a PrimeNG Select component.
4. THE User_List_Page SHALL display the following columns: display name, email, status, clearance level, and creation date.
5. THE User_List_Page SHALL use i18n translation keys for all column headers, filter labels, and status values.
6. THE User_List_Page SHALL synchronize pagination and filter state with URL query parameters, preserving state across browser navigation.
7. IF the Identity_Service returns HTTP 403, THEN THE User_List_Page SHALL display a forbidden view component consistent with the existing audit feature pattern.
8. IF the Identity_Service returns HTTP 503, THEN THE User_List_Page SHALL display a warning message with a retry button.

### Requirement 3: User Management — Create, Edit, and Lifecycle Actions

**User Story:** As an org-admin, I want to create new users, edit user profiles, and perform lifecycle actions (deactivate, lock, unlock, delete), so that I can manage user accounts within my organization.

#### Acceptance Criteria

1. THE User_List_Page SHALL provide a "Create User" button that opens a form dialog for creating a new user via `POST /api/v1/users` on the Identity_Service.
2. THE IAM_Panel SHALL require the following fields for user creation: external_auth_id, email, display_name, and clearance_level, with the organization_id pre-filled from the current Identity_Context.
3. THE IAM_Panel SHALL NOT allow manual modification of the organization_id field during user creation. The organization_id is always derived from the current user's Identity_Context.
4. WHEN the Org_Admin clicks a user row in the User_List_Page, THE IAM_Panel SHALL navigate to the User_Detail_Page displaying the user's full profile retrieved via `GET /api/v1/users/{user_id}`.
5. THE User_Detail_Page SHALL allow editing of email, display_name, and clearance_level fields via `PATCH /api/v1/users/{user_id}` on the Identity_Service.
6. THE User_Detail_Page SHALL display lifecycle action buttons (Deactivate, Lock, Unlock) conditionally based on the current user status: Deactivate visible when status is `active`, Lock visible when status is `active`, Unlock visible when status is `locked`.
7. WHEN the Org_Admin triggers a lifecycle action, THE User_Detail_Page SHALL call the corresponding endpoint (`POST /api/v1/users/{user_id}/deactivate`, `POST /api/v1/users/{user_id}/lock`, or `POST /api/v1/users/{user_id}/unlock`) and refresh the displayed user data upon success.
8. THE User_Detail_Page SHALL provide a "Delete" button that performs a soft delete via `DELETE /api/v1/users/{user_id}` and navigates back to the User_List_Page upon success.
9. WHEN a lifecycle action or delete operation triggers a confirmation, THE IAM_Panel SHALL display a PrimeNG confirmation dialog with i18n-translated messages before executing the action.
10. IF the Identity_Service returns HTTP 400 for any user mutation, THEN THE IAM_Panel SHALL display the error message from the response body using a PrimeNG Message component.
11. IF the Identity_Service returns HTTP 404 for a user operation, THEN THE User_Detail_Page SHALL display a "not found" message and provide navigation back to the User_List_Page.

### Requirement 4: Organization Management

**User Story:** As a platform-admin, I want to create, view, edit, and delete organizations, so that I can manage the organizational structure of the platform.

#### Acceptance Criteria

1. THE Organization_List_Page SHALL display a paginated table of organizations retrieved from `GET /api/v1/organizations` on the Identity_Service, using `limit` and `offset` query parameters.
2. THE Organization_List_Page SHALL display the following columns: name, status, creation date, and last updated date.
3. THE Organization_List_Page SHALL provide a "Create Organization" button that opens a form dialog for creating a new organization via `POST /api/v1/organizations`, requiring name, status, and an initial Org Owner (email or external_auth_id).
4. WHEN a Platform_Admin creates an organization, THE IAM_Panel SHALL execute the organization bootstrap flow: (a) create the organization via `POST /api/v1/organizations`, (b) create or link the initial user, (c) assign the Org Owner role to the initial user within the new organization, and (d) send an invitation to the specified user via `POST /api/v1/organizations/{org_id}/invitations`.
5. THE Organization_Detail_Page SHALL display the current Org Owner(s) for the organization.
6. WHEN the Platform_Admin clicks an organization row, THE IAM_Panel SHALL navigate to the Organization_Detail_Page displaying the organization's details retrieved via `GET /api/v1/organizations/{organization_id}`.
7. THE Organization_Detail_Page SHALL allow editing of the organization name and status via `PATCH /api/v1/organizations/{organization_id}`.
8. THE Organization_Detail_Page SHALL provide a "Delete" button that performs a soft delete via `DELETE /api/v1/organizations/{organization_id}` and navigates back to the Organization_List_Page upon success.
9. IF the Identity_Service returns HTTP 409 when deleting an organization, THEN THE Organization_Detail_Page SHALL display an error message indicating the organization has associated users and cannot be deleted.
10. THE Organization_List_Page SHALL use i18n translation keys for all column headers, button labels, form labels, and status values.
11. THE Organization_List_Page SHALL synchronize pagination state with URL query parameters.

### Requirement 5: Group Management

**User Story:** As an org-admin, I want to create, view, edit, and delete groups, and manage group membership, so that I can organize users into logical groupings within my organization.

#### Acceptance Criteria

1. THE Group_List_Page SHALL display a paginated table of groups retrieved from `GET /api/v1/groups` on the Permission_Service, using `limit` and `offset` query parameters.
2. THE Group_List_Page SHALL display the following columns: name, description, version, creation date, and last updated date.
3. THE Group_List_Page SHALL provide a "Create Group" button that opens a form dialog for creating a new group via `POST /api/v1/groups`, requiring a name field and an optional description field.
4. WHEN the Org_Admin clicks a group row, THE IAM_Panel SHALL navigate to the Group_Detail_Page displaying the group's details retrieved via `GET /api/v1/groups/{group_id}`.
5. THE Group_Detail_Page SHALL allow editing of the group name and description via `PUT /api/v1/groups/{group_id}`, sending the current `version` field for Optimistic_Locking.
6. IF the Permission_Service returns HTTP 409 on a group update, THEN THE Group_Detail_Page SHALL display an error message indicating a version conflict and prompt the Org_Admin to reload the group data.
7. THE Group_Detail_Page SHALL provide a "Delete" button that sends a `DELETE /api/v1/groups/{group_id}?version={version}` request and navigates back to the Group_List_Page upon success.
8. IF the Permission_Service returns HTTP 409 when deleting a group because the group has active members, THEN THE Group_Detail_Page SHALL display an error message indicating the group has active members and cannot be deleted.
9. THE Group_Detail_Page SHALL display a paginated list of group members retrieved from `GET /api/v1/groups/{group_id}/members` on the Permission_Service.
10. THE Group_Detail_Page SHALL provide an "Add Member" control that accepts a subject_id and calls `POST /api/v1/groups/{group_id}/members` to add the member.
11. THE Group_Detail_Page SHALL provide a "Remove" action per member row that calls `DELETE /api/v1/groups/{group_id}/members/{subject_id}` after a confirmation dialog.
12. IF the Permission_Service returns HTTP 409 when adding a member (duplicate), THEN THE Group_Detail_Page SHALL display an error message indicating the member already exists.
13. THE Group_List_Page SHALL use i18n translation keys for all column headers, button labels, form labels, and messages.

### Requirement 6: Role and Permission Management

**User Story:** As an org-admin, I want to create, view, edit, and delete roles with their permissions, so that I can define access control policies for users within my organization.

#### Acceptance Criteria

1. THE Role_List_Page SHALL display a paginated table of roles retrieved from `GET /api/v1/roles` on the Permission_Service, using `limit` and `offset` query parameters.
2. THE Role_List_Page SHALL display the following columns: name, type (`platform` or `service`), permission count, version, and creation date.
3. THE Role_List_Page SHALL provide a "Create Role" button that opens a form dialog for creating a new role via `POST /api/v1/roles`, requiring name, type, and at least one permission entry (resource_type and action pair).
4. WHEN the Org_Admin clicks a role row, THE IAM_Panel SHALL navigate to the Role_Detail_Page displaying the role's details and permissions retrieved via `GET /api/v1/roles/{role_id}`.
5. THE Role_Detail_Page SHALL allow editing of the role name, type, and permissions list via `PUT /api/v1/roles/{role_id}`, sending the current `version` field for Optimistic_Locking.
6. IF the Permission_Service returns HTTP 409 on a role update, THEN THE Role_Detail_Page SHALL display an error message indicating a version conflict and prompt the administrator to reload the role data.
7. THE Role_Detail_Page SHALL provide a "Delete" button that sends a `DELETE /api/v1/roles/{role_id}?version={version}` request and navigates back to the Role_List_Page upon success.
8. IF the Permission_Service returns HTTP 409 when deleting a role because the role has active assignments, THEN THE Role_Detail_Page SHALL display an error message indicating the role has active assignments and cannot be deleted.
9. WHILE the current user does not hold the Platform_Admin role, THE Role_Detail_Page SHALL disable the type field and restrict the type value to `service` for role creation.
10. THE Role_List_Page SHALL use i18n translation keys for all column headers, button labels, form labels, type values, and messages.

### Requirement 7: Role Assignment Management

**User Story:** As an org-admin, I want to assign and revoke roles to users with the appropriate scope, so that I can control what permissions users have within my organization.

#### Acceptance Criteria

1. THE Role_Detail_Page SHALL display a paginated list of role assignments retrieved from `GET /api/v1/roles/{role_id}/assignments` on the Permission_Service.
2. THE Role_Detail_Page SHALL display the following columns for each assignment: subject_id, scope_type, scope_id, and creation date.
3. THE Role_Detail_Page SHALL provide an "Assign Role" control that opens a form requiring subject_id, scope_type (`GLOBAL` or `ORG`), and scope_id (required when scope_type is `ORG`, null when `GLOBAL`), and calls `POST /api/v1/roles/{role_id}/assignments`.
4. WHILE the current user does not hold the Platform_Admin role, THE Role_Detail_Page SHALL disable the `GLOBAL` option in the scope_type selector and default scope_type to `ORG` with scope_id pre-filled from the current Identity_Context organization_id.
5. WHEN the scope_type is set to `GLOBAL`, THE Role_Detail_Page SHALL set scope_id to null and disable the scope_id input field.
6. WHEN the scope_type is set to `ORG`, THE Role_Detail_Page SHALL require a valid scope_id (UUID) in the scope_id input field.
7. THE Role_Detail_Page SHALL provide a "Revoke" action per assignment row that calls `DELETE /api/v1/roles/{role_id}/assignments/{subject_id}` after a confirmation dialog.
8. IF the Permission_Service returns HTTP 403 when assigning a GLOBAL-scoped role, THEN THE Role_Detail_Page SHALL display an error message indicating only Platform_Admin can assign GLOBAL-scoped roles.
9. IF the Permission_Service returns HTTP 409 when assigning a role (duplicate assignment), THEN THE Role_Detail_Page SHALL display an error message indicating the assignment already exists.
10. IF the Permission_Service returns HTTP 422 when assigning a role (max roles exceeded), THEN THE Role_Detail_Page SHALL display the error message from the response body.

### Requirement 8: Invitation Management

**User Story:** As an org-admin, I want to create, list, and revoke invitations for my organization, so that I can invite new users to join the organization.

#### Acceptance Criteria

1. THE Invitation_List_Page SHALL display a paginated table of invitations retrieved from `GET /api/v1/organizations/{org_id}/invitations` on the Identity_Service, using `limit`, `offset`, and optional `status` query parameters.
2. THE Invitation_List_Page SHALL use the current user's organization_id from the Identity_Context as the `org_id` path parameter.
3. THE Invitation_List_Page SHALL be accessible only to users with org-scoped permissions. Platform_Admin users SHALL NOT see the Invitations navigation item, as invitations are strictly org-scoped operations. Platform admins invite the initial Org Owner during organization bootstrap (Requirement 4) only.
4. THE Invitation_List_Page SHALL display the following columns: email, status (`pending`, `accepted`, `expired`, `revoked`), invited_by_user_id, expires_at, and creation date.
5. THE Invitation_List_Page SHALL provide a filter control for invitation status using a PrimeNG Select component.
6. THE Invitation_List_Page SHALL provide a "Create Invitation" button that opens a form dialog requiring an email address and calls `POST /api/v1/organizations/{org_id}/invitations`.
7. WHEN the Identity_Service returns an existing pending invitation for the same email (idempotent response), THE Invitation_List_Page SHALL display the existing invitation without showing an error.
8. THE Invitation_List_Page SHALL provide a "Revoke" action per row for invitations with `pending` status, calling `POST /api/v1/invitations/{invitation_id}/revoke` after a confirmation dialog.
9. WHILE an invitation status is not `pending`, THE Invitation_List_Page SHALL disable the "Revoke" action for that row.
10. IF the Identity_Service returns HTTP 422 when creating or revoking an invitation, THEN THE Invitation_List_Page SHALL display the error message from the response body.
11. THE Invitation_List_Page SHALL use i18n translation keys for all column headers, button labels, status values, form labels, and messages.
12. THE Invitation_List_Page SHALL synchronize pagination and filter state with URL query parameters.

### Requirement 9: Scope-Aware UI Visibility

**User Story:** As an administrator, I want the IAM Panel to show or hide features based on my role scope, so that I only see actions I am authorized to perform.

#### Acceptance Criteria

1. WHEN the IAM_Panel loads, THE IAM_Panel SHALL retrieve the current user's Identity_Context via `GET /api/v1/identity/me?include=roles` from the Identity_Service to determine the user's role and organization context.
2. WHILE the current user holds the Platform_Admin role, THE IAM_Panel SHALL display the "Organizations" and "All Users" navigation items in the sidebar and enable access to the Organization_List_Page and All_Users_Page.
3. WHILE the current user does not hold the Platform_Admin role, THE IAM_Panel SHALL hide the "Organizations" and "All Users" navigation items from the sidebar.
4. WHILE the current user holds the Platform_Admin role, THE IAM_Panel SHALL hide the "Invitations" navigation item from the sidebar, as invitations are strictly org-scoped operations.
5. WHILE the current user holds the Org_Admin role, THE IAM_Panel SHALL scope all user, group, and invitation operations to the user's own organization_id from the Identity_Context.
6. THE IAM_Panel SHALL treat all UI visibility restrictions as convenience features only; the backend remains the authoritative enforcement layer per ADM-051.

### Requirement 10: Error Handling and HTTP Status Patterns

**User Story:** As an administrator, I want consistent error handling across all IAM Panel pages, so that I receive clear feedback when operations fail.

#### Acceptance Criteria

1. IF any backend service returns HTTP 403, THEN THE IAM_Panel SHALL display a forbidden view component, consistent with the existing audit feature pattern.
2. IF any backend service returns HTTP 503, THEN THE IAM_Panel SHALL display a warning message with a retry button that re-executes the failed request.
3. IF any backend service returns HTTP 400, THEN THE IAM_Panel SHALL display the error message from the response body using a PrimeNG Message component with `error` severity.
4. IF any backend service returns HTTP 404 on a detail page, THEN THE IAM_Panel SHALL display a "resource not found" message with navigation back to the corresponding list page.
5. IF any backend service returns HTTP 409, THEN THE IAM_Panel SHALL display a conflict error message appropriate to the context (version conflict, duplicate resource, or resource has dependencies).
6. IF a network error occurs (HTTP status 0), THEN THE IAM_Panel SHALL display a network error message with a retry button.
7. THE IAM_Panel SHALL use i18n translation keys for all error messages.

### Requirement 11: Angular Service Layer

**User Story:** As a developer, I want dedicated Angular services for each backend API domain, so that components can consume backend data through a consistent, reusable service layer.

#### Acceptance Criteria

1. THE IAM_Panel SHALL provide a `UserService` (Angular `Injectable` with `providedIn: 'root'`) that encapsulates all HTTP calls to the Identity_Service user endpoints (`/api/v1/users`, `/api/v1/users/{user_id}`, `/api/v1/users/{user_id}/deactivate`, `/api/v1/users/{user_id}/lock`, `/api/v1/users/{user_id}/unlock`).
2. THE IAM_Panel SHALL provide an `OrganizationService` (Angular `Injectable` with `providedIn: 'root'`) that encapsulates all HTTP calls to the Identity_Service organization endpoints (`/api/v1/organizations`, `/api/v1/organizations/{organization_id}`).
3. THE IAM_Panel SHALL provide an `InvitationService` (Angular `Injectable` with `providedIn: 'root'`) that encapsulates all HTTP calls to the Identity_Service invitation endpoints (`/api/v1/organizations/{org_id}/invitations`, `/api/v1/invitations/{invitation_id}/revoke`).
4. THE IAM_Panel SHALL provide a `RoleService` (Angular `Injectable` with `providedIn: 'root'`) that encapsulates all HTTP calls to the Permission_Service role and assignment endpoints (`/api/v1/roles`, `/api/v1/roles/{role_id}`, `/api/v1/roles/{role_id}/assignments`).
5. THE IAM_Panel SHALL provide a `GroupService` (Angular `Injectable` with `providedIn: 'root'`) that encapsulates all HTTP calls to the Permission_Service group and member endpoints (`/api/v1/groups`, `/api/v1/groups/{group_id}`, `/api/v1/groups/{group_id}/members`).
6. THE IAM_Panel SHALL construct service base URLs from the `environment.identityServiceUrl` and `environment.permissionServiceUrl` configuration values.
7. THE IAM_Panel SHALL follow the existing service pattern from the audit feature: inject `HttpClient`, use `HttpParams` for query parameters, and return `Observable` types from all public methods.

### Requirement 12: TypeScript Models

**User Story:** As a developer, I want TypeScript interfaces for all API request and response shapes, so that the frontend has type-safe data contracts aligned with the backend schemas.

#### Acceptance Criteria

1. THE IAM_Panel SHALL define TypeScript interfaces for Identity_Service response models: `UserResponse` (id, external_auth_id, email, display_name, status, organization_id, clearance_level, identity_version, created_at, updated_at), `OrganizationResponse` (id, name, status, created_at, updated_at), and `InvitationResponse` (id, organization_id, email, invited_by_user_id, status, expires_at, accepted_at, created_at, updated_at).
2. THE IAM_Panel SHALL define TypeScript interfaces for Permission_Service response models: `RoleResponse` (id, name, type, version, permissions, created_at, updated_at), `PermissionResponse` (id, resource_type, action, created_at), `RoleAssignmentResponse` (id, subject_id, role_id, scope_type, scope_id, created_at), `GroupResponse` (id, name, description, version, created_at, updated_at), and `GroupMemberResponse` (id, group_id, subject_id, created_at).
3. THE IAM_Panel SHALL define TypeScript interfaces for request payloads: `CreateUserRequest`, `UpdateUserRequest`, `CreateOrganizationRequest`, `UpdateOrganizationRequest`, `CreateInvitationRequest`, `RoleCreate`, `RoleUpdate`, `RoleAssignmentCreate`, `GroupCreate`, `GroupUpdate`, and `GroupMemberCreate`.
4. THE IAM_Panel SHALL define a `PaginatedResponse<T>` generic interface with fields: items (T[]), total_count or total (number), limit (number), and offset (number).
5. THE IAM_Panel SHALL place model files under `features/iam/models/` following the existing feature structure convention.

### Requirement 13: Internationalization

**User Story:** As a user, I want all IAM Panel text to be displayed in my preferred language, so that I can use the panel regardless of my language preference.

#### Acceptance Criteria

1. THE IAM_Panel SHALL use `@ngx-translate/core` `TranslateModule` and `TranslateService` for all user-facing text, consistent with the existing audit feature pattern.
2. THE IAM_Panel SHALL define i18n keys under a dedicated `admin` namespace (e.g., `admin.users.title`, `admin.organizations.title`, `admin.groups.title`, `admin.roles.title`, `admin.invitations.title`).
3. THE IAM_Panel SHALL provide i18n keys for all form field labels, validation messages, button labels, table column headers, status values, error messages, and confirmation dialog messages.
4. THE IAM_Panel SHALL use the `translate` pipe in templates for static text and `TranslateService.instant()` for programmatic text resolution (e.g., select option labels).

### Requirement 14: Component Architecture and Feature Structure

**User Story:** As a developer, I want the IAM Panel to follow the established feature structure conventions, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. THE IAM_Panel SHALL organize files under `features/iam/` with subdirectories: `models/`, `services/`, `pages/`, and `components/`.
2. THE IAM_Panel SHALL implement all components as Angular standalone components using `ChangeDetectionStrategy.OnPush`.
3. THE IAM_Panel SHALL use Angular signals (`signal()`, `computed()`) for component-level reactive state, consistent with the existing audit feature pattern.
4. THE IAM_Panel SHALL use PrimeNG components for all UI elements: `TableModule` for data tables, `ButtonModule` for buttons, `InputTextModule` for text inputs, `Select` for dropdowns, `Message` for inline messages, `Dialog` for modal dialogs, and `Tooltip` for tooltips.
5. THE IAM_Panel SHALL define feature routes in `features/iam/iam.routes.ts` and register the feature via lazy loading in `app.routes.ts`.
6. THE IAM_Panel SHALL use the `app-` selector prefix for all components.

### Requirement 15: Business Rule Enforcement in UI

**User Story:** As an administrator, I want the IAM Panel to reflect critical business rules visually, so that I understand the access control model while managing resources.

#### Acceptance Criteria

1. THE User_Detail_Page SHALL display an informational message when a user has no organization_id set, indicating the user has no operational access per ADM-044.
2. THE User_Detail_Page SHALL display an informational message when a user has no role assignments, indicating the user has no effective permissions per ADM-045.
3. WHILE creating a role assignment with scope_type `ORG`, THE Role_Detail_Page SHALL pre-fill the scope_id with the current user's organization_id from the Identity_Context, reinforcing org-scoped isolation per ADM-007.
4. THE Group_Detail_Page SHALL display an informational note that group membership does not inherit permissions from parent groups, per ADM-033 and ADM-035.
5. THE IAM_Panel SHALL display all business rule informational messages using PrimeNG Message components with `info` severity and i18n-translated text.

### Requirement 16: Organization Recovery

**User Story:** As a platform-admin, I want to assign a new Org Owner to an organization when the current owner is unavailable, so that the organization can continue to be managed without disruption.

#### Acceptance Criteria

1. THE Organization_Detail_Page SHALL display an "Org Recovery" action button, visible only to Platform_Admin users.
2. WHEN the Platform_Admin triggers the Org Recovery action, THE IAM_Panel SHALL open a form dialog allowing the Platform_Admin to select an existing user within the organization or specify a new user (email or external_auth_id) to be assigned the Org_Owner role.
3. THE Org Recovery action SHALL require a confirmation dialog before execution, clearly stating that this is an administrative override action.
4. WHEN the Org Recovery action is confirmed, THE IAM_Panel SHALL assign the Org_Owner role to the specified user within the organization via `POST /api/v1/roles/{role_id}/assignments` on the Permission_Service.
5. THE Org Recovery action SHALL be auditable — the confirmation dialog SHALL inform the Platform_Admin that this action will be recorded in the audit trail.
6. THE IAM_Panel SHALL use i18n translation keys for all Org Recovery labels, messages, and confirmation text.

### Requirement 17: Cross-Organization User View

**User Story:** As a platform-admin, I want to view users across all organizations in a read-only view, so that I can support recovery, audit, and troubleshooting scenarios.

#### Acceptance Criteria

1. THE All_Users_Page SHALL display a paginated table of users retrieved from `GET /api/v1/users` on the Identity_Service without an organization_id filter, accessible only to Platform_Admin users.
2. THE All_Users_Page SHALL display the following columns: display name, email, status, organization_id, clearance level, and creation date.
3. THE All_Users_Page SHALL provide filter controls for organization (select from available organizations), user status, and a text search for display name or email.
4. THE All_Users_Page SHALL be strictly read-only — it SHALL NOT provide create, edit, delete, or lifecycle action controls.
5. THE All_Users_Page MAY provide a read-only navigation link per user row that opens the user's profile in a read-only detail view. Platform_Admin users SHALL NOT be able to mutate users outside the System_Organization (SNAP) from this view.
6. THE All_Users_Page SHALL use i18n translation keys for all column headers, filter labels, and messages.
7. THE All_Users_Page SHALL synchronize pagination and filter state with URL query parameters.

### Requirement 18: GLOBAL Role Assignment Restriction

**User Story:** As a platform architect, I want the IAM Panel to enforce that only platform-admin users can create or modify GLOBAL-scoped role assignments, so that tenant isolation is preserved.

#### Acceptance Criteria

1. THE IAM_Panel SHALL NOT present the `GLOBAL` option in the scope_type selector for users who do not hold the Platform_Admin role.
2. WHILE the current user is an Org_Admin, THE Role_Detail_Page SHALL default scope_type to `ORG` and pre-fill scope_id with the current user's organization_id, with no option to change to `GLOBAL`.
3. WHILE the current user is a Platform_Admin, THE Role_Detail_Page SHALL allow selecting either `GLOBAL` or `ORG` scope_type for role assignments.
4. WHEN assigning a role with type `platform`, THE Role_Detail_Page SHALL restrict scope_type to `GLOBAL` only. WHEN assigning a role with type `service`, THE Role_Detail_Page SHALL restrict scope_type to `ORG` only. This enforces Foundational Rule 6.
5. IF the Permission_Service returns HTTP 403 when attempting a GLOBAL-scoped role assignment, THEN THE Role_Detail_Page SHALL display an error message indicating only Platform_Admin can assign GLOBAL-scoped roles.
6. THE backend is the authoritative enforcement layer for this restriction. The UI restriction is a convenience to prevent accidental misuse.

### Requirement 19: Org Ownership Transfer

**User Story:** As an Org Owner, I want to transfer ownership of my organization to another user within the same organization, so that I can hand off administrative responsibility without requiring platform admin intervention.

#### Acceptance Criteria

1. THE Organization section of the IAM_Panel SHALL provide a "Transfer Ownership" action, visible only to users who currently hold the Org_Owner role for the organization.
2. WHEN the Org_Owner triggers the Transfer Ownership action, THE IAM_Panel SHALL open a form dialog allowing selection of an existing active user within the same organization to receive the Org_Owner role.
3. THE Transfer Ownership action SHALL require a confirmation dialog before execution, clearly stating that the current user will lose the Org_Owner role after transfer (unless they are also assigned it independently).
4. WHEN the Transfer Ownership action is confirmed, THE IAM_Panel SHALL: (a) assign the Org_Owner role to the target user via `POST /api/v1/roles/{role_id}/assignments`, and (b) optionally revoke the Org_Owner role from the current user (only if the current user explicitly opts to relinquish ownership).
5. THE Transfer Ownership action SHALL NOT allow transferring ownership to a user outside the current organization.
6. THE IAM_Panel SHALL use i18n translation keys for all Transfer Ownership labels, messages, and confirmation text.

### Requirement 20: Soft Constraints, Warnings, and Audit Hinting

**User Story:** As an administrator, I want the IAM Panel to warn me before potentially dangerous actions and remind me that destructive operations are audited, so that I can make informed decisions.

#### Acceptance Criteria

1. BEFORE executing any destructive action (user deletion, user deactivation, role revocation, group deletion, org deletion, ownership transfer), THE IAM_Panel SHALL display a confirmation dialog that includes the text "This action will be recorded in the audit trail" (i18n-translated).
2. WHEN an Org_Admin attempts to revoke a role from a user who holds the Org_Owner role and no other Org_Owner exists for the organization, THE IAM_Panel SHALL display a warning message indicating this would orphan the organization and prevent the action (per Foundational Rule 7).
3. WHEN an Org_Admin attempts to deactivate or delete a user who holds the Org_Owner role and no other Org_Owner exists, THE IAM_Panel SHALL display a warning message indicating this would orphan the organization and prevent the action.
4. WHEN an Org_Admin attempts to delete a user who has active role assignments or group memberships, THE IAM_Panel SHALL display a warning message listing the number of active roles and groups that will be affected.
5. WHEN an Org_Admin attempts to remove the last member from a group, THE IAM_Panel SHALL display an informational message noting the group will have no members.
6. THE IAM_Panel SHALL display all warning messages using PrimeNG Message components with `warn` severity and i18n-translated text.
7. THE IAM_Panel SHALL treat these warnings as UX guidance only — the backend remains the authoritative enforcement layer for hard constraints (e.g., last Org_Owner protection).

### Requirement 21: Effective Permissions View (Future)

**User Story:** As an administrator, I want to see a user's effective permissions (resolved from roles, groups, and object-level grants), so that I can debug access issues and verify correct configuration.

#### Acceptance Criteria

1. THE User_Detail_Page MAY display a read-only "Effective Permissions" section showing the user's resolved roles, group memberships, and computed permissions.
2. THIS requirement is marked as future/optional and is NOT required for the initial implementation. It is documented here to inform the design phase and ensure the component architecture supports future extension.
3. WHEN implemented, the Effective Permissions view SHALL consume the `POST /api/v1/authorize` endpoint with `trace=true` on the Permission_Service to display the permission evaluation chain.
