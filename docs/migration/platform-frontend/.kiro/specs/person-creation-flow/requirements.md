# Requirements Document

## Introduction

This document defines the requirements for incorporating the **person-creation-flow-ui** prototype into the Angular platform-frontend. The prototype is a static HTML/CSS/JS mockup that implements a governed person registration flow for the Intelligence / Persons module. The flow guides the user through a multi-source verification pipeline (local database → SIPEN → SNAP) before allowing person creation, preventing duplicates and prioritizing authoritative data sources.

The implementation targets Angular 21 with PrimeNG 21, follows DS-002 SMACSS/BEM CSS architecture, and uses a **service adapter pattern** that abstracts the data source behind an interface. The initial implementation ships with a mock adapter (static TypeScript data, simulated latency) that drives the full UX. When the poi-service backend endpoints become available, a real API adapter can be swapped in via Angular DI without changing any component, template, or flow logic.

The prototype's visual design, interaction patterns, and data structures serve as the reference for the Angular conversion.

### Source Material

- **Prototype repository**: `person-creation-flow-ui/` workspace folder
- **Requirements document**: `person-creation-flow-ui/requirements_cadastro_pessoas.md` (REQ-FORM-*, REQ-FLOW-*, REQ-LOCAL-*, REQ-SIPEN-*, REQ-SNAP-*, REQ-SIGILO-*, REQ-MANUAL-*, REQ-STATUS-*)
- **Design system**: `person-creation-flow-ui/colors_and_type.css` (SNAP Apolo design tokens)
- **Prototype screens**: `person-registration.html` (main flow), `person-new.html` (entry form), `person-record.html` (profile page redirect target)
- **Mock data**: `person-registration-data.js` (scenario matrix, local/SIPEN/SNAP results, full profiles, status messages)
- **Flow logic**: `person-registration.js` (state machine, query engine, drawer, secrecy, completion)

### Governance References

- **DS-001**: PrimeNG Design System Standard — component library rules
- **DS-002**: SMACSS CSS Architecture Standard — CSS naming, property ordering, category rules
- **DS-003**: Eco-Snap Components Library — future web component integration path
- **SMACSS compliance audit**: Layout classes must use `l-` prefix; module classes must use BEM; all values must reference design tokens; property ordering must follow Positioning → Box Model → Typography → Visuals

## Glossary

- **Registration_Flow**: The governed multi-step process that verifies a person across local database, SIPEN, and SNAP before allowing creation in the intelligence base.
- **Scenario_Matrix**: A lookup table mapping form input combinations (CPF, Nome+UF, RG, Vulgo) to predetermined mock result sets for each data source.
- **Local_Search**: Simulated query against the local intelligence database to detect existing persons and prevent duplicates.
- **SIPEN_Search**: Simulated query against the prison management system (primary authoritative source for penitentiary data).
- **SNAP_Search**: Simulated query against the intelligence enrichment system (complementary source for cadastral data, contacts, addresses).
- **Full_Profile_Query**: A simulated slow background query triggered after the user selects a person for registration, fetching detailed data from the selected source.
- **Review_Drawer**: A slide-in side panel displaying detailed person data from an external source, allowing the user to review before confirming registration.
- **Secrecy_Selector**: A UI component allowing the user to choose between Public and Reserved visibility for the new person record.
- **Person_Card**: A horizontal card component displaying a person match result with photo, identity data, source badge, confidence score, match type, and action buttons.
- **Status_Overlay**: A glassmorphism overlay on the form card showing the progress of sequential source queries with animated shimmer bars.
- **Confidence_Score**: A 0–1 numeric value indicating how closely a result matches the input data. Thresholds: ≥0.90 = Alta, ≥0.70 = Média, <0.70 = Baixa.

## Requirements

### Requirement 1: Registration Form

**User Story:** As an intelligence analyst, I want to enter basic person data (Nome, UF, Vulgo, RG, CPF) to initiate a governed registration process that checks multiple sources before creating a new person record.

#### Acceptance Criteria

