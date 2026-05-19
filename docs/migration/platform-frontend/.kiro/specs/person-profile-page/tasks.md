# Tasks

## Task 1: Create UnifiedPerson data model and utility functions

- [x] 1.1 Create `models/unified-person.model.ts` containing:
  - The `UnifiedPerson` interface with all fields as defined in the design: core identity (`id` as UUID v4, `name`, `aliases`, `cpf`, `rg?`, `photoUrl?`, `birthDate`, `age`, `sex`, `father?`, `mother?`, `birthPlace?`, `nationality?`, `maritalStatus?`, `profession?`, `education?`, `religion?`, `ethnicity?`, `language?`, `cpfStatus?`), classification (`profiles: Perfil[]` reusing the existing `Perfil` interface from `perfil.model.ts`, `tags: TagInfo[]`, `riskLevel`, `monitoring: MonitoringInfo`), optional SIPEN sections (`custody?: CustodyInfo`, `penalHistory?: PenalHistoryInfo`, `legalRecord?: LegalRecordInfo`, `visitors?: VisitorsInfo`, `images?: ImagesInfo`, `movements?: MovementsInfo`, `occurrences?: OccurrencesInfo`, `activities?: ActivitiesInfo`), always-present SNAP sections (`contacts: ContactsInfo`, `relatedPersons`, `companies`, `judicialProcesses`, `escavadorProcesses`, `seeuProcesses`, `warrants`, `officialJournals`, `queridoDiarioJournals`, `digitalProfiles`, `electoral`, `publicServants`, `publicExpenses`), lawyers (`lawyers`, `legalAppointments`), contextual alert, and metadata (`lastEnrichmentDate?`, `availableSources`)
  - All sub-interfaces: `TagInfo`, `MonitoringInfo`, `CustodyInfo`, `PenalHistoryInfo` (with `PenalEvent`, `BehaviorIndex`, `PrivilegeInfo`, `BenefitInfo`, `SentenceReductionInfo`), `LegalRecordInfo` (with `SentenceCalculation`, `BenefitDates`, `SipenProcess`, `LegalOccurrence`, `VepInfo`), `VisitorsInfo` (with `FamilyVisitor`, `ReligiousVisitor`, `ConsularAgent`, `IntimateVisit`), `LawyerInfo`, `LegalAppointmentInfo`, `ImagesInfo`, `MovementsInfo` (with `TransferInfo`, `LocationHistoryInfo`), `ContactsInfo`, `RelatedPersonInfo`, `CompanyInfo`, `JudicialProcessInfo`, `EscavadorProcessInfo`, `SeeuProcessInfo`, `WarrantInfo`, `OfficialJournalInfo`, `QueridoDiarioInfo`, `DigitalProfileInfo`, `ElectoralInfo`, `PublicServantInfo`, `PublicExpenseInfo`, `OccurrencesInfo` (with `ServiceOrder`, `OccurrenceRecord`), `ActivitiesInfo` (with `LaborActivity`, `EducationalActivity`)
  - The `PROFILE_PRECEDENCE` constant: `['alvo', 'preso', 'ex-preso', 'advogado', 'visitante', 'familiar', 'servidor']`
  - The `resolvePrimaryProfile(profiles: Perfil[]): TipoPerfil | undefined` function that returns the highest-precedence active profile type, falls back to highest-precedence inactive if none active, returns `undefined` for empty array
- [x] 1.2 Create `models/tab-config.ts` containing:
  - The `PROFILE_TABS` constant array with 16 tab entries, each having `index`, `label`, and either `alwaysVisible: true` or `requiresSection: keyof UnifiedPerson` — 9 always-visible SNAP tabs (Visão Geral, Contatos, Vínculos, Processos Judiciais, Mandados, Diários Oficiais, Perfis Digitais, Dados Eleitorais, Transparência) and 7 conditional SIPEN tabs (Histórico Penal → penalHistory, Prontuário Jurídico → legalRecord, Visitas e Comunicações → visitors, Imagens → images, Movimentação → movements, Ocorrências → occurrences, Atividades → activities)
  - The `getVisibleTabs(person: UnifiedPerson)` function that filters `PROFILE_TABS` to include only tabs whose `requiresSection` is defined on the person (or `alwaysVisible`), preserving index order
- [x] 1.3 Export all new types and functions from `models/index.ts` barrel file

