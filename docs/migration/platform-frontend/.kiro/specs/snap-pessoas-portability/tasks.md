# Implementation Plan: SNAP-Pessoas Portability

## Overview

Port the SNAP-Pessoas prototype (24 POI screens, intelligence UI components, data models, mock data) into the production `platform-frontend` application across 4 sequential phases: Foundation, Shell Evolution, Feature Porting, and Data & Mocks. Each phase builds on the previous, keeping the app functional at every step.

## Tasks

- [x] 1. Phase 01 — Foundation: Dependencies, fonts, tokens, and global styles
  - [x] 1.1 Bump primeng version and copy font/branding assets
    - Update `package.json` to set `primeng` to `^21.1.4`
    - Copy `PrototipoPOI/snap-pessoas/src/assets/fonts/cygnito-mono-2.otf` to `platform-frontend/public/fonts/cygnito-mono-2.otf`
    - Copy branding logo SVG to `platform-frontend/public/` if not already present
    - _Requirements: 1.1, 1.2, 1.3, 2.1_

  - [x] 1.2 Add @font-face, .font-accent, SNAP design tokens, and PrimeNG overrides to styles.scss
    - Add `@font-face` for Cygnito Mono with `font-family: 'Cygnito Mono'`, `format('opentype')`, weight 400, style normal, path `/fonts/cygnito-mono-2.otf`
    - Add `.font-accent` utility class: `font-family: 'Cygnito Mono', monospace`
    - Add all SNAP light-mode tokens under `:root` (--snap-surface-_, --snap-text-_, --snap-border-_, --snap-pillar-_, --snap-focus-ring, --snap-overlay-bg, --snap-perfil-\*)
    - Add all SNAP dark-mode token overrides under `.p-dark` selector (NOT `.snap-dark`)
    - Add PrimeNG global overrides for `p-select`, `p-inputtext` focus (pillar color border + focus ring), multiselect highlight (pillar color 15% opacity), checkbox highlight (pillar color bg/border)
    - _Requirements: 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 15.2, 15.4, 16.1, 16.2, 16.3_

  - [ ]\* 1.3 Write property test: SNAP Token Completeness and Dark Mode Switching
    - **Property 1: SNAP Token Completeness and Dark Mode Switching**
    - For all SNAP design tokens, verify each token has a value under `:root` AND under `.p-dark`, and that toggling `.p-dark` switches computed values
    - **Validates: Requirements 3.1, 3.2, 3.3, 15.2**

- [x] 2. Checkpoint — Foundation complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify `pnpm install` succeeds with updated package.json
  - Verify font file exists at `public/fonts/cygnito-mono-2.otf`

