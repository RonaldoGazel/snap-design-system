# Implementation Plan: Audit UI

## Overview

Incremental implementation of the audit-ui feature in the platform-frontend. Each task builds on the previous one, starting with data models and the HTTP service, moving through the page components, and finishing with route integration and full wiring. Property-based tests (fast-check) and unit tests (Vitest) accompany each step as sub-tasks.

## Tasks

- [x] 1. Configure test dependency and create data models
  - [x] 1.1 Add fast-check as a development dependency
    - Run `pnpm add -D fast-check` in the `platform-frontend/` directory
    - Confirm that `import fc from 'fast-check'` resolves correctly
    - _Requirements: Testing strategy from design_

  - [x] 1.2 Create TypeScript data model interfaces
    - Create `src/app/features/audit/models/audit-log.model.ts`
    - Implement interfaces: `AuditLogResponse`, `PaginatedAuditLogResponse`, `AuditLogFilterParams`, `AuditLogQueryParams`, `ApiErrorResponse`
    - Follow exactly the types defined in the "Data Models" section of the design
    - _Requirements: 1.2, 1.3, 2.1, 3.2_

  - [x] 1.3 Add i18n translation keys to locale files
    - Add `audit` namespace to `src/locales/en.json` with all keys defined in the "i18n — Translation Keys" section of the design (English values)
    - Add `audit` namespace to `src/locales/pt.json` with all corresponding keys (Portuguese values)
    - Ensure complete parity between en and pt
    - _Requirements: 6.1, 6.2_

  - [ ]* 1.4 Write property test for i18n key completeness
    - **Property 9: Translation key completeness and format**
    - Create `src/app/features/audit/models/audit-log.model.spec.ts`
    - Verify that every `audit.*` key in `en.json` exists in `pt.json` and vice versa
    - Verify that all keys follow the format `audit.{section}.{element}`
    - **Validates: Requirements 6.1, 6.2**

- [x] 2. Implement AuditLogService
  - [x] 2.1 Create the AuditLogService HTTP service
    - Create `src/app/features/audit/services/audit-log.service.ts`
    - Implement `getAuditLogs(filters: AuditLogQueryParams): Observable<PaginatedAuditLogResponse>` — builds HttpParams including only non-null filters, converts dates to ISO 8601
    - Implement `getAuditLogByEventId(eventId: string): Observable<AuditLogResponse>`
    - Use `environment.apiGatewayUrl` as base URL (`/api/v1/audit-logs`)
    - _Requirements: 1.1, 1.5, 2.2, 3.1_

  - [ ]* 2.2 Write property test for filter → query params mapping
    - **Property 2: Filter and pagination mapping to HTTP query params**
    - Create `src/app/features/audit/services/audit-log.service.spec.ts`
    - For any combination of filters (some null, some filled), verify that the HTTP request contains only non-null filters as query params, plus `limit` and `offset`
    - Use `HttpClientTestingModule` to intercept and inspect requests
    - **Validates: Requirements 1.5, 2.2**

  - [ ]* 2.3 Write property test for date range validation
    - **Property 3: Date range validation**
    - Add to `audit-log.service.spec.ts`
    - For any pair of dates where `occurred_before < occurred_after`, validation must reject; otherwise, must accept
    - **Validates: Requirement 2.4**

- [x] 3. Implement ForbiddenViewComponent
  - [x] 3.1 Create the ForbiddenViewComponent
    - Create `src/app/features/audit/components/forbidden-view/forbidden-view.component.ts`
    - Standalone component with `ChangeDetectionStrategy.OnPush`
    - Display i18n message (`audit.error.forbidden`) without technical details
    - Button to navigate to home page using key `audit.error.forbiddenAction`
    - Imports: `CardModule`, `ButtonModule`, `TranslateModule`
    - _Requirements: 4.1, 6.2_

  - [ ]* 3.2 Write property test for error message sanitization
    - **Property 8: Error message sanitization**
    - Create `src/app/features/audit/components/forbidden-view/forbidden-view.component.spec.ts`
    - For any `ApiErrorResponse` with random `request_id` and messages, verify that the rendered component does not contain the `request_id`, stack traces, or raw response body
    - **Validates: Requirement 4.6**