**Requirements:** 1, 2, 3, 10

## Task 2: Create unified mock data and update existing mocks with profiles array

- [x] 2.1 Add `perfis: Perfil[]` field to the `PessoaSnapVisao` interface in `data/pessoa-snap-visao.data.ts` (import `Perfil` from `../models/perfil.model`). Populate `PESSOA_SNAP_MOCK.perfis` with: `[{ tipo: 'alvo', ativo: true, dataInicio: '2023-01-15', detalhes: { motivo: 'Mandado de prisão ativo' } }]`
- [x] 2.2 Add `perfis: Perfil[]` field to the `PresoVisaoMock` interface in `data/preso-visao.data.ts` (import `Perfil` from `../models/perfil.model`). Populate `MOCK_PRESO_VISAO.perfis` with: `[{ tipo: 'preso', ativo: true, dataInicio: '2026-08-23', detalhes: { regime: 'Fechado', unidade: 'Instituto Penal Talavera Bruce' } }]`
- [x] 2.3 Create `data/unified-person.data.ts` with three exported constants:
  - `UNIFIED_PERSON_MOCK`: Maurício Nascimento — merged SIPEN+SNAP data. UUID v4 id. Identity fields (name, cpf, birthDate, rg, sex, age) from `MOCK_PRESO_VISAO` (SIPEN precedence). SNAP data (contacts, companies, warrants, processes, journals, digital profiles, electoral, transparency) from `PESSOA_SNAP_MOCK`. SIPEN data (custody, penalHistory, legalRecord, visitors, images, movements, occurrences, activities) from `MOCK_PRESO_VISAO`. Overlapping sections (contacts, companies, warrants, judicial processes, journals, digital profiles) combined from both sources. `profiles` array: `[{ tipo: 'preso', ativo: true, ... }, { tipo: 'alvo', ativo: false, ... }]`. Tags merged from both sources.
  - `SNAP_ONLY_PERSON_MOCK`: Carlos Eduardo Fonseca — SNAP-only. UUID v4 id. All identity from `PESSOA_SNAP_MOCK`. All SIPEN optional sections set to `undefined`. `profiles`: `[{ tipo: 'alvo', ativo: true, ... }]`.
  - `SIPEN_ONLY_PERSON_MOCK`: João Carlos Pires Ribeiro da Silva — SIPEN-only. UUID v4 id. Name changed to "João Carlos Pires Ribeiro da Silva", CPF and RG different from Maurício, all other SIPEN data cloned from `MOCK_PRESO_VISAO`. Minimal SNAP sections (empty arrays for contacts, companies, etc.). `profiles`: `[{ tipo: 'preso', ativo: true, ... }]`.

**Requirements:** 5, 10

## Task 3: Create ProfileComponent (TypeScript)

- [x] 3.1 Create `pages/profile/profile.component.ts` as a standalone Angular component with:
  - `selector: 'app-person-profile'`
  - `ChangeDetectionStrategy.OnPush`
  - PrimeNG imports: `CardModule`, `ButtonModule`, `TagModule`, `TableModule`, `TabsModule`, `AvatarModule`, `TooltipModule`, `SkeletonModule`, `ImageModule`, `AccordionModule`, `BreadcrumbModule`
  - Angular imports: `FormsModule`, `TitleCasePipe`, `CurrencyPipe`
  - Injected services: `Router`, `Location`, `ActivatedRoute`
  - `personId` signal via `toSignal(route.paramMap.pipe(map(p => p.get('id') ?? '')))`
  - `person` property: for now, resolve to `UNIFIED_PERSON_MOCK` (static; in future will lookup by id)
  - Signals: `activeTab = signal<number>(0)`, `timelinePage = signal<number>(0)`, `isLoading = signal<boolean>(false)`
  - Computed: `primaryProfile = computed(() => resolvePrimaryProfile(this.person.profiles))`, `hasCustodyData = computed(() => this.person.custody !== undefined)`, `visibleTabs = computed(() => getVisibleTabs(this.person))`
  - `timelinePageSize = 5`, computed `timelineEvents` (sliced from `penalHistory.events`), computed `totalTimelinePages`
  - Helper methods: `voltar()` (location.back), `navegar(rota, params?)`, `formatDate(iso)` (handles both ISO and dd/mm/yyyy), `tagStyle(tag)` (returns background+color for criminal classification tags), `riscoClasse` record, `timelineIcons` record, `isTagFaccao(categoria)`

