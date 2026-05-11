# Requirements Document

## Introduction

This document specifies the requirements for porting all person flow screens, models, mock data, services, shared components, and global PrimeNG style overrides from the `gold-standards-prototype/snap-pessoas` project into the production `platform-frontend` application. The gold-standards project is the source of truth for the POI module. The port restructures routes to a semantic `/pessoas` and `/pessoas/:id` pattern, aligns divergent data models, adds new screens and services, and updates all internal navigation links — all within the `features/poi/` boundary plus targeted additions to `styles.scss`.

## Glossary

- **Gold_Standards**: The `gold-standards-prototype/snap-pessoas` project, serving as the source of truth for POI module screen implementations, models, data, and services.
- **Platform_Frontend**: The production `platform-frontend` Angular application that receives the ported code.
- **POI_Module**: The Person of Interest feature module located at `features/poi/` within Platform_Frontend.
- **Build_System**: The Angular CLI build pipeline invoked via `pnpm build` that compiles TypeScript, resolves imports, and produces the production bundle.
- **Router**: The Angular Router configured in `poi.routes.ts` that maps URL paths to lazy-loaded page components.
- **MockDataService**: The service at `features/poi/services/mock-data.service.ts` that provides mock data to page components.
- **TarefaBackgroundService**: A new service managing background task state with tooltip visibility for SIPEN/SNAP integration feedback.
- **Barrel_File**: The `index.ts` re-export file in `models/` that provides a single import point for all model interfaces.
- **Shell**: The platform-frontend's topbar, sidebar, and breadcrumb infrastructure that must remain untouched.
- **PessoaSnapVisao**: A rich data structure for the SNAP-enriched person view (tela-12), defined in `pessoa-snap-visao.data.ts`.
- **Legacy_Route**: A route using the old `/pessoas/tela-XX` pattern that must redirect to the new semantic path.
- **Semantic_Route**: A route using the new descriptive pattern such as `/pessoas/busca`, `/pessoas/:id/timeline`.

## Requirements

### Requirement 1: Model Alignment

**User Story:** As a developer, I want the POI module's TypeScript model interfaces to match the gold-standards versions exactly, so that all components and mock data use a single consistent set of type definitions.

#### Acceptance Criteria

1. WHEN the port is complete, THE POI_Module SHALL have `IndicadoresAnaliticos`, `Monitoramento`, and `SituacaoPrisional` interfaces in `pessoa.model.ts` that are identical to the Gold_Standards versions.
2. WHEN the `IndicadoresAnaliticos` interface is updated, THE POI_Module SHALL use field names `periculosidade`, `nivelRisco` (union type), `relevancia`, `qtdAlertas`, `qtdVinculos`, and `qtdDocumentosCitantes` instead of the previous field names.
3. WHEN the `Monitoramento` interface is updated, THE POI_Module SHALL use field names `monitorado`, `alvo`, `dataInicioMonitoramento`, `setorResponsavel`, and `criticidade` (union type), and SHALL remove the fields `dataFim` and `motivo`.
4. WHEN the `SituacaoPrisional` interface is updated, THE POI_Module SHALL make `unidade` and `regime` required fields, rename `dataIngresso` to `dataUltimaAtualizacao`, and remove the field `previsaoSaida`.
5. THE Barrel_File (`models/index.ts`) SHALL export all updated interfaces including `Monitoramento` and `SituacaoPrisional`.
6. WHEN model files `alerta.model.ts`, `fonte.model.ts`, `perfil.model.ts`, `tag.model.ts`, and `vinculo.model.ts` are compared, THE POI_Module SHALL confirm they are identical between Gold_Standards and Platform_Frontend and leave them unchanged.

### Requirement 2: Mock Data Synchronization

**User Story:** As a developer, I want all mock data files to be synchronized with the gold-standards versions, so that page components render with the latest test data and conform to the updated model interfaces.

#### Acceptance Criteria

