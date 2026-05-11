# Implementation Plan: Person Profile UI Update

## Overview

Promote `ProfileNewComponent` from a static preview to the canonical person profile show page. The implementation proceeds in four incremental concerns: route alignment, data contract wiring (mapper + component refactor), template updates, and the Graph MFE entrypoint. Each concern builds on the previous and ends with all pieces wired together.

## Tasks

- [x] 1. Route alignment — update navigation target and route configuration
  - In `pages/dashboard/dashboard.component.ts`, change `navegarPessoa()` to navigate to `['/intelligence/person', pessoaId, 'profile-new']` instead of `'profile'`
  - In `person.routes.ts`, remove the `{ path: ':id/profile', ... }` route entry
  - In `person.routes.ts`, convert the `':id/profile-new'` entry from an eager `component:` import to a lazy `loadComponent:` dynamic import of `ProfileNewComponent`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3_

  - [ ]* 1.1 Write unit test for `navegarPessoa()` navigation target
    - Verify that calling `navegarPessoa(id)` triggers `Router.navigate` with `['/intelligence/person', id, 'profile-new']`
    - Verify that `Router.navigate` is never called with `'profile'` as the last segment
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Create `profile-new-mapper.ts` with `mapApiResponseToPersonRecord()`
  - Create `pages/profile-new/profile-new-mapper.ts`
  - Export `mapApiResponseToPersonRecord(raw: Record<string, unknown>): PersonRecord`
  - Implement all field mappings from the design's API Response → PersonRecord table, using `??` fallbacks for every field (`''` for strings, `[]` for arrays, `null` for nullable references)
  - Implement helper builders: `buildSituation`, `buildIdentificationFields`, `buildBiographyFields`, `buildSipenCodeFields`, `buildContacts`, `buildAddresses`, `buildCustody`, `buildLegal`, `buildRelations`, `buildPublicLife`, `buildSourceInfo`, `buildCriticalAlert`, `buildLastUpdateAlert`
  - Set `aiSummary` to `{ paragraphs: [], sources: [] }` and `documents` to `[]` (not available from API)
  - Do NOT mutate the `raw` input object
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 5.11, 5.12, 5.13, 5.14, 5.15, 5.16, 5.17_

  - [ ]* 2.1 Write unit tests for `mapApiResponseToPersonRecord()` — happy path and edge cases
    - Test full API response: verify all `PersonRecord` fields are populated from the correct source fields
    - Test partial response (only `id` + `nome` present): verify all other fields default to safe empty values
    - Test individual null/undefined fields: verify each falls back to `''` or `[]` as appropriate
    - Test `foto_url` / `fotoUrl` fallback chain
    - Test `id` / `uuid` fallback chain
    - _Requirements: 5.1–5.17_

  - [ ]* 2.2 Write property test — Property 2: mapper totality (no throw, no undefined required fields)
    - **Property 2: Mapper totality — no throw, no undefined required fields**
    - Use `fast-check` with `fc.record({ id: fc.string(), nome: fc.string() }, { withDeletedKeys: true })` as the arbitrary
    - Assert `mapApiResponseToPersonRecord(raw)` does not throw for any input
    - Assert `result.id`, `result.name`, `result.aliases`, `result.tags` are all defined
    - Assert all array fields are arrays (`Array.isArray`)
    - **Validates: Requirements 5.1, 5.15**

  - [ ]* 2.3 Write property test — Property 5: mapper purity (determinism and no mutation)
    - **Property 5: Mapper purity — determinism and no mutation**
    - Use `fast-check` with `fc.record({ id: fc.string(), nome: fc.string() })` as the arbitrary
    - Assert calling the mapper twice with the same `raw` produces deep-equal output
    - Assert the `raw` object is unchanged after each call (deep-equal to its original value)
    - **Validates: Requirements 5.16, 5.17**

- [x] 3. Checkpoint — mapper complete
  - Ensure all mapper tests pass, ask the user if questions arise.