1. THE form SHALL present fields in this exact order: Nome, UF, Vulgo, RG, CPF
2. THE Nome field SHALL validate a minimum of 3 characters
3. THE UF field SHALL present a dropdown with all 27 Brazilian states (AC through TO)
4. THE Vulgo field SHALL validate a minimum of 2 characters when filled
5. THE CPF field SHALL apply a real-time mask (`###.###.###-##`), validate digit count, check digits, and reject obvious invalid sequences (`000.000.000-00`, `111.111.111-11`, etc.)
6. THE CPF field SHALL render in monospace font (`--font-accent` / Cygnito Mono) per the design system
7. THE form SHALL present a primary button labeled "Cadastrar" (not "Buscar") and a secondary "Cancelar" button
8. THE "Cadastrar" button SHALL be disabled until at least one valid datum is present
9. WHEN the user clicks "Cadastrar" with no valid data, THE form SHALL display: "Informe pelo menos um dado válido para iniciar o cadastro da pessoa."
10. WHEN the user clicks "Cadastrar" with an invalid CPF (partially filled), THE form SHALL display: "CPF inválido. Verifique os dígitos informados antes de continuar."
11. THE form SHALL normalize CPF to digits-only for scenario matching (e.g., `013.511.976-65` → `01351197665`)
12. ALL form inputs SHALL use PrimeNG components (`p-inputtext`, `p-select`) per DS-001

### Requirement 2: Flow Orchestration (State Machine)

**User Story:** As an intelligence analyst, I want the system to automatically query local database, SIPEN, and SNAP in sequence after I submit the form, so that I can find existing records before creating duplicates.

#### Acceptance Criteria

1. THE flow SHALL execute queries in this mandatory order: Local → SIPEN → SNAP eligibility check → SNAP (if eligible)
2. THE flow SHALL be sequential — each source query starts only after the previous completes or is skipped
3. WHEN the user selects a person from any source and confirms registration, THE flow SHALL interrupt remaining queries
4. THE system SHALL NOT automatically register a person — registration requires explicit user selection and confirmation
5. THE flow state machine SHALL support these phases: IDLE, QUERYING_LOCAL, LOCAL_RESULTS, QUERYING_SIPEN, SIPEN_RESULTS, SIPEN_ERROR, EVALUATING_SNAP, QUERYING_SNAP, SNAP_RESULTS, SNAP_ERROR, MANUAL_OPTION, SECRECY_SELECTION, BACKGROUND_QUERY, COMPLETED
6. THE flow SHALL be implemented as an Angular service (`RegistrationFlowService`) using signals for reactive state management
7. THE scenario resolution SHALL match form data against the scenario matrix in priority order: CPF → Nome+UF → RG → Vulgo

### Requirement 3: Status Overlay

**User Story:** As an intelligence analyst, I want to see the progress of source queries in real-time, so that I know which sources have been checked and what their results are.

#### Acceptance Criteria

1. THE status overlay SHALL display individual status for: Base Local, SIPEN, SNAP
2. EACH source status SHALL support these states: CONSULTANDO, CONCLUIDA_SEM_RESULTADOS, CONCLUIDA_COM_RESULTADOS, ERRO, NAO_APLICAVEL, CADASTRO_COMPLETO_EM_ANDAMENTO, CADASTRO_SIMULADO_CONCLUIDO
3. THE active query state SHALL display an animated shimmer progress bar
4. THE completed-with-results state SHALL display a green check icon
5. THE completed-without-results state SHALL display a muted check icon
6. THE error state SHALL display a red X icon
7. THE overlay SHALL use glassmorphism styling (backdrop-filter blur + semi-transparent background)
8. THE overlay SHALL disable the form (pointer-events: none, reduced opacity) while queries are running
9. THE status messages SHALL use the exact Portuguese text defined in the prototype's `statusMessages` object

### Requirement 4: Local Search Results

**User Story:** As an intelligence analyst, I want to see persons already in the local database that match my input, so that I can avoid creating duplicates.

#### Acceptance Criteria

1. WHEN the local search returns results, THE system SHALL display them as horizontal person cards ordered by confidence score (highest first)
2. EACH local person card SHALL display: photo (or initials placeholder), full name, CPF (when available), RG (when available), UF, aliases, age, filiation, match type, confidence score, "Base Local" badge, "Já cadastrado" indicator
3. THE user SHALL be able to open the local person's profile in a new tab via "Abrir prontuário" action
4. THE user SHALL be able to declare "Nenhuma corresponde" to advance to SIPEN query
5. WHEN no local results are found, THE system SHALL automatically advance to SIPEN query
6. WHEN the user identifies a local match, THE registration flow SHALL be interrupted (no new person created)

### Requirement 5: SIPEN Search Results

**User Story:** As an intelligence analyst, I want to see persons from SIPEN that match my input, so that I can register a person using authoritative prison system data.

#### Acceptance Criteria