1. WHEN the port is complete, THE POI_Module SHALL have `pessoas.data.ts` overwritten with the Gold_Standards version, conforming to the updated model interfaces.
2. WHEN mock data files `alertas.data.ts`, `cadastro-integracao.data.ts`, `preso-visao.data.ts`, `tags.data.ts`, and `vinculos.data.ts` are compared against Gold_Standards, THE POI_Module SHALL sync any divergent files to the Gold_Standards version.
3. WHEN the port is complete, THE POI_Module SHALL contain a new file `pessoa-snap-visao.data.ts` copied from Gold_Standards, placed at `features/poi/data/pessoa-snap-visao.data.ts`.
4. WHEN data files reference model imports, THE POI_Module SHALL use the barrel import path `'../models'` instead of direct file imports like `'../models/pessoa.model'`.
5. WHEN mock data files reference photo asset paths, THE POI_Module SHALL use the Platform_Frontend convention `/images/photos/pessoa-XX.png` instead of the Gold_Standards convention `assets/images/photos/pessoa-XX.png`.

### Requirement 3: Service Synchronization

**User Story:** As a developer, I want the POI module's services to match the gold-standards versions, so that page components have access to all required data providers and background task management.

#### Acceptance Criteria

1. WHEN the port is complete, THE POI_Module SHALL have `mock-data.service.ts` synced to the Gold_Standards version.
2. WHEN the port is complete, THE POI_Module SHALL contain a new file `tarefa-background.service.ts` copied from Gold_Standards, placed at `features/poi/services/tarefa-background.service.ts`.
3. THE TarefaBackgroundService SHALL use Angular signals for reactive state management.

### Requirement 4: Shared Component Synchronization

**User Story:** As a developer, I want all shared POI components to match the gold-standards versions, so that page components render with the latest visual and behavioral improvements.

#### Acceptance Criteria

1. WHEN the port is complete, THE POI_Module SHALL have all 6 shared components (`divergence-indicator`, `empty-state`, `loading-content`, `partial-data-indicator`, `placeholder`, `source-badge`) synced to the Gold_Standards versions across their `.ts`, `.html`, and `.scss` files.
2. WHEN shared components are synced, THE POI_Module SHALL preserve the existing `index.ts` barrel file and `poi-component.types.ts` file that are present in Platform_Frontend but absent in Gold_Standards.

### Requirement 5: Page Component Porting

**User Story:** As a developer, I want all 24 person flow screens plus the cadastro and module placeholder pages ported from gold-standards, so that the production app contains the latest screen implementations.

#### Acceptance Criteria

1. WHEN the port is complete, THE POI_Module SHALL have existing page components (tela-01 through tela-04, cadastro-integracao, tela-10, tela-11, tela-13 through tela-24) overwritten with the Gold_Standards versions across their `.ts`, `.html`, and `.scss` files.
2. WHEN the port is complete, THE POI_Module SHALL replace the `tela-12-visao-geral/` directory with `tela-12-visao-pessoa-snap/` from Gold_Standards, and the old `tela-12-visao-geral/` directory SHALL be removed.
3. WHEN the port is complete, THE POI_Module SHALL contain new page directories copied from Gold_Standards: `tela-05-cadastro-rapido/`, `tela-06-identidade-incompleta/`, `tela-07-integracao-sipen/`, `tela-08-integracao-snap/`, `tela-09-conciliacao/`, and `modulo-placeholder/`.
4. IF Gold_Standards uses a generic `modulo-placeholder` component instead of individual module placeholder pages, THEN THE POI_Module SHALL adopt the same generic pattern and evaluate removal of individual placeholder pages (`modulo-analise/`, `modulo-busca/`, `modulo-configuracoes/`, `modulo-documentos/`, `modulo-monitoramento/`).
5. WHEN page components are ported, THE POI_Module SHALL adjust all import paths to resolve correctly within the Platform_Frontend directory structure, using barrel imports for models.

