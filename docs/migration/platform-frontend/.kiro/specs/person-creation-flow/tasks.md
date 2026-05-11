# Tasks

## Task 1: Create registration data models and type definitions

- [x] 1.1 Create `models/registration.model.ts` containing all type definitions from the design document: `DataSource`, `FlowPhase`, `QueryStatus`, `MatchType`, `SipenProfileType`, `SecrecyOption`, `NormalizedFormData`, `PersonMatch`, `FullProfile`, `SourceStatus`, `ResultGroup`, `Scenario`, `SecrecyOptionConfig`, `MockConfig`, `RegistrationSummary`, `UF_LIST` constant
- [x] 1.2 Create utility functions in `models/registration.utils.ts`:
  - `validateCPF(cpf: string): boolean` — digit extraction, length check, repeated-digit rejection, check-digit validation (both digits)
  - `applyCPFMask(value: string): string` — progressive mask application (`###.###.###-##`)
  - `normalizeFormData(form: { nome: string; uf: string; vulgo: string; rg: string; cpf: string }): NormalizedFormData` — normalize name (lowercase, strip accents), normalize CPF (digits only), evaluate SNAP eligibility
  - `evaluateSnapEligibility(data: NormalizedFormData): boolean` — returns true if valid CPF or (valid nome + UF)
  - `formatConfidenceScore(score: number): string` — returns `Math.round(score * 100) + '%'`
  - `getConfidenceLabel(score: number, thresholds: MockConfig['confidenceThresholds']): string` — returns 'Alta', 'Média', or 'Baixa'
  - `formatMatchType(mt: MatchType): string` — human-readable Portuguese labels
  - `formatProfileType(pt: SipenProfileType): string` — human-readable Portuguese labels
  - `getPersonInitials(name: string): string` — first + last initial, uppercase
- [x] 1.3 Export all types and utilities from `models/index.ts` barrel file (add to existing barrel if present)

**Requirements:** 1, 2, 11, 12

## Task 2: Create mock data (scenario matrix, persons, full profiles, status messages)

- [x] 2.1 Create `data/registration-mock.data.ts` containing:
  - `MOCK_CONFIG: MockConfig` — latencies (800/1400/1600/6000/6500ms), manual redirect URL, reserved sector, visibility options, confidence thresholds
  - `SCENARIO_MATRIX: Scenario[]` — 10 scenarios (CEN-001 through CEN-010) with triggers and result set names, ported from `person-registration-data.js`
  - `LOCAL_PEOPLE: PersonMatch[]` — 3 local persons (João Carlos de Souza CPF match, João Carlos Pereira homonym MG, João Carlos Martins homonym MG)
  - `SIPEN_BASIC_RESULTS: PersonMatch[]` — 4 SIPEN persons (Rafael preso, Marcos Paulo visitante, Carlos Eduardo ex-preso, Luciana familiar)
  - `SNAP_BASIC_RESULTS: PersonMatch[]` — 3 SNAP persons (Fernanda, Marcos Paulo, Luciana)
  - `SIPEN_FULL_PROFILES: FullProfile[]` — 3 full profiles (Rafael, Carlos Eduardo, Luciana) with prison data, contacts, addresses, related people
  - `SNAP_FULL_PROFILES: FullProfile[]` — 2 full profiles (Fernanda, Luciana) with contacts, addresses, related people
  - `STATUS_MESSAGES: Record<DataSource | 'CADASTRO', Record<string, string>>` — all Portuguese status messages per source and state
  - `RESULT_SETS: Record<string, PersonMatch[] | null>` — maps result set names to actual data arrays (null for error scenarios)
  - `resolveScenario(data: NormalizedFormData): Scenario | null` — scenario resolution function with priority: CPF → Nome+UF → RG → Vulgo
  - `getResultSet(setName: string | null): PersonMatch[] | null` — result set lookup
  - `findFullProfile(personId: string, source: DataSource): FullProfile | null` — full profile lookup by basic result ID
- [x] 2.2 All mock person photos SHALL reference `/assets/photos/pessoa-XX.png` paths (copy prototype photos to `src/assets/photos/` or use placeholder paths)

**Requirements:** 11

## Task 3: Create service adapter layer (abstract class + mock + API stub)

