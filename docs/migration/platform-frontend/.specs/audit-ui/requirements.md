# Requirements Document

## Introduction

This specification defines the audit log viewing interface (audit-ui) for the platform-frontend. The feature allows users with the `(audit_log, read)` permission to query, filter, and view audit events recorded by the audit-service. The UI consumes the existing REST API (`GET /api/v1/audit-logs` and `GET /api/v1/audit-logs/{event_id}`) through the API Gateway, with JWT authentication managed by the existing Auth_Interceptor. All authorization is validated by the backend — the frontend only handles HTTP 403 responses gracefully. Components use PrimeNG with the Aura preset as per [DS-001]. User-visible strings use i18n keys in en/pt as per [ARCH-008].

## Design Constraints

- **Backend Authorization**: The frontend does NOT call permission-service directly. The audit-service validates permissions via `require_audit_read_permission` (dependency injection in FastAPI). The frontend only handles 403 responses with a friendly message.
- **Exclusive API Gateway**: All HTTP calls to the audit-service go through the API Gateway (`environment.apiGatewayUrl`). The existing Auth_Interceptor automatically attaches the Bearer token as per [ARCH-001].
- **PrimeNG Components**: All UI elements (table, filters, buttons, dialogs) use PrimeNG components with the Aura preset. No custom implementations for patterns already covered by PrimeNG as per [DS-001].
- **Standalone Components with Signals**: Angular 21 standalone components with `ChangeDetectionStrategy.OnPush` and signals for reactive state, following the established project pattern.
- **Pagination Envelope**: The API returns `{ items, total, limit, offset }` as per [ARCH-002]. The frontend must map this envelope to PrimeNG Table pagination.

## Glossary

- **Audit_Log_Page**: Main feature page that displays the paginated table and audit log filters.
- **Audit_Log_Detail**: Detail view of a single audit record, displaying all event fields.
- **Audit_Log_Service**: Injectable Angular service responsible for communicating with the audit-service REST API via the API Gateway.
- **Audit_Log_Table**: PrimeNG table component (`p-table`) that displays audit records with server-side pagination and filters.
- **Audit_Log_Filter**: Set of filter controls that map to the API query parameters (`event_type`, `resource_type`, `actor_id`, `outcome`, `occurred_after`, `occurred_before`, `producer`, `correlation_id`, `resource_id`).
- **Forbidden_View**: Component displayed when the backend returns HTTP 403, informing the user they do not have permission to access audit logs.
- **Export_Button**: Dropdown button component that allows users to export audit logs in CSV or JSON format, applying the current filters.
- **API_Gateway**: Single entry point for communication with backend services. See [ARCH-001].
- **PaginatedAuditLogResponse**: API response envelope: `{ items: AuditLogResponse[], total: number, limit: number, offset: number }`.
- **AuditLogResponse**: Individual audit record with fields: `id`, `event_id`, `event_type`, `event_version`, `occurred_at`, `correlation_id`, `request_id`, `trace_id`, `producer`, `actor_id`, `actor_type`, `action`, `resource_type`, `resource_id`, `outcome`, `metadata`, `failure_reason`, `received_at`.

## Requirements

### Requirement 1: Paginated Audit Log Listing

**User Story:** As a platform administrator, I want to view a paginated table of audit events so that I can monitor actions performed in the system.

#### Acceptance Criteria

1. WHEN the user navigates to the `/audit-logs` route, THE Audit_Log_Page SHALL display the Audit_Log_Table with records returned by `GET {apiGatewayUrl}/api/v1/audit-logs`.
2. THE Audit_Log_Table SHALL display the following columns: `occurred_at` (formatted date/time), `event_type`, `actor_id`, `action`, `resource_type`, `resource_id`, `outcome`, and `producer`.
3. THE Audit_Log_Table SHALL use server-side pagination, mapping the `PaginatedAuditLogResponse` envelope (`items`, `total`, `limit`, `offset`) to the PrimeNG `p-table` pagination controls.
4. THE Audit_Log_Table SHALL display 50 records per page as the default, allowing the user to select between 20, 50, and 100 records per page.
5. WHEN the user changes the page or page size, THE Audit_Log_Service SHALL send a new request to the API with the corresponding `limit` and `offset` parameters.
6. THE Audit_Log_Table SHALL display the total record count returned by the `total` field of the paginated response.
7. WHILE the API request is in progress, THE Audit_Log_Table SHALL display a loading indicator (PrimeNG skeleton or spinner).
8. IF the API returns an empty list (`items: [], total: 0`), THEN THE Audit_Log_Table SHALL display an empty state message informing the user that no records were found.
9. THE Audit_Log_Table SHALL display records sorted by `occurred_at` in descending order (most recent first) by default. THE Audit_Log_Service SHALL include `sort_by=occurred_at` and `sort_order=desc` query parameters in all listing requests.

