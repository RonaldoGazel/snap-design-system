# Requirements Document

## Introduction

This feature replaces mock data fallbacks in platform-frontend's person module with real HTTP calls to the poi-service person API endpoints. The platform-frontend already has a `PersonServiceClient` that communicates with the poi-service, and components already attempt real API calls — but they silently fall back to hardcoded mock data on error or empty results. The goal is to remove these mock fallbacks so the UI reflects real data from the poi-service, while preserving a `useMocks` environment flag that re-enables mocks during standalone development when the poi-service is unavailable.

A critical aspect of this integration is that the real poi-service API returns a different response shape than the current frontend models expect. The API uses snake_case field names (e.g., `data_nascimento`, `cor_pele`, `estado_civil`), returns `sinais_caracteristicos` and `rotulos` as JSON strings, and provides graph provenance metadata (`_sources`, `_merged_from`) not present in the current models. A data mapper/adapter layer is required to bridge this gap.

## Glossary

- **PersonServiceClient**: Angular injectable HTTP client service that communicates with poi-service person endpoints (`/person/list`, `/person/{id}`, `/person/{id}/traverse`)
- **PersonDataService**: Renamed replacement for `MockDataService`; provides reactive Angular signals for person data consumed by dashboard and other components
- **ProfileComponent**: Angular component that displays full person detail, fetched via `PersonServiceClient.getPersonById()`
- **DashboardComponent**: Angular component that displays person listing, monitoring cards, and alerts
- **Pessoa**: Frontend TypeScript interface representing a person entity with camelCase fields
- **UnifiedPerson**: Frontend TypeScript interface representing a fully enriched person profile used by the profile page
- **PersonListResponse**: Typed response from `GET /person/list` containing `items`, `total`, `limit`, `offset`
- **TraverseResponse**: Typed response from `GET /person/{id}/traverse` containing `nodes` and `edges` arrays
- **ApiPersonMapper**: Data mapping layer that converts poi-service snake_case API responses to frontend camelCase models
- **poi-service**: Backend Python/FastAPI service exposing person query endpoints on port 8003
- **useMocks**: Boolean environment flag; `true` in standalone development, `false` in production and federated mode
- **AuthInterceptor**: Angular HTTP interceptor that attaches Bearer tokens to requests targeting `trustedOrigins`
- **Graph_Provenance**: Metadata fields `_sources` (array of `{ graph_id, display_name }`) and `_merged_from` (count) returned by poi-service indicating data origin

## Requirements

### Requirement 1: API Response Mapping

**User Story:** As a developer, I want a data mapping layer that converts poi-service API responses (snake_case, flat structure) to the frontend Pessoa and UnifiedPerson models (camelCase, nested structure), so that the UI can consume real API data without changes to existing templates.

#### Acceptance Criteria

1. WHEN the ApiPersonMapper receives a person list item from the API, THE ApiPersonMapper SHALL map `data_nascimento` to `dataNascimento`, `cor_pele` to `corPele`, `estado_civil` to `estadoCivil`, and `grau_instrucao` to `grauInstrucao`
2. WHEN the API response contains `sinais_caracteristicos` as a JSON string, THE ApiPersonMapper SHALL parse the string into a structured array of distinguishing mark objects
3. WHEN the API response contains `rotulos` as a JSON string, THE ApiPersonMapper SHALL parse the string into a string array of labels
4. WHEN the API response contains `_sources` and `_merged_from` provenance metadata, THE ApiPersonMapper SHALL preserve these fields on the mapped Pessoa object for downstream UI consumption
5. WHEN the API response omits optional fields (e.g., `cpf`, `rg`, `pai`, `naturalidade`), THE ApiPersonMapper SHALL default those fields to `undefined` or empty string without throwing errors
6. WHEN the API response contains a `fonte` field as a single string (e.g., `"SIPEN"`), THE ApiPersonMapper SHALL map it to the `fontes` array structure expected by the Pessoa model
7. FOR ALL valid API person responses, mapping to Pessoa and then mapping back to the API shape SHALL produce an equivalent object (round-trip property)

### Requirement 2: PersonServiceClient Enhancement

**User Story:** As a developer, I want the PersonServiceClient to return full pagination metadata from `listPersons()` and support a new `traversePerson()` method, so that the frontend can display pagination info and graph traversal data.

#### Acceptance Criteria

