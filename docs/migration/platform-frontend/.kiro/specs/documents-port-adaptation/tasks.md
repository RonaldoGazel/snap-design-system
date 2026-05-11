# Implementation Plan: Documents Port Adaptation

## Overview

This plan adapts the documents feature ported from ApolloUI into the platform-frontend workspace. Tasks are ordered by dependency: dependencies first, then import fixes, route expansion, CSS refactoring (grouped by subdirectory), mock layer creation, property-based tests, navigation verification, and a final compilation check. All code is TypeScript/Angular with CSS.

## Tasks

- [x] 1. Install missing dependencies
  - [x] 1.1 Add Tiptap production dependencies
    - Run `pnpm add @tiptap/core@^3.20.4 @tiptap/starter-kit@^3.20.4 @tiptap/extension-underline@^3.20.4 @tiptap/extension-text-align@^3.20.4 @tiptap/extension-table@^3.20.4 @tiptap/extension-table-row@^3.20.4 @tiptap/extension-table-cell@^3.20.4 @tiptap/extension-table-header@^3.20.4 @tiptap/extension-link@^3.20.4 @tiptap/extension-image@^3.20.4 @tiptap/extension-placeholder@^3.20.4`
    - Verify all 11 packages appear in `dependencies` section of `package.json`
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 1.2 Add mock layer dev dependencies
    - Run `pnpm add -D zod @faker-js/faker`
    - Verify both packages appear in `devDependencies` section of `package.json`
    - _Requirements: 3.3, 3.4, 3.5_

- [x] 2. Fix broken import paths
  - [x] 2.1 Fix attachment service imports (5 paths)
    - In `attachments/services/attachment.service.ts`, change all `../../../shared/` imports to `../../../../shared/`
    - Affected imports: `api-response.model`, `attachment.model`, `api.service`, `auth-state.service`, `constants`
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 2.2 Fix editor template service and resolve DocumentTemplate conflict
    - In `editor/services/template.service.ts`, remove the local `DocumentTemplate` interface
    - Import `DocumentType` from `../../pages/models/document.models` instead of `../../../shared/models/enums`
    - Define a new `EditorTemplate` interface (with fields: `type: DocumentType`, `label: string`, `description: string`, `content: string`)
    - Rename the class from `TemplateService` to `EditorTemplateService`
    - Update the `TEMPLATES` array type to `EditorTemplate[]`
    - Update all return types and method signatures to use `EditorTemplate`
    - Scan for any files importing from `editor/services/template.service.ts` and update their references to use `EditorTemplateService` and `EditorTemplate`
    - _Requirements: 1.4, 1.5_

  - [x] 2.3 Fix navigation paths in DocumentHomeComponent
    - In `pages/document-home/document-home.ts`, change all `router.navigate(['/intelligence', 'documentos', ...])` calls to `router.navigate(['/intelligence', 'documents', ...])`
    - Affected methods: `navigateToNewProcess`, `navigateToNewDocument`, `onDraftClick`, `onTramitationClick`, `onReviewClick`
    - _Requirements: 1.5, 7.1_

  - [x] 2.4 Scan all remaining ported files for broken imports
    - Check every `.ts` file under `src/app/features/documents/` for import paths that reference `../../../shared/` from depth-4 files (should be `../../../../shared/`)
    - Fix any additional broken relative paths found
    - _Requirements: 1.1, 1.2, 1.5_

- [x] 3. Expand route configuration
  - [x] 3.1 Replace documents.routes.ts with full 11-route config
    - Replace the single-route `documents.routes.ts` with the full route configuration from the design document
    - All 11 routes use `loadComponent` for lazy loading
    - Import `securityLevelGuard` from `../../shared/guards/security-level.guard`
    - Apply `minSecurityLevel: 3` to `formalizacao/:id` and `difusao/:id`
    - Apply `minSecurityLevel: 2` to `apolizacao/:id`, `editor/:id`, `processos`, and `processos/:id`
    - Leave home, novo, caixa-entrada, revisoes, busca without guards (parent shell AuthGuard suffices)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12_

- [x] 4. Checkpoint — Verify compilation after structural changes
  - Ensure all tests pass, ask the user if questions arise.
  - Run `pnpm build` in `platform-frontend/` to verify zero module-not-found errors
  - _Requirements: 1.1, 8.1_