### Requirement 2: Query Filters

**User Story:** As a platform administrator, I want to filter audit logs by different criteria so that I can quickly locate specific events.

#### Acceptance Criteria

1. THE Audit_Log_Filter SHALL provide the following filter controls, mapped directly to the API query parameters:
   - `event_type`: free text field
   - `resource_type`: free text field
   - `outcome`: selector with `success` and `failure` options
   - `producer`: free text field
   - `actor_id`: free text field (UUID)
   - `correlation_id`: free text field (UUID)
   - `resource_id`: free text field (UUID)
   - `occurred_after`: date/time picker (PrimeNG DatePicker)
   - `occurred_before`: date/time picker (PrimeNG DatePicker)
2. WHEN the user applies filters, THE Audit_Log_Service SHALL send a request to the API including only the filled filters as query parameters, resetting `offset` to 0.
3. WHEN the user clears filters, THE Audit_Log_Service SHALL send a request without filters, resetting `offset` to 0.
4. IF the user provides an `occurred_before` value earlier than `occurred_after`, THEN THE Audit_Log_Filter SHALL display a validation message and prevent the request from being sent.
5. THE Audit_Log_Filter SHALL apply a 400ms debounce to all free text filter inputs (`event_type`, `resource_type`, `producer`, `actor_id`, `correlation_id`, `resource_id`) to prevent excessive API requests while the user is typing.

### Requirement 3: Event Detail View

**User Story:** As a platform administrator, I want to view all fields of a specific audit event so that I can investigate details such as metadata and failure_reason.

#### Acceptance Criteria

1. WHEN the user clicks a row in the Audit_Log_Table, THE Audit_Log_Page SHALL navigate to the `/audit-logs/{event_id}` route and display the Audit_Log_Detail.
2. THE Audit_Log_Detail SHALL display all fields of the `AuditLogResponse`: `id`, `event_id`, `event_type`, `event_version`, `occurred_at`, `correlation_id`, `request_id`, `trace_id`, `producer`, `actor_id`, `actor_type`, `action`, `resource_type`, `resource_id`, `outcome`, `metadata`, `failure_reason`, and `received_at`.
3. THE Audit_Log_Detail SHALL format the `metadata` field as readable indented JSON in an expandable `<pre><code>` block with internal scroll (limited max-height), to support larger payloads without breaking the layout. WHEN the field is null, SHALL display an absence indicator.
4. THE Audit_Log_Detail SHALL format the `failure_reason` field with visual emphasis when present (indicating failure), and display an absence indicator when null.
5. THE Audit_Log_Detail SHALL format date/time fields (`occurred_at`, `received_at`) in the localized format of the active language.
6. THE Audit_Log_Detail SHALL provide a navigation button to return to the listing. The filter and pagination state SHALL be preserved via query parameters on the `/audit-logs` route (e.g., `/audit-logs?event_type=AuditDocumentCreated&limit=50&offset=0`), allowing the state to be shareable and reproducible via URL.
7. WHILE the `GET /api/v1/audit-logs/{event_id}` request is in progress, THE Audit_Log_Detail SHALL display a loading indicator.
8. IF the API returns HTTP 404 for the requested `event_id`, THEN THE Audit_Log_Detail SHALL display a message informing the user that the record was not found, with an option to return to the listing.
9. THE Audit_Log_Detail SHALL display "copy to clipboard" buttons on UUID fields (`event_id`, `correlation_id`, `actor_id`, `resource_id`, `request_id`) to facilitate investigation and cross-referencing with logs from other services.

### Requirement 4: HTTP Error Handling

**User Story:** As a platform administrator, I want to receive clear feedback when errors occur while querying logs so that I know what happened and how to proceed.

#### Acceptance Criteria