1. WHEN SIPEN returns results, THE system SHALL display them as horizontal person cards ordered by confidence score
2. EACH SIPEN person card SHALL display: photo, full name, CPF, RG, UF, aliases, age, filiation, SIPEN profile type (Preso, Ex-preso, Visitante, Advogado, Familiar, Servidor, Pessoa relacionada), prison status, current prison unit, match type, confidence score, "SIPEN" badge, duplicate indicators
3. WHEN the user clicks a SIPEN person card, THE system SHALL open a review drawer with detailed data
4. THE review drawer SHALL display: photo, name, CPF, RG, UF, aliases, filiation, age, birthplace, phones, addresses, emails, SIPEN profile, prison status, prison unit, source, confidence score, update date, local duplicate alert (when applicable)
5. THE user SHALL be able to select "Cadastrar" from the drawer to initiate registration from SIPEN
6. WHEN the user selects a SIPEN person, THE system SHALL NOT advance to SNAP query
7. WHEN the user declares "Nenhuma corresponde", THE system SHALL advance to SNAP eligibility evaluation
8. WHEN SIPEN returns no results, THE system SHALL advance to SNAP eligibility evaluation
9. WHEN SIPEN returns an error, THE system SHALL display the error with "Tentar novamente" and "Avançar para SNAP" options

### Requirement 6: SNAP Search Results

**User Story:** As an intelligence analyst, I want to see persons from SNAP when SIPEN doesn't resolve my search, so that I can use complementary cadastral data for registration.

#### Acceptance Criteria

1. THE SNAP query SHALL only execute when the user has provided: a valid CPF OR (valid Nome + UF)
2. WHEN SNAP eligibility criteria are not met, THE system SHALL display: "Para consultar o SNAP, informe um CPF válido ou preencha Nome e UF."
3. WHEN SNAP returns results, THE system SHALL display them as horizontal person cards ordered by confidence score
4. EACH SNAP person card SHALL display: photo (when available), full name, CPF, RG, UF, aliases, age, filiation, match type, confidence score, "SNAP" badge, duplicate indicators
5. WHEN the user clicks a SNAP person card, THE system SHALL open a review drawer with detailed data
6. THE user SHALL be able to select "Cadastrar" from the drawer to initiate registration from SNAP
7. WHEN the user declares "Nenhuma corresponde" or SNAP returns no results, THE system SHALL present the manual registration option

### Requirement 7: Secrecy Selection

**User Story:** As an intelligence analyst, I want to define the visibility level of a new person record before completing registration, so that sensitive records can be restricted to my sector.

#### Acceptance Criteria

1. AFTER the user selects a person for registration and BEFORE completing, THE system SHALL present secrecy options
2. THE system SHALL offer two options: "Público" and "Reservado"
3. THE "Público" option SHALL display: "Visível para toda a organização, conforme permissões aplicáveis."
4. THE "Reservado" option SHALL display: "Visível apenas para o setor do usuário." and show the sector "Superintendência de Inteligência"
5. THE secrecy selection SHALL be mandatory before completing registration
6. THE selected secrecy SHALL appear in the completion summary
7. THE secrecy selector SHALL use a radio-card pattern (clickable cards with radio indicators) as designed in the prototype

### Requirement 8: Background Query and Completion

**User Story:** As an intelligence analyst, I want the system to simulate a detailed background query after I confirm registration, so that the full person profile is enriched from the selected source.

#### Acceptance Criteria

1. AFTER secrecy selection, THE system SHALL simulate a slow background full-profile query (6–6.5 seconds simulated latency)
2. DURING the background query, THE system SHALL display: "Cadastro iniciado. A consulta completa está em andamento em background."
3. UPON completion, THE system SHALL display a success summary with: person name, CPF, source, secrecy level, sector (if Reservado)
4. THE completion summary SHALL use a green-tinted card with a check icon

### Requirement 9: Manual Registration

**User Story:** As an intelligence analyst, I want to manually register a person when no source confirms their identity, so that I can still create records for persons not found in any database.

#### Acceptance Criteria

1. WHEN the flow reaches the end without any person selection (all sources exhausted), THE system SHALL display: "Nenhuma pessoa correspondente foi encontrada nas fontes consultadas. Você pode iniciar o cadastro manual."
2. THE "Cadastrar Manualmente" button SHALL redirect to the person profile page (existing route)
3. THE manual registration option SHALL NOT implement actual form filling or saving

### Requirement 10: Dashboard Entry Point Update

**User Story:** As an intelligence analyst, I want the "Nova Pessoa" button on the persons dashboard to navigate to the new unified registration flow, so that all person creation goes through the governed multi-source verification pipeline instead of separate SIPEN/SNAP dialogs.

#### Acceptance Criteria