- [x] 3. Phase 02 — Shell Evolution: Theme preset, sidebar, header, breadcrumb, routes
  - [x] 3.1 Create InteligenciaPreset and register in app.config.ts
    - Create `src/app/themes/inteligencia-preset.ts` using `definePreset(Aura, ...)` from `@primeuix/themes` (NOT `@primeng/themes`)
    - Define burgundy `#72284B` primary palette (50–950), override ONLY the `semantic.primary` tokens — do NOT override surface, danger, info, success, or warn
    - Keep `ApoloPreset` as the default preset in `providePrimeNG` in `app.config.ts`
    - _Requirements: 4.1, 4.2, 4.5_

  - [ ]\* 3.2 Write property test: InteligenciaPreset Scope Restriction
    - **Property 3: InteligenciaPreset Scope Restriction**
    - Verify that InteligenciaPreset only overrides the `primary` semantic palette and does not define overrides for surface, danger, info, success, or warn
    - **Validates: Requirement 4.5**

  - [x] 3.3 Add POI nav item to SidebarService
    - Add `{ label: 'shell.nav.poi', icon: 'pi pi-users', route: '/poi' }` to the `intelligence` section items array
    - Preserve all existing nav items (SNAP Search, Audit) without modification
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 3.4 Evolve HeaderComponent for pillar border and org context
    - Inject `Router` and detect if current route is under `/poi/`
    - When in POI context: apply 7px `border-top` using `--snap-pillar-color`, display org context "SEAP-RJ" in topbar area
    - When NOT in POI context: no pillar border, no org context
    - Preserve existing theme toggle, i18n, and user menu
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 3.5 Write property test: Theme Navigation Round-Trip
    - **Property 2: Theme Navigation Round-Trip**
    - For any sequence of navigations between `/poi/` and non-`/poi/` routes, verify ApoloPreset is active on non-POI routes and InteligenciaPreset context is active on POI routes, with no residual state
    - **Validates: Requirements 4.3, 4.4**

  - [x] 3.6 Evolve BreadcrumbService with POI labels
    - Add POI route segment labels to `KNOWN_LABELS`: `poi` → 'Pessoas de Interesse', `pessoas` → 'Pessoas', `tela-01` → 'Painel Inicial', `tela-02` → 'Busca Geral', `tela-03` → 'Resultado da Busca', `tela-04` → 'Filtros Avançados', `cadastro` → 'Cadastro e Integração', `tela-10` → 'Fila de Duplicidades', `tela-11` → 'Comparação de Duplicidade', `tela-12` → 'Visão Geral', `tela-13` → 'Timeline', `tela-14` → 'Vínculos', `tela-15` → 'Grafo', `tela-16` → 'Tags', `tela-17` → 'Alertas', `tela-18` → 'Monitoramento', `tela-19` → 'Visão Preso', `tela-20` → 'Visão Ex-Preso', `tela-21` → 'Visão Visitante', `tela-22` → 'Visão Advogado', `tela-23` → 'Visão Alvo', `tela-24` → 'Visão Servidor', `modulo` → 'Módulos', `busca` → 'Busca', `analise` → 'Análise', `documentos` → 'Documentos', `monitoramento` → 'Monitoramento', `configuracoes` → 'Configurações'
    - Apply `.font-accent` (Cygnito Mono) to breadcrumb text when in POI context
    - Preserve existing labels for `/snap` and `/audit-logs`
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]\* 3.7 Write property test: Breadcrumb Label Resolution for POI Routes
    - **Property 5: Breadcrumb Label Resolution for POI Routes**
    - For all POI route segments, verify BreadcrumbService resolves each into a non-empty descriptive Portuguese label
    - **Validates: Requirement 7.1**

  - [x] 3.8 Add /poi/ route to app.routes.ts
    - Add a `poi` child route under `ShellComponent` that lazy-loads `poi.routes.ts` via `loadChildren`
    - Do NOT modify existing `/snap` or `/audit-logs` routes
    - POI routes are protected by existing `AuthGuard` through the `ShellComponent` parent route
    - _Requirements: 8.1, 8.6, 8.7_

- [x] 4. Checkpoint — Shell evolution complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify sidebar shows POI nav item
  - Verify header shows pillar border on /poi/ routes
  - Verify breadcrumb resolves POI labels