- [x] 5. Refactor CSS to SMACSS+BEM — Pages group 1 (home, inbox, wizard, documents-list)
  - [x] 5.1 Refactor document-home CSS and HTML
    - Convert all class names to BEM with block `.document-home`
    - Eliminate nested selectors (`.document-home-header h2` → `.document-home__title`, `.kpi-section h3` → `.document-home__section-title`, `.dashboard-section h3` → `.document-home__section-title`)
    - Add `l-` prefix for layout containers (`.document-home-container` → `.l-document-home`)
    - Add `is-` prefix for JS-toggled states (`.notification-item.unread` → `.notification-item.is-unread`)
    - Update `document-home.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.9_

  - [x] 5.2 Refactor inbox CSS and HTML
    - Convert all class names to BEM with block `.inbox`
    - Eliminate nested selectors (`.inbox-container h2` → `.inbox__title`, `.dialog-content label` → `.inbox__dialog-label`)
    - Add `l-` prefix for layout containers
    - Update `inbox.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.9_

  - [x] 5.3 Refactor document-wizard CSS and HTML
    - Convert all class names to BEM with block `.document-wizard`
    - Eliminate nested selectors and bare element selectors
    - Update `document-wizard.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 5.4 Convert documents-list from SCSS to CSS and refactor to BEM
    - Rename `documents-list.scss` to `documents-list.css`
    - Update `styleUrl` in `documents-list.ts` from `.scss` to `.css`
    - Convert all class names to BEM with block `.documents-list`
    - Eliminate nested selectors and bare element selectors
    - Update `documents-list.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.8, 4.9_

- [x] 6. Refactor CSS to SMACSS+BEM — Pages group 2 (editor, review, search, formalization, dissemination, apolization)
  - [x] 6.1 Refactor document-editor CSS and HTML
    - Convert all class names to BEM with block `.document-editor`
    - Eliminate nested selectors and bare element selectors
    - Update `document-editor.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 6.2 Refactor review-panel CSS and HTML
    - Convert all class names to BEM with block `.review-panel`
    - Eliminate nested selectors and bare element selectors
    - Update `review-panel.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 6.3 Refactor search-panel CSS and HTML
    - Convert all class names to BEM with block `.search-panel`
    - Eliminate nested selectors and bare element selectors
    - Update `search-panel.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 6.4 Refactor formalization-panel CSS and HTML
    - Convert all class names to BEM with block `.formalization-panel`
    - Eliminate nested selectors and bare element selectors
    - Update `formalization-panel.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 6.5 Refactor dissemination-panel CSS and HTML
    - Convert all class names to BEM with block `.dissemination-panel`
    - Eliminate nested selectors and bare element selectors
    - Update `dissemination-panel.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 6.6 Refactor apolization-panel CSS and HTML
    - Convert all class names to BEM with block `.apolization-panel`
    - Eliminate nested selectors and bare element selectors
    - Update `apolization-panel.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

- [x] 7. Refactor CSS to SMACSS+BEM — Pages group 3 (process-list, process-detail, document-tree, document-viewer, document-form-dialog, version-history)
  - [x] 7.1 Refactor process-list CSS and HTML
    - Convert all class names to BEM with block `.process-list`
    - Eliminate nested selectors and bare element selectors
    - Update `process-list.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 7.2 Refactor process-detail CSS and HTML
    - Convert all class names to BEM with block `.process-detail`
    - Eliminate nested selectors and bare element selectors
    - Update `process-detail.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 7.3 Refactor document-tree CSS and HTML
    - Convert all class names to BEM with block `.document-tree`
    - Eliminate nested selectors and bare element selectors
    - Update `document-tree.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 7.4 Refactor document-viewer CSS and HTML
    - Convert all class names to BEM with block `.document-viewer`
    - Eliminate nested selectors and bare element selectors
    - Update `document-viewer.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 7.5 Refactor document-form-dialog HTML (no CSS file exists — add BEM classes if inline styles present)
    - Ensure any class names in `document-form-dialog.html` follow BEM with block `.document-form-dialog`
    - _Requirements: 4.1, 4.9_

  - [x] 7.6 Refactor version-history HTML (no CSS file in `pages/version-history/` — check shared version-history)
    - Refactor `pages/shared/version-history/version-history.css` and `.html` to BEM with block `.version-history`
    - Eliminate nested selectors and bare element selectors
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

