# IAM Admin Panel v2 — Known Gaps

Documented during integration testing on 2026-04-07.

## 🔴 Critical — Bootstrap Saga Incomplete

**Problem:** ~~The `POST /organizations/bootstrap` endpoint (step d) does not actually assign the Org Owner role to the newly created user. The cross-service call to permission-service is a TODO placeholder.~~ ✅ Fixed — step (d) now calls permission-service to assign `org-admin` role.

**Impact:** ~~Users created via bootstrap have no role assignments in permission-service.~~ ✅ Resolved.

**Root cause:** Step (d) requires:
1. ~~An `org-owner` role to be pre-seeded in permission-service~~ ✅ Seeded as `org-admin` (type: `service`) in 002_seed_data.py
2. ~~A service-to-service auth token for identity-service → permission-service HTTP call~~ ✅ Uses existing `get_service_token()` (client credentials grant)
3. ~~The actual `POST /api/v1/roles/{role_id}/assignments` call with the user's internal ID as `subject_id`~~ ✅ Implemented via `PermissionServiceClient`

**Fix applied:**
- ✅ `org-admin` role seeded in permission-service (key: `ORG_ADMIN`, name: `org-admin`)
- ✅ Stable `key` column added to `permissions.roles` — immutable system identifier, decoupled from mutable `name`
- ✅ `GET /api/v1/roles/by-key/{key}` endpoint added to permission-service
- ✅ `PermissionServiceClient` created in `identity-service/services/permission_service_client.py` — uses key-based lookup
- ✅ Step (d) wired in bootstrap, recover, and transfer endpoints
- ✅ Role key configurable via `ORG_ADMIN_ROLE_KEY` env var (default: `ORG_ADMIN`) per Req 33
- ✅ Role hydration (`_hydrate_roles_from_permission_service`) fixed to use internal `user.id` instead of Keycloak sub

**Status:** Resolved. Requires `PERMISSION_SERVICE_URL` and `KC_CLIENT_SECRET` to be configured in identity-service environment.

**Files:** `identity-service/api/v1/organizations.py`, `identity-service/services/permission_service_client.py`, `identity-service/app/config.py`

---

## 🔴 Critical — Sidebar Shows Admin Items to Users Without Roles

**Problem:** ~~The sidebar shows Users, Groups, Roles, Invitations, Audit to ALL authenticated users regardless of their actual role assignments.~~ ✅ Fixed — administration section now gated on `isAdmin()` signal.

**Status:** Resolved. The `isAdmin` signal checks for `PLATFORM_ADMIN` or `ORG_ADMIN` role keys. Users with no admin role see only the intelligence section.

**Files:** `platform-frontend/src/app/shell/sidebar/sidebar.service.ts`, `platform-frontend/src/app/features/iam/services/active-org.service.ts`, `platform-frontend/src/app/features/iam/models/identity-context.model.ts`

---

## 🟡 Important — Invitation Status Not Updated on Login

**Problem:** ~~When a user created via bootstrap logs in, their invitation status remains `pending`.~~ ✅ Fixed — JIT provisioning now auto-accepts pending invitations when the user already has an org assignment.

**Status:** Resolved. During JIT profile refresh (existing active user), if the user has `organization_id` set and a matching pending invitation exists, it's automatically marked as `accepted`. Non-critical — failure doesn't block login.

**Files:** `identity-service/services/identity_service.py` (`_auto_accept_pending_invitation`)

---

## 🟡 Important — Validation Error Messages Not Translated

**Problem:** ~~When the backend returns Pydantic validation errors (422), the error messages are in English.~~ ✅ Fixed — client-side validation with i18n messages now prevents invalid submissions.

**Status:** Resolved. The bootstrap dialog shows inline validation errors in the user's locale (en/pt-BR). Validation includes: required fields, username min 3 chars, valid email pattern, password min 8 chars. Backend validation remains as a safety net.

**Files:** `platform-frontend/src/app/features/iam/pages/organization-list/organization-list.component.ts`, `platform-frontend/src/locales/en.json`, `platform-frontend/src/locales/pt-BR.json`

---

## 🟡 Important — FR-1 (Identifier Boundary) Not Fully Enforced

**Problem:** ~~The seed script (`seed-platform-admin.sh`) uses Keycloak `sub` (KC_USER_ID) as `subject_id` in role assignments (step 7). Per FR-1, permission-service should use internal `user.id`.~~ ✅ Fixed — step 7 now uses `ADMIN_USER_ID` (internal).

**Status:** Resolved.

**Files:** `platform-runtime/scripts/seed-platform-admin.sh`

---

## 🟢 Nice to Have — Permission Catalog Empty

**Problem:** ~~The `GET /api/v1/permissions/catalog` endpoint returns an empty catalog because no entries have been seeded in the `permission_catalog` table.~~ ✅ Fixed — 31 resource_type/action pairs seeded in 002_seed_data.py.

**Status:** Resolved.

**Files:** `permission-service/migrations/versions/002_seed_data.py`

---

## 🟢 Nice to Have — Keycloak Admin Token Not Cached

**Problem:** ~~The `KeycloakAdminClient._get_admin_token()` fetches a fresh token on every call.~~ ✅ Fixed — token is now cached and refreshed 30s before expiry.

**Status:** Resolved.

**Files:** `identity-service/services/keycloak_admin_client.py`

---

## 🟢 Nice to Have — Enhanced Delete Warning Counts Not Implemented

**Problem:** ~~Task 7.2 (enhanced delete warning with role/group counts) has a TODO.~~ ✅ Fixed — `GET /subjects/{subject_id}/counts` endpoint added, frontend wired.

**Status:** Resolved. The user deletion confirmation now shows role assignment and group membership counts before confirming. Falls back to standard confirmation if the counts endpoint is unavailable.

**Files:** `permission-service/api/v1/subject_routes.py`, `platform-frontend/src/app/features/iam/pages/user-detail/user-detail.component.ts`, `platform-frontend/src/app/features/iam/services/role.service.ts`