### Requirement 6: Route Restructuring

**User Story:** As a developer, I want the POI routes restructured from the `/pessoas/tela-XX` pattern to semantic paths like `/pessoas`, `/pessoas/:id`, and `/pessoas/:id/timeline`, so that URLs are descriptive and support person-specific navigation via route parameters.

#### Acceptance Criteria

1. WHEN the port is complete, THE Router SHALL map Block A routes: `pessoas` → Tela01, `pessoas/busca` → Tela02, `pessoas/resultados` → Tela03, `pessoas/filtros` → Tela04.
2. WHEN the port is complete, THE Router SHALL map Block B routes: `pessoas/cadastro` → CadastroIntegracao, `pessoas/cadastro-rapido` → Tela05, `pessoas/identidade-incompleta` → Tela06, `pessoas/integracao-sipen` → Tela07, `pessoas/integracao-snap` → Tela08, `pessoas/conciliacao` → Tela09, `pessoas/duplicidades` → Tela10, `pessoas/duplicidades/comparar` → Tela11.
3. WHEN the port is complete, THE Router SHALL map Block C routes: `pessoas/:id` → Tela12, `pessoas/:id/timeline` → Tela13, `pessoas/:id/vinculos` → Tela14, `pessoas/:id/grafo` → Tela15, `pessoas/:id/tags` → Tela16, `pessoas/:id/alertas` → Tela17, `pessoas/:id/monitoramento` → Tela18.
4. WHEN the port is complete, THE Router SHALL map Block D routes: `pessoas/:id/perfil/preso` → Tela19, `pessoas/:id/perfil/ex-preso` → Tela20, `pessoas/:id/perfil/visitante` → Tela21, `pessoas/:id/perfil/advogado` → Tela22, `pessoas/:id/perfil/alvo` → Tela23, `pessoas/:id/perfil/servidor` → Tela24.
5. WHEN the port is complete, THE Router SHALL map module placeholder route: `modulo/:nome` → ModuloPlaceholderComponent.
6. WHEN a user navigates to a Legacy_Route (e.g., `pessoas/tela-01`), THE Router SHALL redirect to the corresponding Semantic_Route (e.g., `pessoas`).
7. THE Router SHALL use `loadComponent` for lazy loading on every page route.

### Requirement 7: Internal Navigation Link Updates

**User Story:** As a developer, I want all internal navigation links in ported components updated to use the new semantic route paths with the `/poi/` prefix, so that inter-screen navigation works correctly in the production app.

#### Acceptance Criteria

1. WHEN page components are ported, THE POI_Module SHALL update all `router.navigate()` calls and `routerLink` directives from Gold_Standards paths (e.g., `/pessoas/tela-12`) to Platform_Frontend paths (e.g., `/poi/pessoas/:id`).
2. WHEN Block C and Block D components navigate to person-specific routes, THE POI_Module SHALL use the dynamic person ID from the route parameter instead of hardcoded identifiers.
3. WHEN module links are ported, THE POI_Module SHALL prefix module paths with `/poi/` (e.g., `/modulo/busca` → `/poi/modulo/busca`).
4. WHEN the `voltar()` method in tela-12 is ported, THE POI_Module SHALL navigate to `/poi/pessoas` instead of `/pessoas/tela-01`.

### Requirement 8: Route Parameter Integration

**User Story:** As a developer, I want Block C and Block D page components to read the `:id` route parameter and use it to look up the person from MockDataService, so that person-specific screens display the correct data.

#### Acceptance Criteria

1. WHEN a Block C or Block D page component is loaded, THE POI_Module SHALL read the `:id` parameter from the activated route.
2. WHEN the `:id` parameter is available, THE POI_Module SHALL use MockDataService to look up the corresponding person data.
3. IF the `:id` parameter does not match any person in MockDataService, THEN THE POI_Module SHALL handle the missing data gracefully without rendering errors.