1. THE dashboard's "Nova Pessoa" popover menu SHALL be replaced with a single action that navigates to the person registration route (`/intelligence/person/pessoas/cadastro`)
2. THE existing inline SIPEN dialog (`dialogSipenVisivel`) and SNAP dialog (`dialogSnapVisivel`) SHALL be removed from the dashboard — the unified registration flow handles both sources
3. THE `novaPessoaOpcao()` method SHALL be replaced with a single `navegarCadastro()` method that navigates to the registration route
4. THE "Nova Pessoa" button SHALL navigate directly (no popover menu) — the registration form itself handles source selection via the governed flow
5. THE existing `CadastroIntegracaoComponent` at route `pessoas/cadastro` SHALL be replaced by the new `PersonRegistrationComponent` — the route path remains the same
6. THE existing `cadastro-integracao/` directory and its files SHALL be kept for reference during development but the route SHALL point to the new component

### Requirement 11: Mock Data and Scenarios

**User Story:** As a developer, I want a comprehensive scenario matrix with mock data covering all flow paths, so that every branch of the registration flow can be demonstrated and tested.

#### Acceptance Criteria

1. THE mock data SHALL implement 10 scenarios (CEN-001 through CEN-010) covering: CPF found locally, local homonyms by Nome+UF, found in SIPEN, found only in SNAP, found in both SIPEN and SNAP, not found anywhere, SNAP not applicable (insufficient data), SIPEN error with SNAP fallback, multiple results with different scores, prison profile with custody data
2. THE scenario matrix SHALL map form input triggers to result set names for each source
3. THE mock data SHALL include: local persons (3), SIPEN basic results (4+), SNAP basic results (3+), SIPEN full profiles (3+), SNAP full profiles (2+)
4. ALL mock persons SHALL have realistic Brazilian data (names, CPFs, addresses, filiation)
5. THE mock configuration SHALL define simulated latencies: local 800ms, SIPEN basic 1400ms, SNAP basic 1600ms, SIPEN full 6000ms, SNAP full 6500ms
6. THE status messages SHALL be in Portuguese (pt-BR) matching the exact text from the prototype

### Requirement 12: DS-002 SMACSS Compliance

**User Story:** As a platform architect, I want all CSS in the person registration feature to comply with DS-002 SMACSS/BEM standards, so that the codebase remains consistent and maintainable.

#### Acceptance Criteria

1. ALL layout classes SHALL use the `l-` prefix (e.g., `l-preg-layout`, `l-preg-row`)
2. ALL module classes SHALL use strict BEM notation (e.g., `.preg-card`, `.preg-card__body`, `.preg-card--query`)
3. ALL state classes SHALL use `is-` or `has-` prefix (e.g., `.is-visible`, `.is-active`, `.is-disabled`, `.is-filled`)
4. ALL color, spacing, typography, radius, and shadow values SHALL reference CSS custom properties — no hardcoded pixel or hex values in component SCSS
5. CSS properties SHALL follow the mandated ordering: Positioning → Box Model → Typography → Visuals
6. NO chained descendant selectors on BEM elements (e.g., `.card .card__title` is prohibited)
7. NO ID selectors for styling
8. THE prototype's `--snap-*` design tokens SHALL map to the existing `platform-frontend/src/styles/tokens/` variables

### Requirement 13: PrimeNG Component Usage

**User Story:** As a platform architect, I want standard UI patterns to use PrimeNG components per DS-001, so that the feature is consistent with the rest of the platform.

#### Acceptance Criteria

1. Text inputs SHALL use `p-inputtext` (PrimeNG InputText)
2. Dropdowns SHALL use `p-select` (PrimeNG Select)
3. Primary and secondary buttons SHALL use `p-button` (PrimeNG Button)
4. The review drawer SHALL use `p-drawer` (PrimeNG Drawer)
5. Tags and badges SHALL use `p-tag` (PrimeNG Tag)
6. Loading skeletons SHALL use `p-skeleton` (PrimeNG Skeleton) where appropriate
7. ALL PrimeNG components SHALL be imported individually — never the entire module
8. PrimeNG component styling SHALL be customized via design tokens (`definePreset`) — no `::ng-deep` overrides

### Requirement 14: Service Adapter Layer (Mock/Real Swap)

**User Story:** As a developer, I want the registration flow to depend on an abstract data source interface rather than hardcoded mock data, so that I can swap from mock to real API calls when the poi-service endpoints become available without changing any component or flow logic.

#### Acceptance Criteria