**Requirements:** 3, 4, 8

## Task 4: Create ProfileComponent (HTML template)

- [x] 4.1 Create `pages/profile/profile.component.html` with the three-column layout:
  - **Header**: back button calling `voltar()`, title "Perfil da Pessoa", action buttons (Compartilhar, Editar Dados, Ações)
  - **Left sidebar** (`aside.coluna-identidade`): identity card with photo (or placeholder with initial), name, first alias as vulgo, CPF, RG (if available), SIPEN registration (if custody exists), tags with `tagStyle()`, divider, custody status and security classification (if custody exists), crime and article (if custody exists), risk level dot + label, monitoring badges (Monitorado, Alvo), action buttons (Monitorar, Ação), contextual alert (if defined)
  - **Center** (`section.coluna-central`): PrimeNG `p-tabs` iterating over `visibleTabs()`. Each tab renders its corresponding content section. Tab content sections: Visão Geral (identity fields + custody overview if present), Histórico Penal (timeline with pagination, remição de pena), Prontuário Jurídico (cálculo de pena, datas de benefício, processos SIPEN), Visitas e Comunicações (visitantes família, religiosos, advogados, atendimentos), Imagens (fotos, sinais característicos), Movimentação (transferências, histórico localização), Contatos (telefones, emails, endereços), Vínculos (pessoas relacionadas, empresas), Processos Judiciais (escavador + SEEU + SIPEN processes), Mandados BNMP, Diários Oficiais (escavador + querido diário), Perfis Digitais, Dados Eleitorais (filiação, candidaturas, vínculos eleitorais), Transparência (servidores públicos, despesas), Ocorrências (ordens de serviço, registro), Atividades (laborativas, educacionais)
  - **Right sidebar** (`aside.coluna-direita`): quick panels — Visitantes Recentes (first 3 from visitors.familyVisitors, or empty if no visitors), Advogados (first 2 from lawyers), Vínculos (first 3 from relatedPersons), Alertas e Monitoramento (contextual alert + monitoring tags), "Abrir grafo de vínculos" button (no destination, placeholder)
  - All links that previously navigated to removed pages (vinculos, grafo, alertas, monitoramento) should be rendered as `<a class="painel-link">` without `(click)` handler

**Requirements:** 3, 4, 8

## Task 5: Create ProfileComponent (SCSS styles)

- [x] 5.1 Create `pages/profile/profile.component.scss` merging styles from both `tela-12.component.scss` and `tela-19.component.scss`:
  - `:host` block with display, background, padding, color using SNAP design tokens
  - Three-column grid layout (`.coluna-identidade`, `.coluna-central`, `.coluna-direita`) matching the existing proportions from tela-12/tela-19
  - Header styles (`.cabecalho`, `.cab-esquerda`, `.cab-voltar`, `.cab-titulos`, `.cab-acoes`)
  - Identity card styles (`.cartao-identidade`, `.cartao-foto`, `.cartao-nome`, `.cartao-vulgo`, `.cartao-dados`, `.cartao-campo`, `.cartao-label`, `.cartao-valor`, `.cartao-tags`, `.cartao-divider`, `.cartao-status`, `.cartao-risco`, `.cartao-monitoramento`, `.cartao-botoes`, `.cartao-alerta`)
  - Tab content styles (`.tab-scroll`, `.conteudo-card`, `.conteudo-card-titulo`, `.campo-grid`, `.campo`, `.campo-label`, `.campo-valor`, `.fonte-badge`)
  - Sub-section styles (`.sub-secao`, `.sub-titulo`, `.item-inline`, `.item-compacto`, `.item-titulo`, `.item-desc`, `.item-meta`, `.item-data`, `.item-tipo`)
  - Timeline styles (`.timeline-container`, `.timeline-evento`, `.timeline-icone`, `.timeline-conteudo`, `.timeline-pag`)
  - Right sidebar panel styles (`.painel-bloco`, `.painel-bloco-titulo`, `.painel-item`, `.painel-link`, `.painel-monitoramento`)
  - Risk level dots (`.risco-critico`, `.risco-alto`, `.risco-medio`, `.risco-baixo`)
  - Tag styles (`.tag-faccao`, `.tag-neutral`, `.tag-monitorado`)
  - Empty state styles (`.estado-vazio-tab`, `.estado-vazio-inline`)
  - Responsive considerations for the three-column layout

