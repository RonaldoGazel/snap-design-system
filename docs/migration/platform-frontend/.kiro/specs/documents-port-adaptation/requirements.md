# Requirements Document

## Introduction

This specification covers the adaptation of the documents feature that was copied from the ApolloUI prototype into the platform-frontend governed product. The ported files reside at `src/app/features/documents/` and include 30+ components, 12 services, shared UI components, models, and an editor subsystem. The work involves fixing broken import paths, expanding the route configuration, refactoring all CSS to follow SMACSS+BEM methodology, installing missing dependencies, and creating a zod+faker-based API mock layer so the feature can run independently of backend services during development.

## Glossary

- **Platform_Frontend**: The governed Angular 21 application at `platform-frontend/`, the target workspace for all changes.
- **ApolloUI**: The prototype Angular application from which the documents feature was originally copied.
- **Documents_Feature**: The set of components, services, models, and routes under `src/app/features/documents/` in Platform_Frontend.
- **Import_Resolver**: The TypeScript module resolution system that resolves import paths to actual files.
- **Route_Config**: The Angular `Routes` array in `documents.routes.ts` that maps URL paths to lazy-loaded components.
- **SMACSS_BEM**: The CSS architecture combining SMACSS categories (Base, Layout, Module, State, Theme) with BEM naming (Block, Element, Modifier) as defined in the `smacss-rules/` workspace.
- **Mock_Layer**: A set of zod schemas and faker-based data generators that intercept service calls and return realistic fake data matching the API contract.
- **Zod_Schema**: A runtime type-validation schema defined with the zod library that mirrors a TypeScript interface.
- **Faker_Generator**: A function using `@faker-js/faker` to produce randomized but structurally valid data conforming to a Zod_Schema.
- **ApiService**: The shared HTTP wrapper at `src/app/shared/services/api.service.ts` used by all document services.
- **Tiptap_Editor**: The rich-text editor component built on `@tiptap/core` and its extensions.
- **Security_Level_Guard**: A route guard that restricts access based on a minimum security clearance level.

## Requirements

### Requirement 1: Fix Broken Import Paths

**User Story:** As a developer, I want all import paths in the ported documents feature to resolve correctly within the platform-frontend folder structure, so that the project compiles without module-not-found errors.

#### Acceptance Criteria

1. WHEN the Platform_Frontend project is compiled, THE Import_Resolver SHALL resolve every import statement in the Documents_Feature without producing module-not-found errors.
2. WHEN a ported component references a shared model (e.g., `ApiResponse`, `Attachment`, enums), THE Import_Resolver SHALL resolve the path relative to `src/app/shared/` using the correct number of parent directory traversals for the file's depth.
3. WHEN the attachment service at `attachments/services/attachment.service.ts` references shared models, THE Import_Resolver SHALL use paths relative to `src/app/` (four levels up: `../../../../shared/`) instead of the current broken three-level paths (`../../../shared/`).
4. WHEN the editor template service at `editor/services/template.service.ts` imports `DocumentType`, THE Import_Resolver SHALL resolve it from either `src/app/shared/models/enums` or `pages/models/document.models` consistently with the rest of the Documents_Feature.
5. WHEN any component imports another component, service, or model within the Documents_Feature, THE Import_Resolver SHALL use relative paths that match the `src/app/features/documents/` directory structure.

### Requirement 2: Expand Route Configuration

**User Story:** As a user, I want to navigate to all document sub-pages (home, wizard, inbox, reviews, search, formalization, dissemination, apolization, editor, processes) via URL, so that the full documents workflow is accessible.

#### Acceptance Criteria