1. THE system SHALL define an abstract class `PersonRegistrationDataSource` with the following methods:
   - `searchLocal(data: NormalizedFormData): Promise<PersonMatch[]>` — search the local intelligence database
   - `searchSipen(data: NormalizedFormData): Promise<PersonMatch[] | null>` — search SIPEN (null signals error)
   - `searchSnap(data: NormalizedFormData): Promise<PersonMatch[] | null>` — search SNAP (null signals error)
   - `fetchFullProfile(personId: string, source: DataSource): Promise<FullProfile>` — fetch detailed person data after selection
   - `registerPerson(person: PersonMatch, secrecy: SecrecyOption): Promise<RegistrationSummary>` — create the person record
2. THE system SHALL provide a `MockRegistrationDataSource` implementation that uses static TypeScript mock data and simulates latency via `setTimeout` (800ms local, 1400ms SIPEN, 1600ms SNAP, 6000ms full profile)
3. THE system SHALL provide a `ApiRegistrationDataSource` stub (empty implementation with `TODO` markers) that documents the target poi-service endpoints for each method
4. THE `RegistrationFlowService` SHALL depend on `PersonRegistrationDataSource` (the abstract class) injected via Angular DI — never on a concrete implementation directly
5. THE active data source SHALL be configurable via Angular provider configuration, defaulting to `MockRegistrationDataSource`
6. SWAPPING from mock to real adapter SHALL require only a provider change — no modifications to components, templates, or flow service logic

### Requirement 15: Backend Dependency Documentation

**User Story:** As a platform architect, I want the spec to clearly document which poi-service API endpoints the real adapter will call and which backend capabilities are not yet available, so that backend and frontend teams can plan implementation in parallel.

#### Acceptance Criteria

1. THE spec SHALL document the following backend endpoint mapping for `ApiRegistrationDataSource`:

| Adapter Method | poi-service Endpoint | Status | Notes |
|---|---|---|---|
| `searchLocal()` | `GET /api/v1/poi/person/list?q=<name>&source=LOCAL` | ⚠️ Partial — list endpoint exists but has no `source=LOCAL` filter or confidence scoring | Needs: local-only filter, match type classification, confidence score calculation |
| `searchSipen()` | `GET /api/v1/poi/person/list?q=<name>&source=SIPEN` | ⚠️ Partial — list endpoint exists but returns persisted persons, not live SIPEN search results | Needs: live SIPEN search endpoint that queries the SIPEN engine in real-time and returns candidates (not yet persisted persons) |
| `searchSnap()` | `GET /api/v1/poi/person/list?q=<name>&source=SNAP` | ⚠️ Partial — same limitation as SIPEN | Needs: live SNAP search endpoint |
| `fetchFullProfile()` | `GET /api/v1/poi/person/{person_id}` | ✅ Available — returns full person detail with SIPEN/SNAP data | Works for already-persisted persons; for candidates not yet persisted, needs a new endpoint or the search endpoint must return full data |
| `registerPerson()` | `POST /api/v1/poi/generate-person/sipen` or `POST /api/v1/poi/generate-person/snap` | ❌ Not available — planned in poi-person-api spec (Requirements 9–11) but not implemented | Needs: creation endpoints, permission verification (`poi_entity:create`), audit event emission (`AuditPoiCreated`), secrecy/visibility model |

2. THE spec SHALL document the following backend capabilities that do NOT yet exist and are required for the real adapter:
   - **Live multi-source search**: An endpoint (or set of endpoints) that queries SIPEN/SNAP engines in real-time and returns candidate matches with confidence scores, match types, and duplicate indicators — distinct from the current `person/list` which queries already-persisted persons
   - **Person creation from external source**: `POST /api/v1/poi/generate-person/{source}` endpoints with secrecy parameter
   - **Secrecy/visibility model**: Backend support for Public vs Reserved visibility on person records (not yet in the data model)
   - **Confidence score calculation**: Server-side matching logic that compares form input against source results and produces confidence scores and match type classifications
3. THE spec SHALL NOT block frontend implementation on backend availability — the mock adapter provides full UX coverage for all 10 scenarios

### Requirement 16: Accessibility

**User Story:** As a user with assistive technology, I want the registration flow to be keyboard-navigable and screen-reader compatible, so that I can complete the registration process.

#### Acceptance Criteria

1. ALL interactive elements SHALL be keyboard-navigable (Tab, Enter, Escape)
2. THE form SHALL use proper `<label>` associations with inputs
3. THE review drawer SHALL trap focus when open and return focus to the trigger element on close
4. THE status overlay SHALL use `aria-live="polite"` for status message updates
5. THE person cards SHALL have appropriate `role` and `aria-label` attributes
6. Color SHALL NOT be the sole indicator of state — icons and text SHALL accompany color changes