1. WHEN `listPersons()` is called, THE PersonServiceClient SHALL return a `PersonListResponse` object containing `items`, `total`, `total_merged`, `total_raw`, `limit`, and `offset` fields instead of only the `items` array
2. WHEN `traversePerson()` is called with a valid person UUID, THE PersonServiceClient SHALL send a `GET` request to `/person/{id}/traverse` with optional `depth` and `limit` query parameters and return a `TraverseResponse` containing `nodes` and `edges` arrays
3. WHEN `traversePerson()` is called with a `depth` parameter, THE PersonServiceClient SHALL clamp the value to the range [1, 5] before sending the request
4. WHEN `traversePerson()` is called with a `limit` parameter, THE PersonServiceClient SHALL clamp the value to the range [1, 2000] before sending the request
5. WHEN any PersonServiceClient method encounters an HTTP error, THE PersonServiceClient SHALL propagate the error as an Observable error for the caller to handle

### Requirement 3: PersonDataService (MockDataService Replacement)

**User Story:** As a developer, I want the MockDataService renamed to PersonDataService with conditional mock fallback controlled by the `useMocks` environment flag, so that production builds use only real API data while standalone development retains mock fallback.

#### Acceptance Criteria

1. THE PersonDataService SHALL expose a `pessoas` signal of type `Signal<Pessoa[]>` that emits person data fetched from `PersonServiceClient.listPersons()`
2. THE PersonDataService SHALL expose an `isLoading` signal of type `Signal<boolean>` that is `true` while the API call is in flight and `false` after resolution
3. THE PersonDataService SHALL expose an `error` signal of type `Signal<string | null>` that is `null` on success and contains an error message on failure
4. WHILE `useMocks` is `false` and the API call fails, THE PersonDataService SHALL set the `error` signal with a descriptive message and emit an empty array for `pessoas`
5. WHILE `useMocks` is `true` and the API call fails, THE PersonDataService SHALL fall back to `MOCK_PESSOAS` for the `pessoas` signal
6. WHEN the API returns a successful response with an empty `items` array, THE PersonDataService SHALL emit the empty array directly without falling back to mock data
7. THE PersonDataService SHALL retain the existing `getPessoaById()`, `getAlertasByPessoaId()`, `getVinculosByPessoaId()`, and `getTagsByPessoaId()` computed signal methods with unchanged signatures

### Requirement 4: ProfileComponent Mock Removal

**User Story:** As an analyst, I want the person profile page to display real data from the poi-service with proper loading and error states, so that I see actual person information instead of hardcoded mock data.

#### Acceptance Criteria

1. WHEN the ProfileComponent loads with a valid person ID route parameter, THE ProfileComponent SHALL fetch person detail via `PersonServiceClient.getPersonById()` and map the response through `mapPresoVisaoToUnifiedPerson()`
2. WHILE the API call is in flight, THE ProfileComponent SHALL display a loading skeleton placeholder
3. WHEN the API returns a 404 status, THE ProfileComponent SHALL display a "person not found" state with a back navigation button
4. WHEN the API returns a 403 status, THE ProfileComponent SHALL display an "access denied" message
5. WHILE `useMocks` is `false` and the API call fails with a non-404/non-403 error, THE ProfileComponent SHALL display a generic error state with the error message
6. WHILE `useMocks` is `true` and the API call fails, THE ProfileComponent SHALL fall back to `UNIFIED_PERSON_MOCK`
7. THE ProfileComponent SHALL remove the `UNIFIED_PERSON_MOCK` as the initial value and default fallback, using `null` as the initial value instead

### Requirement 5: DashboardComponent Real Data Integration

**User Story:** As an analyst, I want the person dashboard to display real person data from the poi-service instead of hardcoded mock cards, so that the monitoring view reflects the actual state of the system.

#### Acceptance Criteria

1. THE DashboardComponent SHALL inject `PersonDataService` instead of `MockDataService`
2. THE DashboardComponent SHALL read the `pessoas` signal from PersonDataService to populate the monitoring cards
3. THE DashboardComponent SHALL remove the hardcoded `MONITORADOS_EXTRAS` array and use only API-sourced data
4. WHILE `PersonDataService.isLoading` is `true`, THE DashboardComponent SHALL display skeleton loading placeholders for the monitoring cards section
5. WHEN `PersonDataService.error` is non-null, THE DashboardComponent SHALL display an error banner with the error message and a retry option
6. WHEN the `pessoas` signal emits an empty array, THE DashboardComponent SHALL display an empty state message prompting the user to run a SNAP or SIPEN query