1. THE Route_Config SHALL define a root path (`''`) that loads the DocumentHomePage component.
2. THE Route_Config SHALL define a `novo` child path that lazy-loads the DocumentWizardComponent.
3. THE Route_Config SHALL define a `caixa-entrada` child path that lazy-loads the InboxComponent.
4. THE Route_Config SHALL define a `revisoes` child path that lazy-loads the ReviewPanelComponent.
5. THE Route_Config SHALL define a `busca` child path that lazy-loads the SearchPanelComponent.
6. THE Route_Config SHALL define a `formalizacao/:id` child path that lazy-loads the FormalizationPanelComponent.
7. THE Route_Config SHALL define a `difusao/:id` child path that lazy-loads the DisseminationPanelComponent.
8. THE Route_Config SHALL define an `apolizacao/:id` child path that lazy-loads the ApolizationPanelComponent.
9. THE Route_Config SHALL define an `editor/:id` child path that lazy-loads the DocumentEditorComponent.
10. THE Route_Config SHALL define a `processos` child path that lazy-loads the ProcessListComponent.
11. THE Route_Config SHALL define a `processos/:id` child path that lazy-loads the ProcessDetailComponent.
12. WHEN a route requires elevated security clearance, THE Route_Config SHALL attach a Security_Level_Guard with the appropriate `minSecurityLevel` data matching the ApolloUI configuration (level 2 for general access, level 3 for formalization and dissemination).

### Requirement 3: Install Missing Dependencies

**User Story:** As a developer, I want all required third-party packages installed in platform-frontend, so that the Tiptap editor and mock layer compile and function correctly.

#### Acceptance Criteria