- [x] 3.1 Create `pages/person-registration/adapters/person-registration-data-source.ts`:
  - Abstract class `PersonRegistrationDataSource` decorated with `@Injectable()`
  - Five abstract methods: `searchLocal(data)`, `searchSipen(data)`, `searchSnap(data)`, `fetchFullProfile(personId, source)`, `registerPerson(person, secrecy)`
  - Full JSDoc on each method documenting purpose, return semantics (null = error vs empty = no results), and the target poi-service endpoint
- [x] 3.2 Create `pages/person-registration/adapters/mock-registration-data-source.ts`:
  - `MockRegistrationDataSource extends PersonRegistrationDataSource`
  - `searchLocal()`: resolves scenario from form data, looks up local result set, simulates 800ms latency, returns sorted by confidence
  - `searchSipen()`: resolves scenario, looks up SIPEN result set, simulates 1400ms latency, returns null for error scenarios (result set value is null), returns sorted results otherwise
  - `searchSnap()`: resolves scenario, looks up SNAP result set, simulates 1600ms latency, same null-for-error pattern
  - `fetchFullProfile()`: looks up full profile by person ID and source, simulates 6000ms (SIPEN) or 6500ms (SNAP) latency
  - `registerPerson()`: simulates 500ms save, returns `RegistrationSummary` with person name, CPF, source, secrecy, sector (if Reservado)
  - Private `delay(ms)` helper using `Promise` + `setTimeout`
  - All mock data imported from `data/registration-mock.data.ts`
- [x] 3.3 Create `pages/person-registration/adapters/api-registration-data-source.ts`:
  - `ApiRegistrationDataSource extends PersonRegistrationDataSource`
  - Injects `HttpClient`
  - Each method throws `Error('...not implemented — backend endpoint not available')` with a `TODO` comment documenting:
    - The target poi-service endpoint URL
    - The backend dependency status (✅ Available, ⚠️ Partial, ❌ Not available)
    - What backend capabilities are needed before this method can be implemented
  - Endpoint mapping:
    - `searchLocal()` → `GET /api/v1/poi/person/list?source=LOCAL` (⚠️ needs local filter + scoring)
    - `searchSipen()` → live SIPEN search endpoint (❌ not defined yet)
    - `searchSnap()` → live SNAP search endpoint (❌ not defined yet)
    - `fetchFullProfile()` → `GET /api/v1/poi/person/{id}` (✅ for persisted persons)
    - `registerPerson()` → `POST /api/v1/poi/generate-person/{source}` (❌ not implemented)

**Requirements:** 14, 15

## Task 4: Create RegistrationFlowService (state machine)

- [x] 4.1 Create `pages/person-registration/services/registration-flow.service.ts` as an `@Injectable()` service with:
  - Injects `PersonRegistrationDataSource` (the abstract class) via Angular DI — never references `MockRegistrationDataSource` or `ApiRegistrationDataSource` directly
  - Signal-based state: `phase`, `formData`, `scenario`, `localResults`, `sipenResults`, `snapResults`, `selectedPerson`, `selectedSource`, `selectedSecrecy`, `sourceStatuses`, `resultGroups`, `summary`
  - Computed signals: `isOverlayVisible`, `isFormDisabled`, `isResultsVisible`, `isDrawerOpen`
  - Public methods: `startFlow(data)`, `advanceFromSource(source)`, `selectPerson(person, source)`, `confirmRegistration(secrecy)`, `retrySource(source)`, `reset()`
  - Private methods: `transition(newPhase)`, `updateSourceStatus(source, status, message)`, `addResultGroup(group)`
  - The `transition()` method SHALL implement the full state machine from the design: IDLE → QUERYING_LOCAL → LOCAL_RESULTS or QUERYING_SIPEN → SIPEN_RESULTS or EVALUATING_SNAP → QUERYING_SNAP or MANUAL_OPTION → SECRECY_SELECTION → BACKGROUND_QUERY → COMPLETED
  - All data access goes through `this.dataSource.searchLocal()`, `this.dataSource.searchSipen()`, etc. — no direct mock data imports
  - Results SHALL be sorted by `confidenceScore` descending before being added to result groups
  - The service SHALL be provided at the component level (not root) so each registration page instance gets a fresh state