### Requirement 6: Sparse Field Handling

**User Story:** As an analyst, I want the UI to gracefully handle persons with minimal data (e.g., only `uuid`, `nome`, `fonte`), so that I can still view and navigate to persons even when most fields are empty.

#### Acceptance Criteria

1. WHEN a Pessoa object has empty `perfis` and `fontes` arrays, THE UI components SHALL render the person card without errors, using sensible defaults for profile type and source display
2. WHEN a person detail response lacks fields present in the rich mock data (e.g., `contatos`, `empresas`, `mandadosPrisao`, `processosJudiciais`), THE mapPresoVisaoToUnifiedPerson mapper SHALL default those sections to empty arrays or undefined
3. WHEN the `indicadoresAnaliticos` field is absent from the API response, THE DashboardComponent SHALL default the risk level to `'baixo'` for display purposes
4. WHEN the `perfis` array is empty, THE DashboardComponent SHALL derive a profile type from the `rotulos` JSON string if available (e.g., `"Inmate"` maps to `'preso'`, `"Visitor"` maps to `'visitante'`, `"Lawyer"` maps to `'advogado'`)

### Requirement 7: Graph Provenance Display

**User Story:** As an analyst, I want to see the data provenance information (source graphs and merge count) for each person, so that I can understand where the data originated and whether records were merged.

#### Acceptance Criteria

1. WHEN a person has `_sources` metadata, THE ProfileComponent SHALL display the source graph names (e.g., "Grafo Publico") in the person detail view
2. WHEN a person has `_merged_from` count greater than 1, THE ProfileComponent SHALL display a merge indicator showing the number of source records that were merged
3. WHEN a person in the list has `_sources` metadata, THE DashboardComponent SHALL display a provenance badge or tooltip on the person card

### Requirement 8: Environment Flag for Mock Data

**User Story:** As a developer, I want a `useMocks` flag in the environment configuration that controls whether mock data fallback is enabled, so that standalone development works without the poi-service while production builds never show mock data.

#### Acceptance Criteria

1. THE environment configuration SHALL include a `useMocks` boolean property defaulting to `false`
2. WHILE `useMocks` is `false`, THE PersonDataService and ProfileComponent SHALL propagate API errors to the UI without falling back to mock data
3. WHILE `useMocks` is `true`, THE PersonDataService and ProfileComponent SHALL fall back to mock data when the API is unreachable
4. THE `useMocks` flag SHALL be set to `true` only in the standalone development environment configuration

### Requirement 9: Internationalization for New UI States

**User Story:** As a user, I want error messages, empty states, and loading indicators to be displayed in my language, so that the interface is consistent with the rest of the platform.

#### Acceptance Criteria

1. WHEN the ProfileComponent displays a "person not found" state, THE system SHALL use an i18n translation key (e.g., `person.error.notFound`)
2. WHEN the ProfileComponent displays an "access denied" state, THE system SHALL use an i18n translation key (e.g., `person.error.accessDenied`)
3. WHEN the ProfileComponent displays a generic error state, THE system SHALL use an i18n translation key (e.g., `person.error.generic`)
4. WHEN the DashboardComponent displays an empty state, THE system SHALL use an i18n translation key (e.g., `person.dashboard.emptyState`)
5. WHEN the DashboardComponent displays an error banner, THE system SHALL use an i18n translation key (e.g., `person.dashboard.errorBanner`)
6. WHEN provenance metadata is displayed, THE system SHALL use i18n translation keys for labels (e.g., `person.provenance.sources`, `person.provenance.mergedFrom`)

### Requirement 10: Import Path Migration

**User Story:** As a developer, I want all references to `MockDataService` updated to `PersonDataService` across the codebase, so that the rename does not break any existing functionality.

#### Acceptance Criteria

1. WHEN the MockDataService is renamed to PersonDataService, THE system SHALL update all import statements referencing `MockDataService` or `mock-data.service` across the entire platform-frontend codebase
2. WHEN the file is renamed from `mock-data.service.ts` to `person-data.service.ts`, THE system SHALL update all file path references in import statements
3. THE renamed PersonDataService SHALL maintain the same `providedIn: 'root'` injectable scope and the same public API surface as the original MockDataService