- [x] 8. Refactor CSS to SMACSS+BEM — Shared components
  - [x] 8.1 Refactor classification-badge CSS and HTML
    - Convert all class names to BEM with block `.classification-badge`
    - Eliminate nested selectors and bare element selectors
    - Update `classification-badge.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 8.2 Refactor status-badge CSS and HTML
    - Convert all class names to BEM with block `.status-badge`
    - Eliminate nested selectors and bare element selectors
    - Update `status-badge.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 8.3 Refactor doc-navigation CSS and HTML
    - Convert all class names to BEM with block `.doc-navigation`
    - Eliminate nested selectors and bare element selectors
    - Update `doc-navigation.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 8.4 Refactor notification-badge CSS and HTML
    - Convert all class names to BEM with block `.notification-badge`
    - Eliminate nested selectors and bare element selectors
    - Update `notification-badge.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 8.5 Refactor routing-history CSS and HTML
    - Convert all class names to BEM with block `.routing-history`
    - Eliminate nested selectors and bare element selectors
    - Update `routing-history.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

- [x] 9. Refactor CSS to SMACSS+BEM — Editor and Attachments subsystems
  - [x] 9.1 Refactor tiptap-editor CSS and HTML
    - Convert toolbar and wrapper class names to BEM with block `.tiptap-editor`
    - Convert `.tiptap-toolbar button` nested selectors to `.tiptap-editor__toolbar-btn`
    - Convert `.tiptap-toolbar button.active` to `.tiptap-editor__toolbar-btn.is-active`
    - **Exception:** Keep ProseMirror content selectors under `.tiptap-editor__content .ProseMirror` as-is (documented exception — ProseMirror generates its own DOM)
    - Update `tiptap-editor.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.9_

  - [x] 9.2 Refactor rich-text-editor CSS and HTML
    - Convert all class names to BEM with block `.rich-text-editor`
    - Eliminate nested selectors and bare element selectors
    - Update `rich-text-editor.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 9.3 Refactor template-selector CSS and HTML
    - Convert all class names to BEM with block `.template-selector`
    - Eliminate nested selectors and bare element selectors
    - Update `template-selector.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 9.4 Refactor attachment-viewer CSS and HTML
    - Convert all class names to BEM with block `.attachment-viewer`
    - Eliminate nested selectors and bare element selectors
    - Update `attachment-viewer.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

  - [x] 9.5 Refactor file-upload CSS and HTML
    - Convert all class names to BEM with block `.file-upload`
    - Eliminate nested selectors and bare element selectors
    - Update `file-upload.html` to match new class names
    - _Requirements: 4.1, 4.2, 4.3, 4.9_

- [x] 10. Checkpoint — Verify compilation after CSS refactoring
  - Ensure all tests pass, ask the user if questions arise.
  - Run `pnpm build` in `platform-frontend/` to verify zero compilation errors after all CSS/HTML changes
  - _Requirements: 4.9, 8.1_

- [x] 11. Create mock layer — Zod schemas
  - [x] 11.1 Create model zod schemas
    - Create `src/app/features/documents/mocks/schemas/model.schemas.ts`
    - Define zod schemas for all 15 union types: `DocumentTypeSchema`, `ProcessStatusSchema`, `DocumentStatusSchema`, `SecurityClassificationSchema`, `PrioritySchema`, `TramitationStatusSchema`, `ReviewTypeSchema`, `ReviewStatusSchema`, `MentionTypeSchema`, `MentionStatusSchema`, `ExportFormatSchema`, `DisseminationStatusSchema`, `ExternalDisseminationStatusSchema`, `WorkflowStatusSchema`, `DocumentOriginSchema`
    - Define zod schemas for all model interfaces: `ProcessSchema`, `DocumentSchema`, `DocumentVersionSchema`, `DocumentTemplateSchema`, `AttachmentSchema`, `TramitationSchema`, `DocumentReviewSchema`, `FinalArtifactSchema`, `IntegrityVerificationSchema`, `InternalDisseminationSchema`, `ExternalDisseminationSchema`, `DocumentMentionSchema`, `NotificationSchema`, `SearchResultSchema`, `DocumentSearchItemSchema`
    - Use `z.lazy()` for recursive references (e.g., `Document.children`, `Document.attachments`, `Process.documents`)
    - _Requirements: 5.1_

  - [x] 11.2 Create payload zod schemas
    - Create `src/app/features/documents/mocks/schemas/payload.schemas.ts`
    - Define zod schemas for all 13 payload interfaces: `CreateProcessPayloadSchema`, `UpdateProcessPayloadSchema`, `CreateDocumentPayloadSchema`, `UpdateDocumentPayloadSchema`, `CreateTramitationPayloadSchema`, `RejectTramitationPayloadSchema`, `SubmitReviewPayloadSchema`, `CompleteReviewPayloadSchema`, `CreateInternalDisseminationPayloadSchema`, `CreateExternalDisseminationPayloadSchema`, `ApolloizePayloadSchema`, `ReviewMentionPayloadSchema`, `ImportDocumentPayloadSchema`
    - Import union type schemas from `model.schemas.ts` for reuse
    - _Requirements: 5.2_

- [x] 12. Create mock layer — Faker generators
  - [x] 12.1 Create model faker generators
    - Create `src/app/features/documents/mocks/generators/model.generators.ts`
    - Implement generator functions for all model interfaces: `generateProcess`, `generateDocument`, `generateDocumentVersion`, `generateDocumentTemplate`, `generateAttachment`, `generateTramitation`, `generateDocumentReview`, `generateFinalArtifact`, `generateIntegrityVerification`, `generateInternalDissemination`, `generateExternalDissemination`, `generateDocumentMention`, `generateNotification`, `generateSearchResult`, `generateDocumentSearchItem`
    - Each generator accepts optional `Partial<T>` overrides
    - All required fields populated with faker data; optional fields randomly included via `faker.datatype.boolean()`
    - _Requirements: 5.3_

  - [x] 12.2 Create payload faker generators
    - Create `src/app/features/documents/mocks/generators/payload.generators.ts`
    - Implement generator functions for all 13 payload interfaces
    - Each generator accepts optional `Partial<T>` overrides
    - _Requirements: 5.3_

- [x] 13. Create mock layer — Mock services and DI
  - [x] 13.1 Create mock document service
    - Create `src/app/features/documents/mocks/services/mock-document.service.ts`
    - Implement all public methods from `DocumentService` (getDocuments, getDocument, createDocument, updateDocument, deleteDocument, getVersions, getVersion, getAttachments, uploadAttachment, deleteAttachment)
    - Return `Observable<ApiResponse<T>>` with faker-generated data
    - Validate payloads with zod schemas; return `success: false` for invalid payloads
    - _Requirements: 5.4, 5.6, 5.7_

  - [x] 13.2 Create mock process service
    - Create `src/app/features/documents/mocks/services/mock-process.service.ts`
    - Implement all public methods from `ProcessService`
    - Validate payloads with zod schemas
    - _Requirements: 5.4, 5.6, 5.7_

  - [x] 13.3 Create mock tramitation service
    - Create `src/app/features/documents/mocks/services/mock-tramitation.service.ts`
    - Implement all public methods from `TramitationService`
    - Validate payloads with zod schemas
    - _Requirements: 5.4, 5.6, 5.7_

  - [x] 13.4 Create mock review service
    - Create `src/app/features/documents/mocks/services/mock-review.service.ts`
    - Implement all public methods from `ReviewService`
    - Validate payloads with zod schemas
    - _Requirements: 5.4, 5.6, 5.7_

  - [x] 13.5 Create mock search service
    - Create `src/app/features/documents/mocks/services/mock-search.service.ts`
    - Implement all public methods from `SearchService`
    - _Requirements: 5.4, 5.6_

  - [x] 13.6 Create mock formalization service
    - Create `src/app/features/documents/mocks/services/mock-formalization.service.ts`
    - Implement all public methods from `FormalizationService`
    - _Requirements: 5.4, 5.6_

  - [x] 13.7 Create mock dissemination service
    - Create `src/app/features/documents/mocks/services/mock-dissemination.service.ts`
    - Implement all public methods from `DisseminationService`
    - Validate payloads with zod schemas
    - _Requirements: 5.4, 5.6, 5.7_

  - [x] 13.8 Create mock apolization service
    - Create `src/app/features/documents/mocks/services/mock-apolization.service.ts`
    - Implement all public methods from `ApolizationService`
    - Validate payloads with zod schemas
    - _Requirements: 5.4, 5.6, 5.7_

  - [x] 13.9 Create mock notification service
    - Create `src/app/features/documents/mocks/services/mock-notification.service.ts`
    - Implement all public methods from `NotificationService`
    - _Requirements: 5.4, 5.6_

  - [x] 13.10 Create mock template service
    - Create `src/app/features/documents/mocks/services/mock-template.service.ts`
    - Implement all public methods from `TemplateService` (the API-backed one in `pages/services/`)
    - _Requirements: 5.4, 5.6_

  - [x] 13.11 Create mock attachment service
    - Create `src/app/features/documents/mocks/services/mock-attachment.service.ts`
    - Implement all public methods from `AttachmentService` (in `attachments/services/`)
    - _Requirements: 5.4, 5.6_

  - [x] 13.12 Create mock providers array
    - Create `src/app/features/documents/mocks/mock-providers.ts`
    - Export `DOCUMENT_MOCK_PROVIDERS: Provider[]` array with `{ provide: RealService, useClass: MockService }` for all 11 services
    - _Requirements: 5.5_

- [x] 14. Checkpoint — Verify mock layer compiles
  - Ensure all tests pass, ask the user if questions arise.
  - Run `pnpm build` in `platform-frontend/` to verify mock layer files compile without errors
  - _Requirements: 5.6, 8.1_

- [ ] 15. Property-based tests for mock layer
  - [ ]\* 15.1 Write property test for schema round-trip (models)
    - **Property 1: Schema round-trip with deep equality (models)**
    - Create `src/app/features/documents/mocks/schemas/model.schemas.pbt.spec.ts`
    - For each model generator/schema pair, use fast-check with `fc.assert` and `{ numRuns: 100 }`
    - Generate a value with the faker generator, parse with the zod schema, assert `result.success === true` and `result.data` deeply equals the generated value
    - Cover all 15 model schemas
    - **Validates: Requirements 5.1, 6.1, 6.3**

  - [ ]\* 15.2 Write property test for schema round-trip (payloads)
    - **Property 1: Schema round-trip with deep equality (payloads)**
    - Add payload round-trip tests to `model.schemas.pbt.spec.ts` or create a separate `payload.schemas.pbt.spec.ts`
    - For each payload generator/schema pair, use fast-check with `{ numRuns: 100 }`
    - Cover all 13 payload schemas
    - **Validates: Requirements 5.2, 6.2, 6.3**

  - [ ]\* 15.3 Write property test for mock service response validity
    - **Property 2: Mock service response envelope validity**
    - Create `src/app/features/documents/mocks/services/mock-services.pbt.spec.ts`
    - For each mock service method, use fast-check with `{ numRuns: 100 }`
    - Subscribe to the returned Observable, assert `response.success === true` and `response.data` passes the corresponding zod schema
    - Cover all 11 mock services
    - **Validates: Requirements 5.4, 5.6**

  - [ ]\* 15.4 Write property test for mock service payload rejection
    - **Property 3: Mock service payload rejection**
    - In `mock-services.pbt.spec.ts`, for each mock service method that accepts a payload
    - Generate a valid payload, then corrupt it (remove a required field or set it to an invalid type)
    - Assert the returned `ApiResponse` has `success: false` and a non-empty `error` string
    - Use fast-check with `{ numRuns: 100 }`
    - **Validates: Requirements 5.7**

- [x] 16. Sidebar and navigation integration verification
  - [x] 16.1 Verify sidebar navigation and AuthGuard
    - Confirm `app.routes.ts` lazy-loads `documentsRoutes` under `intelligence/documents` path
    - Confirm the shell route wrapping `/intelligence/documents` preserves `AuthGuard` on `canActivate`
    - Confirm `documents.routes.ts` exports `documentsRoutes` correctly
    - If any issues found, fix them
    - _Requirements: 7.1, 7.2, 7.3_

- [x] 17. Final checkpoint — Full compilation and component integrity
  - Ensure all tests pass, ask the user if questions arise.
  - Run `pnpm build` in `platform-frontend/` to verify zero compilation errors from the Documents Feature
  - Verify all standalone component imports resolve correctly
  - Verify strict template checking passes for OnPush components
  - Document any gaps (missing modules/services from ApolloUI that don't exist in platform-frontend)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major phase
- Property tests validate the three correctness properties defined in the design document using fast-check with 100 iterations
- The tiptap-editor ProseMirror selectors are a documented exception to SMACSS+BEM rules (design decision)
- The `documents-list.scss` → `.css` conversion is included in task 5.4
- CSS refactoring is grouped by subdirectory (pages group 1, pages group 2, pages group 3, shared, editor/attachments) to keep each task manageable