**Requirements:** 2, 3, 11, 14

## Task 5: Create RegistrationFormComponent

- [x] 5.1 Create `pages/person-registration/components/registration-form/registration-form.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Reactive form with controls: `nome`, `uf`, `vulgo`, `rg`, `cpf`
  - CPF mask applied on input event via `applyCPFMask()`
  - `is-filled` state class toggled on inputs when they have content
  - `formSubmit` output emitting `NormalizedFormData`
  - `isDisabled` input to disable the form during queries
  - Validation messages displayed inline
  - PrimeNG imports: `InputTextModule`, `SelectModule`, `ButtonModule`
- [x] 5.2 Create `registration-form.component.html`:
  - Title: "Cadastrar <span class="accent">Pessoa</span>" with subtitle
  - Fields in order: Nome + UF (grid row `l-preg-row--nome-uf`), Vulgo + RG (grid row), CPF (full width)
  - Labels using `.font-accent` class, uppercase, with "ao menos um obrigatório" hint
  - Submit button "Cadastrar" with user-plus icon, Cancel button
  - Validation message area
- [x] 5.3 Create `registration-form.component.scss`:
  - DS-002 compliant: `l-preg-row`, `l-preg-row--nome-uf` for layout; `preg-form`, `preg-field`, `preg-label`, `preg-label__hint` for modules; `is-filled`, `is-disabled` for states
  - All values using `--snap-*`, `--space-*`, `--text-*`, `--radius-*` tokens
  - Property ordering: Positioning → Box Model → Typography → Visuals

**Requirements:** 1, 12, 13

## Task 6: Create RegistrationOverlayComponent

- [x] 6.1 Create `pages/person-registration/components/registration-overlay/registration-overlay.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Inputs: `isVisible: boolean`, `sourceStatuses: SourceStatus[]`
  - Renders one status item per source (Base Local, SIPEN, SNAP)
  - Each item shows: icon, title, shimmer bar (when active), status message, status icon (check/X)
- [x] 6.2 Create `registration-overlay.component.html`:
  - Overlay container with `is-visible` state class
  - Three status items with `data-source` attributes
  - Shimmer animation bar for active queries
  - `aria-live="polite"` on status message elements
- [x] 6.3 Create `registration-overlay.component.scss`:
  - Glassmorphism: `backdrop-filter: blur(8px)`, semi-transparent background using `color-mix()`
  - Shimmer animation (`@keyframes preg-shimmer`) with staggered delays per source
  - State classes: `is-visible`, `is-active`, `is-done`, `is-empty`, `is-error`
  - All values tokenized per DS-002

**Requirements:** 3, 12, 16

## Task 7: Create PersonMatchCardComponent

- [x] 7.1 Create `pages/person-registration/components/person-match-card/person-match-card.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Required input: `person: PersonMatch`
  - Outputs: `cardClicked`, `registerClicked`, `openProfileClicked`
  - Computed: `isLocal` (source === 'BASE_LOCAL'), `sourceBadgeClass`, `sourceLabel`
  - PrimeNG imports: `TagModule`, `ButtonModule`, `AvatarModule`
- [x] 7.2 Create `person-match-card.component.html`:
  - Three-column grid: photo (60px) + body + actions
  - Photo with `p-avatar` or img, fallback to initials
  - Body: name, meta line (CPF · RG · UF · age), aliases (italic), filiation, prison data (SIPEN only), badges row (source badge, score, match type, duplicate indicator)
  - Actions: "Abrir prontuário" (local) or "Cadastrar" (external)
  - Click on card body opens drawer (external cards only)
- [x] 7.3 Create `person-match-card.component.scss`:
  - BEM: `preg-pcard`, `preg-pcard__photo`, `preg-pcard__body`, `preg-pcard__name`, `preg-pcard__meta`, `preg-pcard__aliases`, `preg-pcard__filiation`, `preg-pcard__badges`, `preg-pcard__badge`, `preg-pcard__badge--local`, `preg-pcard__badge--sipen`, `preg-pcard__badge--snap`, `preg-pcard__score`, `preg-pcard__match`, `preg-pcard__dup`, `preg-pcard__dup--registered`, `preg-pcard__dup--possible`, `preg-pcard__prison`, `preg-pcard__actions`, `preg-pcard__action`
  - State: `is-primary` on action buttons
  - All values tokenized

**Requirements:** 4, 5, 6, 12, 16

## Task 8: Create RegistrationResultsComponent

- [x] 8.1 Create `pages/person-registration/components/registration-results/registration-results.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Input: `resultGroups: ResultGroup[]`
  - Outputs: `personSelected`, `advanceRequested`
  - Imports `PersonMatchCardComponent`
  - Renders groups in reverse order (newest at top) with title, icon, person cards, and action bar
  - Handles error groups, not-applicable groups, and manual registration option
