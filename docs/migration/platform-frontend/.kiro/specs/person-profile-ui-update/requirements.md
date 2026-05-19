# Requirements Document

## Introduction

This feature promotes `ProfileNewComponent` from a static, hardcoded preview to the canonical person profile show page in the `platform-frontend` Angular application. The work covers four tightly coupled concerns: (1) updating all list-page CTAs in `DashboardComponent` to navigate to the `profile-new` route, (2) wiring `ProfileNewComponent` to live API data via `PersonServiceClient.getPersonById()` and a new mapper `mapApiResponseToPersonRecord()`, (3) cleaning up the old `ProfileComponent` route entry and converting `profile-new` to lazy-loaded, and (4) adding a production-only graph CTA entrypoint that opens the `graph-visualization-remote` federated module for the current person.

---

## Glossary

- **ProfileNewComponent**: The Angular standalone component at `pages/profile-new/profile-new.component.ts` that renders the person profile show page.
- **ProfileComponent**: The legacy profile show page at `pages/profile/profile.component.ts`. Its route entry is removed by this feature; the component files are preserved for reference.
- **DashboardComponent**: The person list page at `pages/dashboard/dashboard.component.ts`. Contains all CTAs that navigate to the profile show page.
- **PersonServiceClient**: The Angular service that wraps HTTP calls to the `poi-service` API, including `getPersonById(id)`.
- **PersonRecord**: The TypeScript interface defined in `profile-new.component.ts` that describes the full data shape consumed by `ProfileNewComponent`.
- **PERSON_RECORD_DATA**: The static mock constant of type `PersonRecord` used as a fallback when `environment.useMocks = true` and the API call fails.
- **Mapper**: The pure function `mapApiResponseToPersonRecord()` defined in `profile-new-mapper.ts` that transforms a raw API response into a `PersonRecord`.
- **Router**: The Angular `Router` service used for programmatic navigation.
- **ActivatedRoute**: The Angular service that provides access to the current route's parameters.
- **Location**: The Angular `Location` service used for browser history navigation.
- **useMocks**: The build-time boolean flag from `environment.ts` (`environment.useMocks`) that controls whether mock fallback data is used.
- **isLoading**: A writable Angular signal on `ProfileNewComponent` that tracks whether an API call is in progress.
- **errorSignal**: A writable Angular signal on `ProfileNewComponent` that holds a non-recoverable error message, or `null` when no error is present.
- **httpStatus**: A writable Angular signal on `ProfileNewComponent` that holds the HTTP status code of a failed API call (e.g., 404, 403), or `null` when no HTTP error has occurred.
- **person**: A writable Angular signal on `ProfileNewComponent` that holds the current `PersonRecord` being rendered.
- **poi-service**: The backend REST API that exposes `GET /person/:id` and returns a raw `Record<string, unknown>` response.
- **graph-visualization-remote**: The federated micro-frontend module that renders the relationship graph for a person. Loaded by `mfe-host` from CFMDS at runtime. Only available in the production MFE environment.
- **isProduction**: The build-time boolean flag `environment.production` from `environment.prod.ts`. `true` in production builds, `false` in local development.

---

## Requirements

### Requirement 1: CTA Navigation Update

**User Story:** As a user browsing the person list, I want clicking a person card to open the new profile page, so that I see live data instead of the legacy static profile.

#### Acceptance Criteria

1. WHEN a user clicks a person card in the monitored tab, THE DashboardComponent SHALL navigate to `['/intelligence/person', pessoaId, 'profile-new']`.
2. WHEN a user clicks a person card in the listing tab, THE DashboardComponent SHALL navigate to `['/intelligence/person', pessoaId, 'profile-new']`.
3. WHEN a user clicks a person card in the search results tab, THE DashboardComponent SHALL navigate to `['/intelligence/person', pessoaId, 'profile-new']`.
4. WHEN a pending item is selected and `navegarPendencia()` resolves a person ID, THE DashboardComponent SHALL navigate to `['/intelligence/person', pessoaId, 'profile-new']`.
5. THE DashboardComponent SHALL NOT navigate to `['/intelligence/person', pessoaId, 'profile']` from any CTA.

---

### Requirement 2: Route Configuration

**User Story:** As a developer, I want the routing configuration to reflect the canonical profile route, so that the application has a single, live-data-backed profile show page.

#### Acceptance Criteria

1. THE Router SHALL resolve the path `:id/profile-new` to `ProfileNewComponent` using a lazy-loaded `loadComponent` import.
2. THE Router SHALL NOT contain a route entry for the path `:id/profile` after this change is applied.
3. WHEN the Angular application is built, THE Router SHALL load `ProfileNewComponent` lazily (via dynamic `import()`) rather than eagerly.

---

### Requirement 3: Route Parameter Reading

**User Story:** As a user navigating to a person profile, I want the profile page to load the correct person's data, so that I see information specific to the person I selected.

#### Acceptance Criteria