**Requirements:** 4

## Task 6: Update routing and dashboard navigation

- [x] 6.1 Add the new route to `person.routes.ts`: insert `{ path: ':id/profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) }` after the `dashboard` route and before the existing `pessoas/:id` route. Keep all existing routes unchanged.
- [x] 6.2 Update `dashboard.component.ts`:
  - Change `navegarPessoa(pessoaId: string, perfil?: string)` to `navegarPessoa(pessoaId: string)` — remove the `perfil` parameter and always navigate to `['/intelligence/person', pessoaId, 'profile']`
  - Update all `(click)="navegarPessoa(m.id, m.perfilPrincipal)"` calls in `dashboard.component.html` to `(click)="navegarPessoa(m.id)"`
  - Import the three unified mock persons and add them to the `MONITORADOS_EXTRAS` array (or create a new computed that includes them), so that Maurício Nascimento, Carlos Eduardo Fonseca, and João Carlos Pires Ribeiro da Silva appear in the monitored list with correct `perfilPrincipal` resolved from their `profiles` array
  - Update `navegarPendencia()` to also use the new profile route format
- [x] 6.3 Update `breadcrumb.service.ts`: add `profile: 'Perfil'` to `KNOWN_LABELS` so the breadcrumb renders correctly for the new route segment
- [x] 6.4 Verify build compiles without errors by running `ng build --configuration=development`

**Requirements:** 6, 7, 9

## Task 7: Write property-based tests

- [ ] 7.1 (PBT) Property 1 — UnifiedPerson core field invariants: For any valid UnifiedPerson, `id` matches UUID v4 regex, `name` is non-empty, `cpf` is non-empty, `profiles` has >= 1 entry, `riskLevel` is one of `critico | alto | medio | baixo`. Use fast-check to generate arbitrary UnifiedPerson objects. **Validates: Requirements 1.4, 1.5**
- [ ] 7.2 (PBT) Property 2 — resolvePrimaryProfile returns highest-precedence active profile: For any non-empty `Perfil[]` array with at least one active profile, the returned `TipoPerfil` has the lowest `PROFILE_PRECEDENCE` index among active profiles. Generate arrays of 1-10 random Perfil objects with random types and active flags. **Validates: Requirements 2.1, 2.2**
- [ ] 7.3 (PBT) Property 3 — resolvePrimaryProfile fallback when no active profiles: For any non-empty `Perfil[]` array where all entries have `ativo: false`, the returned type has the lowest `PROFILE_PRECEDENCE` index among all profiles. **Validates: Requirement 2.3**
- [ ] 7.4 (PBT) Property 4 — Tab visibility determined by custody data: For any UnifiedPerson, `getVisibleTabs` always includes exactly 9 SNAP tabs; SIPEN tabs are included if and only if `custody` is defined. **Validates: Requirements 3.1, 3.2, 3.3**
- [ ] 7.5 (PBT) Property 5 — Tab ordering preserved after filtering: For any UnifiedPerson, `getVisibleTabs` returns tabs whose `index` values are in strictly ascending order. **Validates: Requirement 3.4**

**Requirements:** 1, 2, 3

## Task 8: Write unit tests

- [ ] 8.1 Test `resolvePrimaryProfile()` edge cases: empty array returns `undefined`; array with single unknown type returns that type; array with mixed known/unknown types returns highest-precedence known type
- [ ] 8.2 Test mock data integrity: all three unified mocks have valid UUID v4 ids; `UNIFIED_PERSON_MOCK` has `custody` defined and `profiles` with at least `preso`; `SNAP_ONLY_PERSON_MOCK` has `custody === undefined` and `profiles` with at least `alvo`; `SIPEN_ONLY_PERSON_MOCK` has `custody` defined and name === 'João Carlos Pires Ribeiro da Silva'
- [ ] 8.3 Test existing mock updates: `PESSOA_SNAP_MOCK.perfis` is a non-empty array with valid `Perfil` entries; `MOCK_PRESO_VISAO.perfis` is a non-empty array with valid `Perfil` entries
- [ ] 8.4 Test `getVisibleTabs()`: with a person that has all sections defined returns 16 tabs; with a person that has no SIPEN sections returns exactly 9 tabs; tab indices are always ascending

**Requirements:** 1, 2, 3, 5, 10