- [x] 8.2 Create `registration-results.component.html`:
  - Container with `is-visible` state class and slide-in animation
  - `@for` loop over result groups
  - Each group: title with icon, person cards, action bar ("Nenhuma corresponde", "Tentar novamente", "Avançar para SNAP", "Cadastrar Manualmente")
  - Manual option: icon, message, CTA button
  - Error option: alert icon, error message, retry + advance buttons
- [x] 8.3 Create `registration-results.component.scss`:
  - BEM: `preg-results`, `preg-results__group`, `preg-results__title`, `preg-actions-bar`, `preg-actions-bar__btn`, `preg-manual`, `preg-manual__icon`, `preg-manual__msg`, `preg-manual__btn`
  - Slide-in animation (`@keyframes preg-slide-in`)
  - State: `is-visible`, `is-primary` on buttons

**Requirements:** 4, 5, 6, 9, 12

## Task 9: Create ReviewDrawerComponent

- [x] 9.1 Create `pages/person-registration/components/review-drawer/review-drawer.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Inputs: `person: PersonMatch | null`, `fullProfile: FullProfile | null`
  - Model: `isOpen: boolean`
  - Output: `registerConfirmed: { person: PersonMatch; secrecy: SecrecyOption }`
  - Imports: `DrawerModule` (PrimeNG), `SecrecySelectorComponent`
  - Internal signal: `selectedSecrecy`
  - Focus trap when open, return focus on close
- [x] 9.2 Create `review-drawer.component.html`:
  - PrimeNG `p-drawer` with `position="right"`, `[visible]="isOpen()"`, width 420px
  - Header with title and close button
  - Body sections: photo (circular), name, badges, identification fields (CPF, RG, UF, aliases, age, birthplace, filiation, update date), contacts (phones, emails, addresses — from full profile when available), prison data (SIPEN only), related people, duplicate alert (when applicable)
  - Footer: SecrecySelectorComponent, "Cadastrar" primary button (disabled until secrecy selected), "Cancelar" secondary button
- [x] 9.3 Create `review-drawer.component.scss`:
  - BEM: `preg-drawer`, `preg-drawer__head`, `preg-drawer__head-title`, `preg-drawer__close`, `preg-drawer__body`, `preg-drawer__photo`, `preg-drawer__name`, `preg-drawer__section`, `preg-drawer__section-title`, `preg-drawer__row`, `preg-drawer__label`, `preg-drawer__value`, `preg-drawer__alert`, `preg-drawer__alert--warning`, `preg-drawer__alert--danger`, `preg-drawer__actions`, `preg-drawer__action`
  - State: `is-primary`, `is-secondary` on action buttons

**Requirements:** 5, 6, 7, 12, 13, 16

## Task 10: Create SecrecySelectorComponent

- [x] 10.1 Create `pages/person-registration/components/secrecy-selector/secrecy-selector.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Model: `selectedSecrecy: SecrecyOption | null`
  - Input: `options: SecrecyOptionConfig[]` (defaults to `MOCK_CONFIG.defaultVisibilityOptions`)
  - Renders radio-card pattern: clickable cards with radio indicator, label, description
  - Shows sector name ("Superintendência de Inteligência") when "Reservado" is selected
- [x] 10.2 Create `secrecy-selector.component.html` and `.scss`:
  - BEM: `preg-secrecy`, `preg-secrecy__title`, `preg-secrecy__option`, `preg-secrecy__option-label`, `preg-secrecy__option-desc`, `preg-secrecy__sector`
  - State: `is-selected` on the active option
  - Radio indicator: circle border with filled dot when selected, using `--snap-pillar-color`

**Requirements:** 7, 12