1. THE Platform_Frontend SHALL include `@tiptap/core` as a dependency at a version compatible with the ApolloUI reference (^3.20.4).
2. THE Platform_Frontend SHALL include all Tiptap extension packages used by the Tiptap_Editor: `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-table`, `@tiptap/extension-table-row`, `@tiptap/extension-table-cell`, `@tiptap/extension-table-header`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/extension-placeholder`.
3. THE Platform_Frontend SHALL include `zod` as a dev dependency for defining API contract schemas in the Mock_Layer.
4. THE Platform_Frontend SHALL include `@faker-js/faker` as a dev dependency for generating realistic test data in the Mock_Layer.
5. WHEN installing packages, THE Platform_Frontend SHALL use `pnpm` as the package manager and pin versions using the caret range (`^`) consistent with existing dependencies.

### Requirement 4: Refactor CSS to SMACSS+BEM

**User Story:** As a developer, I want all CSS files in the documents feature to follow the SMACSS+BEM methodology, so that styles are maintainable, portable, and consistent with the project's architecture rules.

#### Acceptance Criteria

1. WHEN a CSS file belongs to a component in the Documents_Feature, THE CSS_Refactor SHALL convert all class names to BEM notation using the component name as the Block (e.g., `.document-home`, `.document-home__title`, `.document-home--compact`).
2. THE CSS_Refactor SHALL eliminate all nested selectors (e.g., `.parent .child`) and replace them with flat BEM element classes (e.g., `.parent__child`).
3. THE CSS_Refactor SHALL eliminate all bare element selectors (e.g., `h2`, `p`, `table`) inside component styles and replace them with BEM element classes.
4. WHEN a class represents a layout concern (major page sections, grids), THE CSS_Refactor SHALL use the `l-` prefix (e.g., `.l-document-grid`, `.l-document-grid__col`).
5. WHEN a class represents a temporary state toggled by JavaScript, THE CSS_Refactor SHALL use the `is-` prefix (e.g., `.is-active`, `.is-hidden`, `.is-saving`).
6. THE CSS_Refactor SHALL ensure BEM modifiers are always used alongside the base class in HTML templates (e.g., `class="card card--featured"`, never `class="card--featured"` alone).
7. THE CSS_Refactor SHALL avoid element nesting beyond one level (`.block__el1__el2` is prohibited; use `.block__el1-subpart` or a separate block instead).
8. WHEN the `documents-list` component uses `.scss`, THE CSS_Refactor SHALL convert it to `.css` to match the platform-frontend convention, or keep `.scss` only if the project explicitly supports it in the build configuration.
9. WHEN refactoring CSS, THE CSS_Refactor SHALL update the corresponding HTML templates to use the new BEM class names.

### Requirement 5: Create API Mock Layer with Zod and Faker

**User Story:** As a developer, I want a mock layer that intercepts API calls and returns realistic fake data matching the expected contracts, so that I can develop and test the documents feature without a running backend.

#### Acceptance Criteria

1. THE Mock_Layer SHALL define Zod_Schema definitions for every model interface in `pages/models/document.models.ts` (Process, Document, DocumentVersion, DocumentTemplate, Attachment, Tramitation, DocumentReview, FinalArtifact, IntegrityVerification, InternalDissemination, ExternalDissemination, DocumentMention, Notification, SearchResult, DocumentSearchItem).
2. THE Mock_Layer SHALL define Zod_Schema definitions for every payload interface in `pages/models/document.payloads.ts` (CreateProcessPayload, UpdateProcessPayload, CreateDocumentPayload, UpdateDocumentPayload, CreateTramitationPayload, RejectTramitationPayload, SubmitReviewPayload, CompleteReviewPayload, CreateInternalDisseminationPayload, CreateExternalDisseminationPayload, ApolloizePayload, ReviewMentionPayload, ImportDocumentPayload).
3. THE Mock_Layer SHALL provide Faker_Generator functions that produce valid instances of each model, with all required fields populated and optional fields randomly included.
4. THE Mock_Layer SHALL provide a mock implementation for each service in the Documents_Feature (DocumentService, ProcessService, ReviewService, SearchService, FormalizationService, DisseminationService, ApolizationService, NotificationService, TramitationService, TemplateService, AttachmentService) that returns Observable responses wrapping Faker-generated data in the `ApiResponse<T>` envelope.
5. THE Mock_Layer SHALL be injectable via Angular's dependency injection so that mock services can replace real services using `provide` with `useClass` in a development environment configuration.
6. WHEN a mock service method is called, THE Mock_Layer SHALL return data that passes validation against the corresponding Zod_Schema.
7. IF a mock service receives an invalid payload (as determined by the Zod_Schema for that payload), THEN THE Mock_Layer SHALL return an `ApiResponse` with `success: false` and a descriptive error message.
8. THE Mock_Layer SHALL place all schema definitions in a `mocks/schemas/` directory under the Documents_Feature and all mock services in a `mocks/services/` directory.

### Requirement 6: Zod Schema Round-Trip Validation

**User Story:** As a developer, I want to verify that zod schemas and faker generators are consistent, so that mock data always conforms to the expected API contract.

#### Acceptance Criteria

1. FOR ALL model Zod_Schemas, generating a value with the corresponding Faker_Generator and then parsing it with the Zod_Schema SHALL produce a successful parse result (round-trip property).
2. FOR ALL payload Zod_Schemas, generating a value with the corresponding Faker_Generator and then parsing it with the Zod_Schema SHALL produce a successful parse result (round-trip property).
3. WHEN a Faker_Generator produces a value, THE Zod_Schema parse output SHALL be deeply equal to the input value (no data loss or transformation during validation).

### Requirement 7: Sidebar and Navigation Integration

**User Story:** As a user, I want the documents entry in the sidebar to navigate to the documents home page and have all sub-routes functional, so that I can access the full documents workflow from the main navigation.

#### Acceptance Criteria

1. WHEN a user clicks the "Documents" entry in the sidebar, THE Platform_Frontend SHALL navigate to `/intelligence/documents` which loads the DocumentHomePage.
2. WHEN the Route_Config is loaded via lazy loading from `app.routes.ts`, THE Platform_Frontend SHALL resolve the `documentsRoutes` export from `documents.routes.ts` without errors.
3. THE Platform_Frontend SHALL preserve the existing AuthGuard on the shell route that wraps the `/intelligence/documents` path.

### Requirement 8: Component Compilation Integrity

**User Story:** As a developer, I want every component in the documents feature to compile successfully after all adaptations, so that the feature is ready for iterative development.

#### Acceptance Criteria

1. WHEN the Platform_Frontend project is built with `ng build`, THE Build_System SHALL produce zero compilation errors originating from files in the Documents_Feature.
2. WHEN a component declares `standalone: true`, THE Build_System SHALL verify that all referenced imports (other components, directives, pipes) are available and correctly imported.
3. WHEN a component uses `ChangeDetectionStrategy.OnPush`, THE Build_System SHALL verify that the component compiles with strict template checking enabled.
4. IF a ported component references a module or service that does not exist in Platform_Frontend (e.g., a guard from ApolloUI), THEN THE Adaptation SHALL either create an equivalent implementation or remove the reference and document the gap.