1. IF the API returns HTTP 403, THEN THE Audit_Log_Page SHALL display the Forbidden_View with a message informing the user they do not have permission to access audit logs, without exposing technical details of the error response.
2. IF the API returns HTTP 401, THEN THE existing Auth_Interceptor SHALL handle the response according to the token refresh flow already implemented (Requirement 7 of login-ui). No additional 401 logic is needed in audit-ui.
3. IF the API returns HTTP 400 (bad_request), THEN THE Audit_Log_Page SHALL display an error message informing the user that the query parameters are invalid.
4. IF the API returns HTTP 503 (service_unavailable), THEN THE Audit_Log_Page SHALL display an error message informing the user that the audit service is temporarily unavailable, with an option to retry.
5. IF a network error occurs (timeout or connection refused), THEN THE Audit_Log_Page SHALL display a connectivity error message, with an option to retry.
6. THE Audit_Log_Page SHALL display error messages using the PrimeNG `p-message` or `p-toast` component, without exposing stack traces, request_id, or internal API details to the user.

### Requirement 5: Export Audit Logs

**User Story:** As a platform administrator, I want to export audit logs matching my current filters to CSV or JSON format so that I can analyze them offline or share them with stakeholders.

#### Acceptance Criteria

1. THE Audit_Log_Page SHALL display an "Export" button in the filter panel, next to the "Apply Filters" and "Clear" buttons.
2. WHEN the user clicks the "Export" button, THE Audit_Log_Page SHALL display a dropdown menu with two options: "CSV" and "JSON".
3. WHEN the user selects a format, THE Audit_Log_Service SHALL send a request to `GET {apiGatewayUrl}/api/v1/audit-logs/export` with the current filters as query parameters and `format=csv` or `format=json`.
4. THE export request SHALL apply the same filters currently active in the Audit_Log_Filter, allowing the user to export only the filtered subset of records.
5. WHEN the export request succeeds, THE browser SHALL automatically download the file with the filename provided in the `Content-Disposition` header (e.g., `audit_logs_export_20260327_143052.csv`).
6. WHILE the export request is in progress, THE "Export" button SHALL display a loading indicator and be disabled to prevent duplicate requests.
7. IF the export request fails (HTTP 400, 403, 503, or network error), THEN THE Audit_Log_Page SHALL display an error message using the i18n key `audit.export.error`.
8. THE backend export endpoint SHALL limit the export to a maximum of 10,000 records. IF the filtered result exceeds this limit, THE response SHALL include a truncation indicator, and THE Audit_Log_Page MAY display a warning message using the i18n key `audit.export.truncated`.

### Requirement 6: Route Protection and Access Control

**User Story:** As a platform developer, I want the audit-logs route to be protected by the existing Auth_Guard so that only authenticated users can access it.

#### Acceptance Criteria

1. THE `/audit-logs` and `/audit-logs/:eventId` routes SHALL be protected by the existing Auth_Guard via `canActivate`, ensuring only authenticated users access the feature.
2. WHEN an authenticated user without the `(audit_log, read)` permission accesses the route, THE Audit_Log_Service SHALL receive HTTP 403 from the backend, and THE Audit_Log_Page SHALL display the Forbidden_View (as per Requirement 4, AC 1).
3. THE Audit_Log_Page SHALL use lazy loading via `loadChildren` in the route configuration, so the feature module is loaded only when the user navigates to `/audit-logs`.

### Requirement 7: Internationalization (i18n)

**User Story:** As a platform user, I want the audit log interface to be available in English and Portuguese so that I can use it in my preferred language.

#### Acceptance Criteria

1. THE Audit_Log_Page SHALL use @ngx-translate/core translation keys for all user-visible strings, following the namespace format `audit.section.element` as per [ARCH-008].
2. THE Audit_Log_Page SHALL provide complete translations in `src/locales/en.json` and `src/locales/pt.json` for all labels, error messages, empty states, filter placeholders, and button texts.
3. THE Audit_Log_Page SHALL format date/time fields (`occurred_at`, `received_at`) according to the active locale (en: `MM/dd/yyyy HH:mm:ss`, pt: `dd/MM/yyyy HH:mm:ss`).
4. THE Audit_Log_Page SHALL translate `outcome` field values for display (`success` → "Success"/"Sucesso", `failure` → "Failure"/"Falha").