- [x] 5. Phase 03 — Feature Porting: Intelligence UI components, 24 screens, module placeholders, POI routes
  - [x] 5.1 Port intelligence UI components to features/poi/components/
    - Port `SourceBadgeComponent` — renders source label for each `TipoFonte` value (sipen, snap, manual)
    - Port `DivergenceIndicatorComponent` — renders visual state for each `StatusDivergencia` value
    - Port `PartialDataIndicatorComponent` — signals incomplete identity data
    - Port `EmptyStateComponent` — contextual empty state with icon, title, subtitle, actions
    - Port `LoadingContentComponent` — skeleton or progress loading state
    - Port `PlaceholderComponent` — generic placeholder for unimplemented modules
    - All components: standalone, `ChangeDetectionStrategy.OnPush`, no imports from `shell/` or `auth/`
    - Adapt all SCSS: replace `.snap-dark` / `:host-context(.snap-dark)` with `.p-dark` / `:host-context(.p-dark)`
    - Use SNAP design tokens for styling (no hardcoded colors)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [ ]\* 5.2 Write property test: Intelligence Component Isolation
    - **Property 7: Intelligence Component Isolation**
    - For all intelligence UI components, verify import statements do not reference `shell/`, `auth/`, or any path outside `features/poi/`
    - **Validates: Requirements 10.4, 10.7**

  - [ ]\* 5.3 Write property test: Intelligence Component Union-Type Rendering
    - **Property 8: Intelligence Component Union-Type Rendering**
    - For all `TipoFonte` values, verify SourceBadge renders the corresponding label. For all `StatusDivergencia` values, verify DivergenceIndicator renders a corresponding visual state
    - **Validates: Requirements 10.5, 10.6**

  - [ ]\* 5.4 Write property test: POI Component Standards Compliance
    - **Property 6: POI Component Standards Compliance**
    - For all POI components in `features/poi/`, verify each is standalone, uses `ChangeDetectionStrategy.OnPush`, and contains no `.snap-dark` or `.snap-light` references in SCSS
    - **Validates: Requirements 9.4, 9.5, 10.2**

  - [x] 5.5 Port Block A screens (tela-01 through tela-04) to features/poi/pages/
    - Port `Tela01Component` (Painel Inicial) to `features/poi/pages/tela-01-painel-inicial/`
    - Port `Tela02Component` (Busca Geral) to `features/poi/pages/tela-02-busca-geral/`
    - Port `Tela03Component` (Resultado Busca) to `features/poi/pages/tela-03-resultado-busca/`
    - Port `Tela04Component` (Filtros Avançados) to `features/poi/pages/tela-04-filtros-avancados/`
    - All: standalone, OnPush, adapt SCSS `.snap-dark` → `.p-dark`
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [x] 5.6 Port Block B screens (cadastro-integracao, tela-10, tela-11) to features/poi/pages/
    - Port `CadastroIntegracaoComponent` to `features/poi/pages/cadastro-integracao/`
    - Port `Tela10Component` (Fila Duplicidades) to `features/poi/pages/tela-10-fila-duplicidades/`
    - Port `Tela11Component` (Comparação Duplicidade) to `features/poi/pages/tela-11-comparacao-duplicidade/`
    - All: standalone, OnPush, adapt SCSS `.snap-dark` → `.p-dark`
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [x] 5.7 Port Block C screens (tela-12 through tela-18) to features/poi/pages/
    - Port `Tela12Component` (Visão Geral) to `features/poi/pages/tela-12-visao-geral/`
    - Port `Tela13Component` (Timeline) to `features/poi/pages/tela-13-timeline/`
    - Port `Tela14Component` (Vínculos) to `features/poi/pages/tela-14-vinculos/`
    - Port `Tela15Component` (Grafo) to `features/poi/pages/tela-15-grafo/`
    - Port `Tela16Component` (Tags) to `features/poi/pages/tela-16-tags/`
    - Port `Tela17Component` (Alertas) to `features/poi/pages/tela-17-alertas/`
    - Port `Tela18Component` (Monitoramento) to `features/poi/pages/tela-18-monitoramento/`
    - All: standalone, OnPush, adapt SCSS `.snap-dark` → `.p-dark`
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [x] 5.8 Port Block D screens (tela-19 through tela-24) to features/poi/pages/
    - Port `Tela19Component` (Visão Preso) to `features/poi/pages/tela-19-visao-preso/`
    - Port `Tela20Component` (Visão Ex-Preso) to `features/poi/pages/tela-20-visao-ex-preso/`
    - Port `Tela21Component` (Visão Visitante) to `features/poi/pages/tela-21-visao-visitante/`
    - Port `Tela22Component` (Visão Advogado) to `features/poi/pages/tela-22-visao-advogado/`
    - Port `Tela23Component` (Visão Alvo) to `features/poi/pages/tela-23-visao-alvo/`
    - Port `Tela24Component` (Visão Servidor) to `features/poi/pages/tela-24-visao-servidor/`
    - All: standalone, OnPush, adapt SCSS `.snap-dark` → `.p-dark`
    - _Requirements: 9.1, 9.3, 9.4, 9.5_

  - [x] 5.9 Port module placeholders to features/poi/pages/
    - Port `ModuloBuscaComponent` to `features/poi/pages/modulo-busca/`
    - Port `ModuloAnaliseComponent` to `features/poi/pages/modulo-analise/`
    - Port `ModuloDocumentosComponent` to `features/poi/pages/modulo-documentos/`
    - Port `ModuloMonitoramentoComponent` to `features/poi/pages/modulo-monitoramento/`
    - Port `ModuloConfiguracoesComponent` to `features/poi/pages/modulo-configuracoes/`
    - All: standalone, OnPush, adapt SCSS `.snap-dark` → `.p-dark`
    - _Requirements: 9.2, 9.4, 9.5_

  - [x] 5.10 Create poi.routes.ts with all routes under /poi/ prefix
    - Create `features/poi/poi.routes.ts` with routes for all 24 screens + 5 module placeholders
    - Default redirect: `/poi/` → `/poi/pessoas/tela-01`
    - Redirect routes: tela-05 through tela-09 → `pessoas/cadastro`
    - All non-redirect routes use `loadComponent` for lazy loading
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

  - [ ]\* 5.11 Write property test: POI Route Completeness and Lazy Loading
    - **Property 4: POI Route Completeness and Lazy Loading**
    - For all expected screen identifiers (tela-01..24) and module placeholders (busca, analise, documentos, monitoramento, configuracoes), verify a route exists in `poi.routes.ts` under `/poi/` prefix and each non-redirect route uses `loadComponent`
    - **Validates: Requirements 8.2, 8.3**

- [x] 6. Checkpoint — Feature porting complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 24 screens render within the shell at their respective /poi/ routes
  - Verify existing /snap and /audit-logs routes still work