1. WHEN `ProfileNewComponent` is activated, THE ProfileNewComponent SHALL read the `:id` parameter from `ActivatedRoute.paramMap`.
2. WHEN the `:id` parameter is present and non-empty, THE ProfileNewComponent SHALL use that value as the `personId` for the subsequent API call.
3. IF the `:id` parameter is absent or empty, THEN THE ProfileNewComponent SHALL set `isLoading` to `false` and render an empty state without making an API call.

---

### Requirement 4: API Data Loading

**User Story:** As a user viewing a person profile, I want the page to fetch and display live data from the API, so that I see accurate and up-to-date information.

#### Acceptance Criteria

1. WHEN `ProfileNewComponent` begins loading a person, THE ProfileNewComponent SHALL set `isLoading` to `true` before calling `PersonServiceClient.getPersonById()`.
2. WHEN `PersonServiceClient.getPersonById(personId)` is called, THE ProfileNewComponent SHALL pass the `personId` extracted from the route parameter as the argument.
3. WHEN `PersonServiceClient.getPersonById()` returns a successful response, THE ProfileNewComponent SHALL pass the raw response to `mapApiResponseToPersonRecord()` to produce a `PersonRecord`.
4. WHEN `mapApiResponseToPersonRecord()` returns a `PersonRecord`, THE ProfileNewComponent SHALL update the `person` signal with the mapped value.
5. WHEN the API call completes (success or error), THE ProfileNewComponent SHALL set `isLoading` to `false`.
6. WHEN the user navigates to a different person profile while a request is in flight, THE ProfileNewComponent SHALL cancel the previous in-flight request before initiating a new one.

---

### Requirement 5: API Response Mapping

**User Story:** As a developer, I want a dedicated mapper function to translate raw API responses into the `PersonRecord` shape, so that `ProfileNewComponent` is decoupled from the raw API contract.

#### Acceptance Criteria

1. THE Mapper SHALL accept a single argument of type `Record<string, unknown>` and return a value of type `PersonRecord`.
2. THE Mapper SHALL map the API field `nome` to `PersonRecord.name`.
3. THE Mapper SHALL map the API field `foto_url` (falling back to `fotoUrl`) to `PersonRecord.photo`, defaulting to `''` when both are absent.
4. THE Mapper SHALL map the API field `id` (falling back to `uuid`) to `PersonRecord.id`, defaulting to `''` when both are absent.
5. THE Mapper SHALL map the API field `vulgos` to `PersonRecord.aliases`, defaulting to `[]` when absent.
6. THE Mapper SHALL map the API field `tagsRelevantes` to `PersonRecord.tags`, defaulting to `[]` when absent.
7. THE Mapper SHALL map custody fields (`situacao_prisional` / `custody`) to `PersonRecord.situation`.
8. THE Mapper SHALL map contact and address fields from `contatos` to `PersonRecord.contacts` and `PersonRecord.addresses`.
9. THE Mapper SHALL map event and movement fields to `PersonRecord.custody`.
10. THE Mapper SHALL map legal fields (`condenacoes`, `mandados`) to `PersonRecord.legal`.
11. THE Mapper SHALL map relation fields (`vinculos`, `visitantes`, `advogados`) to `PersonRecord.relations`.
12. THE Mapper SHALL map public life fields (`informacoes_eleitorais`, `transparencia`, `perfis_digitais`) to `PersonRecord.publicLife`.
13. THE Mapper SHALL set `PersonRecord.aiSummary` to `{ paragraphs: [], sources: [] }` when the field is not available from the API.
14. THE Mapper SHALL set `PersonRecord.documents` to `[]` when the field is not available from the API.
15. IF any field in the raw API response is absent, null, or undefined, THEN THE Mapper SHALL substitute a safe empty value (`''` for strings, `[]` for arrays, `null` for nullable references) without throwing an exception.
16. THE Mapper SHALL NOT mutate the input `raw` object.
17. FOR ALL valid inputs, THE Mapper SHALL produce identical output when called multiple times with the same input (pure function).

---

### Requirement 6: Error Handling — HTTP 404

**User Story:** As a user navigating to a person profile that does not exist, I want to see a clear not-found message, so that I understand the person record is unavailable.

#### Acceptance Criteria

1. WHEN `PersonServiceClient.getPersonById()` returns an HTTP 404 response, THE ProfileNewComponent SHALL set `httpStatus` to `404`.
2. WHEN `httpStatus` is `404`, THE ProfileNewComponent SHALL set `isLoading` to `false`.
3. WHEN `httpStatus` is `404`, THE ProfileNewComponent SHALL render a "Pessoa não encontrada" empty state with a back button.

---

### Requirement 7: Error Handling — HTTP 403

**User Story:** As a user attempting to view a person profile they are not authorized to access, I want to see a clear access-denied message, so that I understand why the profile is not displayed.

#### Acceptance Criteria

1. WHEN `PersonServiceClient.getPersonById()` returns an HTTP 403 response, THE ProfileNewComponent SHALL set `httpStatus` to `403`.
2. WHEN `httpStatus` is `403`, THE ProfileNewComponent SHALL set `isLoading` to `false`.
3. WHEN `httpStatus` is `403`, THE ProfileNewComponent SHALL render an "Acesso negado" state.