- [x] 4. Implement ExportButtonComponent
  - [x] 4.1 Add export method to AuditLogService
    - Add `exportAuditLogs(filters: Partial<AuditLogFilterParams>, format: 'csv' | 'json'): Observable<{ blob: Blob; filename: string }>` to `audit-log.service.ts`
    - Call `GET {apiGatewayUrl}/api/v1/audit-logs/export` with filters as query params and `format` param
    - Extract filename from `Content-Disposition` header (supports both `filename="..."` and `filename*=UTF-8''...` formats)
    - Return blob and filename for download
    - _Requirements: 5.3, 5.4_

  - [x] 4.2 Create the ExportButtonComponent
    - Create `src/app/features/audit/components/export-button/export-button.component.ts`
    - Standalone component with `ChangeDetectionStrategy.OnPush` and signals
    - Accept `@Input() filters: Partial<AuditLogFilterParams>` to pass current filters
    - Implement dropdown button with PrimeNG `p-menu` (popup) with CSV and JSON options
    - Implement loading state while export is in progress (disable button, show spinner)
    - Implement error handling: display error message via `p-message` using i18n key `audit.export.error`
    - Trigger browser download using `URL.createObjectURL` and anchor click
    - Imports: `ButtonModule`, `Menu`, `Message`, `TranslateModule`
    - _Requirements: 5.1, 5.2, 5.5, 5.6, 5.7_

  - [x] 4.3 Add i18n keys for export
    - Add `audit.export.button`, `audit.export.csv`, `audit.export.json`, `audit.export.error`, `audit.export.truncated` to `en.json` and `pt.json`
    - _Requirements: 5.7, 5.8, 7.1, 7.2_

  - [ ]* 4.4 Write unit tests for ExportButtonComponent
    - Create `src/app/features/audit/components/export-button/export-button.component.spec.ts`
    - Test dropdown menu renders with CSV and JSON options
    - Test loading state during export
    - Test error message display on failure
    - Test successful download triggers blob URL creation
    - _Requirements: 5.1–5.7_

- [ ] 5. Checkpoint — Verify foundation
  - Ensure all tests pass (`pnpm test`), ask the user if there are any questions.

- [x] 6. Implement AuditLogListComponent
  - [x] 6.1 Create the AuditLogListComponent with table and filters
    - Create `src/app/features/audit/pages/audit-log-list/audit-log-list.component.ts`
    - Standalone component with `ChangeDetectionStrategy.OnPush` and signals
    - Implement `p-table` with `[lazy]="true"`, columns as per design (occurred_at, event_type, actor_id, action, resource_type, resource_id, outcome, producer)
    - Implement server-side pagination mapping `PaginatedAuditLogResponse` envelope → p-table (`[value]`, `[totalRecords]`, `[rows]`, `[first]`)
    - Implement filter panel with all 9 controls (event_type, resource_type, outcome, producer, actor_id, correlation_id, resource_id, occurred_after, occurred_before) using PrimeNG components (InputText, Select, DatePicker)
    - Implement date range validation (`occurred_before` > `occurred_after`)
    - Implement "Apply Filters", "Clear", and ExportButtonComponent in filter actions area
    - Pass current filters to ExportButtonComponent via `[filters]` input
    - Implement bidirectional synchronization of filters/pagination with URL query params
    - Implement states: loading (skeleton/spinner), empty state, forbidden (ForbiddenViewComponent), error messages (p-message)
    - Implement HTTP error handling: 403 → forbidden view, 400 → inline message, 503/network → message with retry button
    - Implement navigation to detail on row click
    - Format `occurred_at` per active locale, translate `outcome` via i18n, truncate UUIDs with tooltip
    - Default rows per page: 50, options: [20, 50, 100]
    - _Requirements: 1.1–1.8, 2.1–2.4, 4.1, 4.3–4.6, 5.1, 6.2_

  - [ ]* 6.2 Write unit tests for AuditLogListComponent
    - Create `src/app/features/audit/pages/audit-log-list/audit-log-list.component.spec.ts`
    - Test table rendering with mock data
    - Test empty state (items: [], total: 0)
    - Test loading state
    - Test handling of each HTTP error code (403, 400, 503, network)
    - Test filter application and clearing
    - Test pagination (page and size changes)
    - Test export button is present and receives current filters
    - _Requirements: 1.1–1.8, 2.1–2.4, 4.1, 4.3–4.6, 5.1_