- [x] 7. Phase 04 — Data & Mocks: Models, mock data, MockDataService
  - [x] 7.1 Create POI data models in features/poi/models/
    - Create `pessoa.model.ts` with `Pessoa`, `IndicadoresAnaliticos`, `Monitoramento`, `SituacaoPrisional` interfaces
    - Create `alerta.model.ts` with `Alerta` interface (severidade: 'critica' | 'alta' | 'media' | 'baixa')
    - Create `fonte.model.ts` with `TipoFonte` type, `Fonte` interface, `StatusDivergencia` type
    - Create `perfil.model.ts` with `TipoPerfil` type (8 profile types), `Perfil` interface
    - Create `tag.model.ts` with `Tag` interface
    - Create `vinculo.model.ts` with `TipoVinculo` type (6 connection types), `Vinculo` interface
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]\* 7.2 Write property test: Mock Data Model Validity
    - **Property 10: Mock Data Model Validity**
    - For all Pessoa objects in mock data, verify `perfis` has at least one entry, `fontes` has at least one entry, and `id`/`nome` are non-empty strings
    - **Validates: Requirements 11.2, 12.3**

  - [x] 7.3 Port mock data files to features/poi/data/
    - Port `pessoas.data.ts` — array of Pessoa objects with realistic mock data
    - Port `alertas.data.ts` — array of Alerta objects referencing valid pessoaIds
    - Port `cadastro-integracao.data.ts` — mock data for registration/integration screens
    - Port `preso-visao.data.ts` — mock data for inmate profile view
    - Port `tags.data.ts` — array of Tag objects
    - Port `vinculos.data.ts` — array of Vinculo objects referencing valid pessoaOrigemId/pessoaDestinoId
    - Ensure all pessoaId references in alertas and vinculos point to existing Pessoa IDs
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]\* 7.4 Write property test: Mock Data Referential Integrity
    - **Property 9: Mock Data Referential Integrity**
    - For all Alerta objects, verify `pessoaId` references an existing Pessoa ID. For all Vinculo objects, verify both `pessoaOrigemId` and `pessoaDestinoId` reference existing Pessoa IDs
    - **Validates: Requirement 12.2**

  - [x] 7.5 Create MockDataService in features/poi/services/
    - Create `mock-data.service.ts` as `@Injectable({ providedIn: 'root' })`
    - Expose `pessoas`, `alertas`, `vinculos`, `tags` as read-only `Signal` properties
    - Implement `getPessoaById(id: string): Signal<Pessoa | undefined>` — returns matching Pessoa or undefined
    - Implement `getAlertasByPessoaId(pessoaId: string): Signal<Alerta[]>` — returns only matching alertas
    - Implement `getVinculosByPessoaId(pessoaId: string): Signal<Vinculo[]>` — returns vinculos where pessoaOrigemId OR pessoaDestinoId matches
    - Implement `getTagsByPessoaId(pessoaId: string): Signal<Tag[]>` — returns matching tags
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [ ]\* 7.6 Write property test: MockDataService Lookup Correctness
    - **Property 11: MockDataService Lookup Correctness**
    - For any string ID, verify `getPessoaById(id)` returns a Signal with the matching Pessoa if it exists, or undefined if not
    - **Validates: Requirements 13.3, 13.4**

  - [ ]\* 7.7 Write property test: MockDataService Filtered Query Correctness
    - **Property 12: MockDataService Filtered Query Correctness**
    - For any pessoaId, verify `getAlertasByPessoaId` returns exactly the matching alertas (no omissions, no false inclusions). Verify `getVinculosByPessoaId` returns exactly vinculos where pessoaOrigemId or pessoaDestinoId matches
    - **Validates: Requirements 13.5, 13.6**

- [x] 8. Final checkpoint — All phases complete
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all 24 POI screens render correctly under /poi/ prefix
  - Verify existing /snap and /audit-logs routes are unaffected
  - Verify dark mode toggle switches all SNAP tokens and PrimeNG theme correctly
  - Verify sidebar POI nav item navigates to /poi/
  - Verify header pillar border appears only on /poi/ routes

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each phase
- Property tests validate universal correctness properties from the design document (Properties 1–12)
- All ported SCSS must adapt `.snap-dark` / `.snap-light` → `.p-dark` / `:host-context(.p-dark)`
- The prototype's ThemeService is NOT ported; the target's existing ThemeService is kept
- The prototype uses `@primeng/themes`; the target uses `@primeuix/themes` — imports must be adapted
- Font paths change from `/assets/fonts/` (prototype) to `/fonts/` (target public directory)
- Route paths in the prototype are at root level; in the target they're under `/poi/` prefix