---

### Requirement 8: Error Handling — Generic API Failure with Mock Fallback

**User Story:** As a developer running the application in mock mode, I want the profile page to fall back to static mock data when the API is unavailable, so that the UI remains functional during development.

#### Acceptance Criteria

1. WHEN `PersonServiceClient.getPersonById()` returns an HTTP error that is not 404 or 403, AND `useMocks` is `true`, THEN THE ProfileNewComponent SHALL set the `person` signal to `PERSON_RECORD_DATA`.
2. WHEN the mock fallback is applied, THE ProfileNewComponent SHALL set `isLoading` to `false`.
3. WHEN the mock fallback is applied, THE ProfileNewComponent SHALL render the profile using `PERSON_RECORD_DATA` without displaying an error state.

---

### Requirement 9: Error Handling — Generic API Failure without Mock Fallback

**User Story:** As a user in a production environment, I want to see a meaningful error message when the profile fails to load, so that I can take action (e.g., retry or go back).

#### Acceptance Criteria

1. WHEN `PersonServiceClient.getPersonById()` returns an HTTP error that is not 404 or 403, AND `useMocks` is `false`, THEN THE ProfileNewComponent SHALL set `errorSignal` to the error message string.
2. WHEN `errorSignal` is set, THE ProfileNewComponent SHALL set `isLoading` to `false`.
3. WHEN `errorSignal` is set, THE ProfileNewComponent SHALL render an error banner with a retry option.

---

### Requirement 10: Loading State

**User Story:** As a user waiting for a person profile to load, I want to see a loading indicator, so that I know the application is fetching data.

#### Acceptance Criteria

1. WHILE `isLoading` is `true`, THE ProfileNewComponent SHALL render a loading skeleton in place of the profile content.
2. WHILE `isLoading` is `true`, THE ProfileNewComponent SHALL NOT render the profile content, error state, or HTTP error states.

---

### Requirement 11: Back Navigation

**User Story:** As a user viewing a person profile, I want a back button that returns me to the previous page, so that I can continue browsing the list without a full page reload.

#### Acceptance Criteria

1. WHEN a user activates the back button in `ProfileNewComponent`, THE ProfileNewComponent SHALL call `Location.back()`.
2. THE ProfileNewComponent SHALL NOT perform a full page reload when navigating back.

---

### Requirement 12: Mock Data Isolation

**User Story:** As a system operator running the application in production, I want to ensure that static mock data is never rendered as real person data, so that users are not shown fabricated information.

#### Acceptance Criteria

1. WHILE `useMocks` is `false`, THE ProfileNewComponent SHALL NOT use `PERSON_RECORD_DATA` as the source of rendered content under any circumstance.
2. WHERE `useMocks` is `true`, THE ProfileNewComponent SHALL use `PERSON_RECORD_DATA` only as a fallback when the API call fails with a non-404, non-403 error.

---

### Requirement 13: Existing UI Interactions Preserved

**User Story:** As a user interacting with the person profile page, I want all existing UI features (scroll-spy, lightbox, drawer, tabs, map) to continue working after the data source changes, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN `ProfileNewComponent` renders with live API data, THE ProfileNewComponent SHALL preserve all scroll-spy navigation behavior.
2. WHEN `ProfileNewComponent` renders with live API data, THE ProfileNewComponent SHALL preserve all lightbox photo viewing behavior.
3. WHEN `ProfileNewComponent` renders with live API data, THE ProfileNewComponent SHALL preserve all drawer open/close behavior.
4. WHEN `ProfileNewComponent` renders with live API data, THE ProfileNewComponent SHALL preserve all tab navigation behavior.
5. WHEN `isLoading` becomes `false` and address data is available, THE ProfileNewComponent SHALL initialize the Leaflet map only after the loading state resolves.

---

### Requirement 14: Graph Visualization MFE Entrypoint

**User Story:** As an intelligence analyst viewing a person profile in the production environment, I want a "Ver Grafo de Vínculos" button that opens the relationship graph for the current person, so that I can explore the person's network connections without leaving the platform.

#### Acceptance Criteria

1. WHEN `environment.production` is `true` AND the user has the `intelligence:graph-viewer` permission AND `personId` is non-empty, THE ProfileNewComponent SHALL render a graph CTA button labeled with the `person.profile.openGraph` i18n key.
2. WHEN the graph CTA button is activated, THE ProfileNewComponent SHALL navigate to `['/intelligence/person', personId, 'graph']`.
3. WHEN `environment.production` is `false`, THE ProfileNewComponent SHALL NOT render the graph CTA button under any circumstance.
4. WHEN the user does NOT have the `intelligence:graph-viewer` permission, THE ProfileNewComponent SHALL NOT render the graph CTA button.
5. WHEN `personId` is empty or null, THE graph CTA button SHALL be disabled (not interactive).
6. THE graph CTA button SHALL use the `person.profile.openGraph` i18n key for its label in both `pt-BR` and `en` locales.
7. THE graph CTA button SHALL NOT appear in the loading state (`isLoading = true`), 404 state, or 403 state.