### Requirement 9: Global Style Updates

**User Story:** As a developer, I want the missing PrimeNG style overrides from gold-standards added to the platform-frontend's `styles.scss`, so that ported components render with the correct visual appearance.

#### Acceptance Criteria

1. WHEN the port is complete, THE Platform_Frontend SHALL include PrimeNG focus overrides for `p-select` and `p-inputtext` using `--snap-pillar-color` and `--snap-focus-ring` tokens.
2. WHEN the port is complete, THE Platform_Frontend SHALL include the select sizing override for `.select-listar .p-select`.
3. WHEN the port is complete, THE Platform_Frontend SHALL include the multiselect highlight override replacing Aura green with pillar color.
4. WHEN the port is complete, THE Platform_Frontend SHALL include dialog consulta overrides for header separator, semi-transparent background, and blur backdrop.
5. WHEN the port is complete, THE Platform_Frontend SHALL include the `p-tag` label font-weight override (`font-weight: 400`).
6. WHEN the port is complete, THE Platform_Frontend SHALL include the `p-card` border override for `.coluna-direita`.
7. WHEN the port is complete, THE Platform_Frontend SHALL include the `p-avatar img` override for `object-fit: cover; object-position: center top`.
8. WHEN the port is complete, THE Platform_Frontend SHALL include profile color tokens (`--snap-perfil-alvo`, `--snap-perfil-visitante`, `--snap-perfil-familiar`, `--snap-perfil-pessoa-relacionada`, `--snap-perfil-advogado`, `--snap-perfil-servidor`) in the `:root` scope.
9. WHEN style overrides are added, THE Platform_Frontend SHALL only ADD new rules to `styles.scss` — no existing rules SHALL be modified or removed.
10. THE Platform_Frontend SHALL NOT duplicate SNAP design tokens, dark mode tokens, `@font-face` declarations, or any rules already present in `styles.scss`.

### Requirement 10: Build Integrity

**User Story:** As a developer, I want the production build to succeed with zero errors after all porting changes, so that the application remains deployable.

#### Acceptance Criteria

1. WHEN all porting changes are applied, THE Build_System SHALL compile the Platform_Frontend with zero TypeScript errors.
2. WHEN all porting changes are applied, THE Build_System SHALL resolve every import statement in every ported file to an existing file in Platform_Frontend.
3. WHEN all porting changes are applied, THE Build_System SHALL produce zero type errors from mock data files against the updated model interfaces.

### Requirement 11: Shell and Feature Isolation

**User Story:** As a developer, I want the port to be contained within the POI feature boundary, so that existing platform-frontend infrastructure (auth, shell, other features) remains unaffected.

#### Acceptance Criteria

1. THE POI_Module port SHALL NOT modify any files in the Shell (topbar, sidebar, breadcrumb components).
2. THE POI_Module port SHALL NOT modify authentication guards, interceptors, or authorization logic.
3. THE POI_Module port SHALL NOT modify files belonging to other features (Audit, SNAP feature).
4. THE POI_Module port SHALL NOT introduce new npm dependencies beyond what is already in Platform_Frontend's `package.json`.
5. WHEN style overrides are added to `styles.scss`, THE Platform_Frontend SHALL scope overrides where possible to avoid affecting components outside the POI feature.

### Requirement 12: Component Architecture Preservation

**User Story:** As a developer, I want all ported components to preserve the Angular architecture patterns used in both projects, so that the codebase remains consistent and performant.

#### Acceptance Criteria

1. THE POI_Module SHALL use standalone components for all ported page and shared components.
2. THE POI_Module SHALL use `ChangeDetectionStrategy.OnPush` for all ported components.
3. THE POI_Module SHALL use `loadComponent` lazy loading for all page routes.
4. WHEN new services are added, THE POI_Module SHALL use `inject()` for dependency injection and `signal()` for reactive state where applicable.
