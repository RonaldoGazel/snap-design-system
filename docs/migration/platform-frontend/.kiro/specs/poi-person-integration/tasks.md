# Implementation Plan: POI Person Integration

## Overview

Replace mock data fallbacks in platform-frontend's person module with real HTTP calls to poi-service person API endpoints. The real API returns a different response shape (snake_case, flat, sparse) than the current frontend models — a mapper layer bridges this gap. A `useMocks` environment flag preserves standalone development workflow. Implementation proceeds bottom-up: environment config → mapper → service client → data service → components → i18n.

## Tasks

- [x] 1. Add `useMocks` environment flag and extend Pessoa model for provenance
  - [x] 1.1 Add `useMocks: false` to `src/environments/environment.ts`
    - Add `useMocks: false` property to the environment object
    - This flag controls whether mock data fallback is enabled on API errors
    - _Requirements: 8.1, 8.4_

  - [x] 1.2 Extend Pessoa interface with provenance metadata fields
    - Add optional `_sources?: Array<{ graph_id: string; display_name: string }>` to the `Pessoa` interface in `src/app/features/person/models/pessoa.model.ts`
    - Add optional `_merged_from?: number` to the `Pessoa` interface
    - Add optional `rotulos?: string[]` for parsed label data
    - These fields come from the real poi-service API (see #[[file:return_list.json]])
    - _Requirements: 1.4, 7.1, 7.2, 7.3_

- [x] 2. Create ApiPersonMapper for snake_case → camelCase conversion
  - [x] 2.1 Create `src/app/features/person/services/api-person-mapper.ts`
    - Implement `mapApiPersonToPessoa(raw: Record<string, unknown>): Pessoa` function
    - Map snake_case fields: `data_nascimento` → `dataNascimento`, `cor_pele` → `corPele`, `estado_civil` → `estadoCivil`, `grau_instrucao` → `grauInstrucao`
    - Parse `sinais_caracteristicos` from JSON string to structured array
    - Parse `rotulos` from JSON string to string array
    - Map single `fonte` string (e.g., `"SIPEN"`) to `fontes` array: `[{ tipo: "SIPEN", status: "ativo" }]`
    - Preserve `_sources` and `_merged_from` provenance metadata on the output
    - Default missing optional fields to `undefined` or empty arrays without throwing
    - Use the real API response shape from #[[file:return_list.json]] as the input contract
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x] 2.2 Implement `mapApiPersonListToPessoas(raw: Record<string, unknown>): Pessoa[]` function
    - Accept the full list response object (with `items` array)
    - Map each item through `mapApiPersonToPessoa()`
    - Return the mapped `Pessoa[]` array
    - _Requirements: 1.1, 1.5_

  - [x] 2.3 Implement `derivePerfilFromRotulos(rotulos: string[]): Perfil[]` helper
    - When `perfis` array is empty and `rotulos` is available, derive profile type from labels
    - Map: `"Inmate"` → `preso`, `"Visitor"` → `visitante`, `"Lawyer"` → `advogado`, `"Person"` → skip (too generic)
    - Return a `Perfil[]` array with `ativo: true` and empty `detalhes`
    - _Requirements: 6.4_

  - [x] 2.4 Update `mapPresoVisaoToUnifiedPerson()` in `preso-visao-mapper.ts` for real API shape
    - Handle the real detail response shape from #[[file:detail_sipen.json]] and #[[file:detail_snap.json]]
    - Map `data_nascimento` → `birthDate`, `cor_pele` → `ethnicity`, `grau_instrucao` → `education`, `estado_civil` → `maritalStatus`
    - Map `condenacoes` array to custody/legal record sections where applicable
    - Map `visitantes` array (UUID references) to visitors section
    - Map `eventos` array to penal history events
    - Preserve `_sources` and `_merged_from` on the output
    - Default all missing rich sections (contatos, empresas, mandados, etc.) to empty arrays/undefined
    - _Requirements: 1.1, 1.5, 6.2_

  - [x] 2.5 Write unit tests for ApiPersonMapper
    - Test mapping with full SIPEN response (use #[[file:detail_sipen.json]] as fixture)
    - Test mapping with minimal SNAP response (use #[[file:detail_snap.json]] as fixture)
    - Test mapping with sparse person (only `uuid`, `nome`, `fonte`)
    - Test `sinais_caracteristicos` JSON string parsing
    - Test `rotulos` JSON string parsing and profile derivation
    - Test `_sources` and `_merged_from` preservation
    - Test missing optional fields default gracefully
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1, 6.2, 6.3_

- [x] 3. Enhance PersonServiceClient
  - [x] 3.1 Change `listPersons()` to return full `PersonListResponse` with mapping
    - Update return type from `Observable<Pessoa[]>` to `Observable<PersonListResponse>`
    - Add `total_merged` and `total_raw` fields to the `PersonListResponse` interface
    - Apply `mapApiPersonListToPessoas()` to the `items` array inside the pipe
    - Remove the existing `.pipe(map((res) => res.items))` — return the full response object with mapped items
    - _Requirements: 2.1_

  - [x] 3.2 Add `traversePerson()` method
    - Add `TraverseParams` interface: `{ depth?: number; limit?: number }`
    - Add `TraverseResponse` interface: `{ nodes: GraphNode[]; edges: GraphEdge[] }`
    - Add `GraphNode` and `GraphEdge` interfaces per the design document
    - Implement `traversePerson(personId: string, params?: TraverseParams): Observable<TraverseResponse>`
    - Clamp `depth` to [1, 5] and `limit` to [1, 2000] before sending
    - Send `GET {apiUrl}/person/{personId}/traverse` with query params
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 3.3 Update existing tests and add new tests for PersonServiceClient
    - Update existing `listPersons` tests to expect `PersonListResponse` instead of `Pessoa[]`
    - Add tests for `traversePerson()` URL construction and query params
    - Add tests for depth/limit clamping
    - Add test for HTTP error propagation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Refactor MockDataService → PersonDataService
  - [x] 4.1 Rename `mock-data.service.ts` to `person-data.service.ts` and class to `PersonDataService`
    - Rename file: `src/app/features/person/services/mock-data.service.ts` → `person-data.service.ts`
    - Rename class: `MockDataService` → `PersonDataService`
    - Keep `providedIn: 'root'`
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 4.2 Add `isLoading` and `error` signals to PersonDataService
    - Add `readonly isLoading = signal<boolean>(true)` — starts true, set false after API resolves
    - Add `readonly error = signal<string | null>(null)` — null on success, message on failure
    - _Requirements: 3.2, 3.3_

  - [x] 4.3 Refactor `pessoas` signal to use real API data with conditional mock fallback
    - Read `useMocks` from `environment.useMocks`
    - Change `listPersons()` call to use the new `PersonListResponse` return type, extract `.items`
    - Apply `mapApiPersonListToPessoas()` if not already mapped by the client
    - Remove the `map(items => items.length > 0 ? items : MOCK_PESSOAS)` pattern
    - In `catchError`: if `useMocks` is true, fall back to `MOCK_PESSOAS`; if false, set `error` signal and return `of([])`
    - Set `isLoading` to `false` in both success and error paths (use `finalize` or tap)
    - Change `initialValue` from `MOCK_PESSOAS` to `[]`
    - _Requirements: 3.1, 3.4, 3.5, 3.6_

  - [x] 4.4 Keep existing computed signal methods unchanged
    - Verify `getPessoaById()`, `getAlertasByPessoaId()`, `getVinculosByPessoaId()`, `getTagsByPessoaId()` still work with the new `pessoas` signal
    - Keep `alertas`, `vinculos`, `tags` as mock signals (poi-service doesn't expose these endpoints yet)
    - _Requirements: 3.7_

  - [x] 4.5 Update all import paths referencing MockDataService
    - Search for all imports of `MockDataService` or `mock-data.service` across the codebase
    - Update to `PersonDataService` from `person-data.service`
    - Key files: `dashboard.component.ts`, `mock-data.service.spec.ts` (rename to `person-data.service.spec.ts`)
    - _Requirements: 10.1, 10.2_

  - [x] 4.6 Update existing tests for PersonDataService
    - Rename `mock-data.service.spec.ts` → `person-data.service.spec.ts`
    - Update class references from `MockDataService` to `PersonDataService`
    - Add test: API success → `pessoas` emits mapped data, `isLoading` false, `error` null
    - Add test: API error with `useMocks=false` → `pessoas` emits `[]`, `error` set, `isLoading` false
    - Add test: API error with `useMocks=true` → `pessoas` emits `MOCK_PESSOAS`, `error` null
    - Add test: API returns empty items → `pessoas` emits `[]` (no mock fallback)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 5. Checkpoint — Ensure all tests pass
  - Run `pnpm test` and verify all existing and new tests pass before modifying components

- [x] 6. Update ProfileComponent to remove mock fallback
  - [x] 6.1 Add `useMocks`, `error`, and `isLoading` signals to ProfileComponent
    - Read `useMocks` from `environment.useMocks`
    - Add `protected readonly errorSignal = signal<string | null>(null)`
    - Add `protected readonly httpStatus = signal<number | null>(null)` for 404/403 detection
    - _Requirements: 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Refactor `personFromApi` signal to use conditional mock fallback
    - Change `initialValue` from `UNIFIED_PERSON_MOCK` to `null`
    - In `catchError`: check HTTP status for 404 → set `httpStatus(404)`, 403 → set `httpStatus(403)`
    - If `useMocks` is true and error is not 404/403, fall back to `UNIFIED_PERSON_MOCK`
    - If `useMocks` is false, set `errorSignal` with message and return `of(null)`
    - Remove the `?? UNIFIED_PERSON_MOCK` fallback in the `person` getter
    - _Requirements: 4.1, 4.6, 4.7_

  - [x] 6.3 Add error/loading/not-found states to profile template
    - Add `@if (isLoading())` block with skeleton placeholder
    - Add `@if (httpStatus() === 404)` block with "person not found" message and back button
    - Add `@if (httpStatus() === 403)` block with "access denied" message
    - Add `@if (errorSignal())` block with generic error message
    - Add `@if (person)` guard around the existing profile content
    - Use i18n translation keys for all messages
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 9.1, 9.2, 9.3_

  - [x] 6.4 Add provenance display to profile view
    - Show `_sources` graph names in a provenance section (e.g., badges or chips)
    - Show `_merged_from` count when > 1 as a merge indicator
    - Use i18n keys for provenance labels
    - _Requirements: 7.1, 7.2, 9.6_

- [x] 7. Update DashboardComponent for real data
  - [x] 7.1 Replace MockDataService injection with PersonDataService
    - Change `private readonly mockData = inject(MockDataService)` to `private readonly personData = inject(PersonDataService)`
    - Update all references from `this.mockData` to `this.personData`
    - _Requirements: 5.1_

  - [x] 7.2 Comment out `MONITORADOS_EXTRAS` and use only API data
    - Comment out the `MONITORADOS_EXTRAS` constant array (keep for reference)
    - Update the `monitorados` computed signal to use only `this.personData.pessoas()`
    - Remove any concatenation with `MONITORADOS_EXTRAS`
    - _Requirements: 5.2, 5.3_

  - [x] 7.3 Handle sparse data in monitoring cards
    - Default `indicadoresAnaliticos.nivelRisco` to `'baixo'` when absent
    - When `perfis` is empty, derive profile type from `rotulos` using `derivePerfilFromRotulos()`
    - Handle missing `fotoUrl`, `vulgos`, `tagsRelevantes` gracefully with safe defaults
    - _Requirements: 6.1, 6.3, 6.4_

  - [x] 7.4 Add loading, error, and empty states to dashboard template
    - Add `@if (personData.isLoading())` block with skeleton placeholders for the cards section
    - Add `@if (personData.error())` block with error banner and retry button
    - Add `@if (monitorados().length === 0 && !personData.isLoading() && !personData.error())` block with empty state message
    - Use i18n translation keys for all messages
    - _Requirements: 5.4, 5.5, 5.6, 9.4, 9.5_

  - [x] 7.5 Add provenance badge to person cards
    - Show source graph name from `_sources[0].display_name` as a small badge or tooltip on each card
    - Show merge indicator when `_merged_from > 1`
    - _Requirements: 7.3_

- [x] 8. Add i18n translation keys
  - [x] 8.1 Add `person` namespace keys to `src/locales/en.json` and `src/locales/pt.json`
    - Add keys: `person.error.notFound`, `person.error.accessDenied`, `person.error.generic`
    - Add keys: `person.dashboard.emptyState`, `person.dashboard.errorBanner`, `person.dashboard.retry`
    - Add keys: `person.provenance.sources`, `person.provenance.mergedFrom`, `person.provenance.graph`
    - Add keys: `person.loading`, `person.profile.backToList`
    - Ensure parity between en.json and pt.json for all `person.*` keys
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 9. Final checkpoint — Ensure all tests pass
  - Run `pnpm test` and verify all tests pass
  - Verify the build compiles without errors: `pnpm build`

## Notes

- The spec JSON files (#[[file:return_list.json]], #[[file:detail_sipen.json]], #[[file:detail_snap.json]]) contain real poi-service API responses and serve as the ground truth for the mapper implementation
- The `alertas`, `vinculos`, and `tags` signals in PersonDataService remain mock data — poi-service does not expose dedicated endpoints for these yet
- The `MONITORADOS_EXTRAS` array in DashboardComponent should be commented out (not deleted) for reference during development
- The `mapPresoVisaoToUnifiedPerson()` mapper already uses a defensive `g()` helper — the update in task 2.4 extends it for the real API shape, not a rewrite
- The `traversePerson()` method (task 3.2) is added for future graph visualization use — no UI consumer exists yet
- The existing `mock-data.service.spec.ts` tests validate the current behavior and must be migrated to the renamed service