- [x] 4. Refactor `ProfileNewComponent` — signals, route param reading, and API call
  - In `pages/profile-new/profile-new.component.ts`, add injections: `ActivatedRoute`, `Location`, `PersonServiceClient`; read `environment.useMocks`
  - Add writable signals: `isLoading = signal<boolean>(true)`, `errorSignal = signal<string | null>(null)`, `httpStatus = signal<number | null>(null)`, `person = signal<PersonRecord>(PERSON_RECORD_DATA)`
  - Add derived signal: `personId = toSignal(this.route.paramMap.pipe(map(p => p.get('id') ?? '')))`
  - In `ngOnInit` (or constructor effect), implement the `switchMap` data-loading pipeline as specified in the design pseudocode:
    - Set `isLoading(true)` on each emission
    - Skip API call and set `isLoading(false)` when `personId` is empty
    - On success: call `mapApiResponseToPersonRecord(data)`, update `person` signal, set `isLoading(false)`
    - On 404: set `httpStatus(404)`, set `isLoading(false)`, return `of(null)`
    - On 403: set `httpStatus(403)`, set `isLoading(false)`, return `of(null)`
    - On other errors with `useMocks = true`: set `person(PERSON_RECORD_DATA)`, set `isLoading(false)`
    - On other errors with `useMocks = false`: set `errorSignal(err.message)`, set `isLoading(false)`
  - Use `toSignal()` + `switchMap()` so in-flight requests are automatically cancelled on re-navigation
  - Preserve `voltar()` calling `this.location.back()`
  - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 8.3, 9.1, 9.2, 11.1, 11.2, 12.1, 12.2_

- [x] 5. Update `profile-new.component.html` — signal access and state templates
  - Replace all `person.` property accesses with `person().` (signal invocation) throughout the template
  - Add loading skeleton block: `@if (isLoading()) { ... }` — renders a skeleton in place of profile content
  - Add 404 state block: `@if (httpStatus() === 404) { ... }` — renders "Pessoa não encontrada" with a back button
  - Add 403 state block: `@if (httpStatus() === 403) { ... }` — renders "Acesso negado" state
  - Add generic error banner block: `@if (errorSignal()) { ... }` — renders error message with a retry option
  - Wrap profile content in `@if (!isLoading() && !httpStatus() && !errorSignal()) { ... }` so it is suppressed during loading and error states
  - Ensure the Leaflet map initialization is guarded so it only runs after `isLoading()` becomes `false`
  - Preserve all existing scroll-spy, lightbox, drawer, tab, and map interactions
  - _Requirements: 6.3, 7.3, 9.3, 10.1, 10.2, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 6. Checkpoint — data wiring complete
  - Ensure all tests pass and the component renders live data (or mock fallback) correctly, ask the user if questions arise.

- [x] 7. Add Graph MFE entrypoint to `ProfileNewComponent`
  - In `pages/profile-new/profile-new.component.ts`, add:
    - `protected readonly isProduction = environment.production` (build-time constant, read once at class level)
    - `protected readonly hasGraphPermission = this.permissionService.hasPermission('intelligence:graph-viewer')` (signal, same pattern as `ProfileComponent`)
    - `protected openGraph(): void` — navigates to `['/intelligence/person', this.personId(), 'graph']` only when `personId()` is non-empty
  - Inject `Router` if not already injected (needed for `openGraph()`)
  - In `pages/profile-new/profile-new.component.html`, add the graph CTA button inside the profile header action area, outside loading/error state blocks:
    ```html
    @if (isProduction && hasGraphPermission()) {
      <button
        pButton
        [label]="'person.profile.openGraph' | translate"
        icon="pi pi-share-alt"
        [outlined]="true"
        size="small"
        (click)="openGraph()"
        [disabled]="!personId()"
      ></button>
    }
    ```
  - Do NOT add new i18n keys — `person.profile.openGraph` already exists in both locale files
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7_

  - [ ]* 7.1 Write unit tests for Graph CTA visibility and navigation
    - Test: button is NOT rendered when `environment.production = false` (regardless of permission or personId)
    - Test: button is NOT rendered when user lacks `intelligence:graph-viewer` permission
    - Test: button IS rendered when `isProduction = true` AND permission is granted AND `personId` is non-empty
    - Test: button is disabled (not hidden) when `personId` is empty
    - Test: `openGraph()` calls `Router.navigate` with `['/intelligence/person', personId, 'graph']`
    - Test: button does NOT appear in loading state, 404 state, or 403 state
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.7_

- [x] 8. Final checkpoint — full feature wired
  - Ensure all tests pass (unit + property-based), ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Property tests use `fast-check`, which is already in `devDependencies`
- The `toSignal()` + `switchMap()` pattern handles automatic request cancellation on re-navigation — no manual `unsubscribe` needed
- `isProduction` is a build-time constant (`environment.production`) — it must NOT be confused with `useMocks`, which is a separate API mock flag
- The `graph-visualization-remote` route overlay in `mfe-host` requires no changes as part of this spec
- `ProfileComponent` files are preserved in the codebase; only its route entry is removed