## Task 11: Create RegistrationSummaryComponent

- [x] 11.1 Create `pages/person-registration/components/registration-summary/registration-summary.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Input: `summary: RegistrationSummary | null`
  - Renders success card with green tint, check icon, person name, CPF, source, secrecy, sector
- [x] 11.2 Create `registration-summary.component.html` and `.scss`:
  - BEM: `preg-summary`, `preg-summary__icon`, `preg-summary__title`, `preg-summary__items`, `preg-summary__item`, `preg-summary__label`, `preg-summary__value`
  - Green-tinted background using `color-mix(in oklab, var(--snap-success) 6%, var(--snap-surface-2))`

**Requirements:** 8, 12

## Task 12: Create PersonRegistrationComponent (page orchestrator)

- [x] 12.1 Create `pages/person-registration/person-registration.component.ts`:
  - Standalone component with `ChangeDetectionStrategy.OnPush`
  - Provides at component level: `RegistrationFlowService`, `{ provide: PersonRegistrationDataSource, useClass: MockRegistrationDataSource }`
  - Imports all sub-components
  - Wires form submit to `flowService.startFlow()`
  - Wires card clicks to drawer open + `flowService.selectPerson()`
  - Wires drawer confirm to `flowService.confirmRegistration()`
  - Wires advance buttons to `flowService.advanceFromSource()`
- [x] 12.2 Create `person-registration.component.html`:
  - Title bar with back button, heading "Cadastrar Pessoa", pillar chip "Inteligência"
  - Two-column layout: form card (left, max-width 480px) + results panel (right, max-width 480px)
  - Background hero image via `::before` pseudo-element
  - Form card contains: `<app-registration-form>` + `<app-registration-overlay>` (absolute positioned)
  - Results panel contains: `<app-registration-results>` + `<app-registration-summary>` (when completed)
  - `<app-review-drawer>` at page level (outside the layout flow)
- [x] 12.3 Create `person-registration.component.scss`:
  - Layout: `l-preg-layout` (flex, centered, gap, min-height, relative, overflow hidden, padding-top)
  - Background: `l-preg-layout::before` (absolute, centered, 75% width, hero image, 50% opacity)
  - Card: `preg-card` (glassmorphism: `color-mix()` background, `backdrop-filter: blur(16px)`, border, radius, shadow)
  - Title bar: `preg-title-bar`, `preg-title-bar__left`, `preg-title-bar__back`, `preg-title-bar__heading`, `preg-title-bar__chip`
  - Dark mode overrides using `.p-dark` parent selector (matching existing platform pattern)
  - All values tokenized per DS-002

**Requirements:** 1, 2, 3, 12, 14

## Task 13: Update dashboard entry point and route configuration

- [x] 13.1 Update `person.routes.ts`: change the `pessoas/cadastro` route to lazy-load `PersonRegistrationComponent` instead of `CadastroIntegracaoComponent`. Keep the route path `pessoas/cadastro` unchanged so existing navigation links continue to work.
- [x] 13.2 Update `dashboard.component.ts`:
  - Replace the `novaPessoaOpcao(tipo: 'manual' | 'sipen' | 'snap')` method with a single `navegarCadastro()` method that navigates to `['/intelligence/person/pessoas/cadastro']`
  - Remove the `dialogSipenVisivel` signal, `dialogSnapVisivel` signal, `consultandoSipen` signal, `consultandoSnap` signal, `consultaSipen` signal, `consultaSnap` signal, `contadorBusca` signal, `targetVisibility` signal, and all related computed signals
  - Remove the `abrirDialogSipen()`, `abrirDialogSnap()`, `consultarSipen()`, `consultarSnap()` methods
  - Remove the `PersonServiceClient` import and injection (the registration flow handles API calls via its own adapter)
  - Remove the `ajustarSetaPopover()` method if it was only used for the "Nova Pessoa" popover
- [x] 13.3 Update `dashboard.component.html`:
  - Replace the "Nova Pessoa" `<button>` + `<p-popover>` + three-option menu with a single `<button pButton label="Nova Pessoa" icon="pi pi-plus" (click)="navegarCadastro()">` — no popover, no menu
  - Remove the entire SIPEN dialog (`<p-dialog [(visible)]="dialogSipenVisivel">...</p-dialog>`)
  - Remove the entire SNAP dialog (`<p-dialog [(visible)]="dialogSnapVisivel">...</p-dialog>`)
  - Remove any related template code (search status animations, counter, form fields inside dialogs)
- [x] 13.4 Remove unused PrimeNG imports from `dashboard.component.ts` that were only used by the removed dialogs (e.g., `DialogModule`, `PopoverModule` if no longer needed elsewhere)
- [x] 13.5 Update breadcrumb service (if applicable): ensure `'cadastro': 'Cadastro de Pessoa'` is in known labels
- [x] 13.6 Verify the "Cancelar" button in the registration flow navigates back (using `Location.back()`) — should return to the dashboard
- [x] 13.7 Verify the "Cadastrar Manualmente" button navigates to the existing person profile route
- [x] 13.8 Copy prototype person photos from `person-creation-flow-ui/assets/photos/` to `platform-frontend/src/assets/photos/` (or verify they already exist from the person-profile-page spec)
- [x] 13.9 Keep the existing `cadastro-integracao/` directory and its files for reference — do NOT delete them

**Requirements:** 2, 9, 10

## Task 14: Build verification and integration test

- [x] 14.1 Run `ng build --configuration=development` and verify zero compilation errors
- [x] 14.2 Verify the route `/intelligence/person/pessoas/cadastro` loads the PersonRegistrationComponent
- [x] 14.3 Manually verify (or write a smoke test) that:
  - The form renders with all 5 fields in correct order
  - CPF mask applies correctly
  - Submitting with CPF `013.511.976-65` triggers CEN-001 (local CPF match)
  - Submitting with CPF `222.333.444-05` triggers CEN-003 (SIPEN match)
  - Submitting with CPF `333.444.555-06` triggers CEN-004 (SNAP match)
  - Submitting with Nome "pessoa inexistente mock" + UF "RJ" triggers CEN-006 (no results → manual)
  - The review drawer opens when clicking a SIPEN/SNAP card
  - The secrecy selector works and is required before confirmation
  - The completion summary renders after background query simulation

**Requirements:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11

## Task 15: Write unit tests

- [x] 15.1 Test `validateCPF()`: valid CPF returns true, invalid check digits return false, repeated digits return false, wrong length returns false, empty string returns false
- [x] 15.2 Test `applyCPFMask()`: progressive masking at 3, 6, 9, 11 digits
- [x] 15.3 Test `normalizeFormData()`: accent stripping, lowercase, CPF digit extraction, SNAP eligibility evaluation
- [x] 15.4 Test `evaluateSnapEligibility()`: true for valid CPF, true for nome+UF, false for RG-only, false for vulgo-only
- [x] 15.5 Test `resolveScenario()`: CPF match returns correct scenario, Nome+UF match returns correct scenario, no match returns null
- [x] 15.6 Test `getConfidenceLabel()`: ≥0.90 returns 'Alta', ≥0.70 returns 'Média', <0.70 returns 'Baixa'
- [x] 15.7 Test `formatMatchType()`: all match types return correct Portuguese labels
- [x] 15.8 Test `getPersonInitials()`: two-word name returns first+last initial, single-word returns first two chars
- [x] 15.9 Test `MockRegistrationDataSource`:
  - `searchLocal()` with CEN-001 trigger returns 1 person with CPF_EXATO match type
  - `searchSipen()` with CEN-003 trigger returns 1 person with PRESO profile
  - `searchSipen()` with CEN-008 trigger returns null (error scenario)
  - `searchSnap()` with CEN-004 trigger returns 1 person
  - `evaluateSnapEligibility` returns false for RG-only input (CEN-007)
  - Results are always sorted by confidenceScore descending
- [x] 15.10 Test `RegistrationFlowService` (with MockRegistrationDataSource injected):
  - `startFlow()` transitions from IDLE to QUERYING_LOCAL
  - After local results, `advanceFromSource('BASE_LOCAL')` transitions to QUERYING_SIPEN
  - `selectPerson()` sets selectedPerson and transitions to SECRECY_SELECTION
  - `confirmRegistration()` with secrecy transitions to BACKGROUND_QUERY then COMPLETED
  - `reset()` returns all signals to initial state

**Requirements:** 1, 2, 11