- [x] 7. Implement AuditLogDetailComponent
  - [x] 7.1 Create the AuditLogDetailComponent
    - Create `src/app/features/audit/pages/audit-log-detail/audit-log-detail.component.ts`
    - Standalone component with `ChangeDetectionStrategy.OnPush` and signals
    - Render all 18 fields of `AuditLogResponse` organized in logical sections with `p-card` (Identification, Timestamps, Traceability, Actor/Action, Resource, Outcome, Metadata)
    - Implement expandable `<pre><code>` block for metadata with indented JSON, max-height with scroll, absence indicator when null
    - Implement visual emphasis for `failure_reason` when present, absence indicator when null
    - Implement date/time formatting per active locale (en: `MM/dd/yyyy HH:mm:ss`, pt: `dd/MM/yyyy HH:mm:ss`)
    - Implement copy-to-clipboard buttons on UUID fields (event_id, correlation_id, actor_id, resource_id, request_id) with confirmation toast
    - Implement "Back to list" button preserving query params
    - Implement states: loading, not found (404 with back button), forbidden (403)
    - Implement HTTP error handling: 404 → not found message, 403 → forbidden view, 503/network → message with retry
    - _Requirements: 3.1–3.9, 4.1, 4.3–4.6_

  - [ ]* 7.2 Write property test for field completeness in detail view
    - **Property 4: Field completeness in detail view**
    - Create `src/app/features/audit/pages/audit-log-detail/audit-log-detail.component.spec.ts`
    - For any randomly generated `AuditLogResponse` (optional fields null or filled), verify that all 18 fields are rendered and null fields display an absence indicator
    - **Validates: Requirement 3.2**

  - [ ]* 7.3 Write property test for error message sanitization in detail view
    - **Property 8: Error message sanitization (detail)**
    - Add to `audit-log-detail.component.spec.ts`
    - For any `ApiErrorResponse`, verify that `request_id` and internal details are not exposed to the user
    - **Validates: Requirement 4.6**

- [ ] 8. Checkpoint — Verify components
  - Ensure all tests pass (`pnpm test`), ask the user if there are any questions.

- [x] 9. Configure routes and final integration
  - [x] 9.1 Create feature routes file and register in app.routes.ts
    - Create `src/app/features/audit/audit.routes.ts` with routes: `''` → AuditLogListComponent, `:eventId` → AuditLogDetailComponent
    - Add lazy-loaded route in `src/app/app.routes.ts`: `path: 'audit-logs'`, `loadChildren` pointing to `audit.routes.ts`, `canActivate: [AuthGuard]`
    - Insert the route BEFORE the `**` wildcard
    - _Requirements: 6.1, 6.3_

  - [ ]* 9.2 Write unit tests for route configuration
    - Add tests to `audit-log-list.component.spec.ts` or create a dedicated file
    - Verify that AuthGuard is configured in canActivate
    - Verify that lazy loading is configured via loadChildren
    - _Requirements: 6.1, 6.3_

- [ ] 10. Final checkpoint — Full validation
  - Ensure all tests pass (`pnpm test`), ask the user if there are any questions.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property-based tests validate universal correctness properties (fast-check)
- Unit tests validate specific examples and edge cases
- Mandatory properties for V1: 2, 3, 4, 8, 9 — the rest (1, 5, 6, 7) are nice-to-have
