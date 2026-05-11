# Requirements Document

## Introduction

This document defines the requirements for porting the SNAP-Pessoas prototype (People of Interest module) into the production `platform-frontend` application. The portability is organized in four sequential phases: Foundation (dependencies, global styles, fonts, SNAP design tokens), Shell Evolution (InteligenciaPreset theme, sidebar POI navigation, header pillar border, breadcrumb POI labels), Feature Porting (24 POI screens, intelligence UI components, POI routes under `/poi/` prefix), and Data & Mocks (models, mock data, MockDataService). All existing functionality (SNAP search, audit logs, auth, shell) must remain fully operational throughout.

## Glossary

- **Platform**: The `platform-frontend` Angular application that is the target of the portability
- **Prototype**: The `PrototipoPOI/snap-pessoas/` application that is the source of the portability
- **Shell**: The existing layout structure composed of Sidebar, Header, and Breadcrumb components
- **ApoloPreset**: The existing PrimeNG theme preset using steel/blue-gray primary colors
- **InteligenciaPreset**: The new PrimeNG theme preset using burgundy `#72284B` as primary color for the Intelligence pillar
- **SNAP_Tokens**: Custom CSS variables (`--snap-*`) for surfaces, text, borders, pillar colors, and profile colors
- **POI_Module**: The People of Interest feature module, scoped under `features/poi/`
- **POI_Routes**: All Angular routes prefixed with `/poi/` serving the 24 POI screens and module placeholders
- **Sidebar_Service**: The `SidebarService` that manages navigation sections, sidebar modes (pinned/auto/collapsed), and expansion state
- **Header_Component**: The `HeaderComponent` responsible for the top bar including theme toggle, breadcrumb, and user actions
- **Breadcrumb_Service**: The service that resolves route segments into human-readable breadcrumb labels
- **MockDataService**: The injectable service that provides signal-based access to mock data for all POI screens
- **Pessoa**: The core data model representing a Person of Interest with identity, profiles, sources, and analytical indicators
- **ThemeService**: The existing service that toggles dark mode via the `.p-dark` CSS class
- **Cygnito_Mono**: The monospace accent font used for short titles and breadcrumb styling in POI context
- **Intelligence_Components**: Standalone UI components specific to the Intelligence domain (SourceBadge, DivergenceIndicator, PartialDataIndicator, EmptyState, LoadingContent)

## Requirements

### Requirement 1: Dependency Alignment

**User Story:** As a developer, I want the platform-frontend dependencies to be aligned with the prototype versions, so that all PrimeNG features used by POI screens work correctly.

#### Acceptance Criteria

1. WHEN the portability Phase 01 is complete, THE Platform SHALL have `primeng` at version `^21.1.4` in `package.json`
2. THE Platform SHALL retain all existing npm dependencies without removal or downgrade
3. THE Platform SHALL introduce no new npm package dependencies beyond what already exists in `package.json`

### Requirement 2: Cygnito Mono Font Registration

**User Story:** As a developer, I want the Cygnito Mono font available in the platform, so that POI screens and breadcrumbs can use the accent monospace font.

#### Acceptance Criteria

1. THE Platform SHALL include the Cygnito Mono font file at `public/fonts/cygnito-mono-2.otf`
2. THE Platform SHALL register Cygnito Mono via a `@font-face` declaration in `styles.scss` with font-family `'Cygnito Mono'`, format `opentype`, weight `400`, and style `normal`
3. THE Platform SHALL provide a `.font-accent` utility CSS class that applies `font-family: 'Cygnito Mono', monospace`
4. IF the Cygnito Mono font file is missing, THEN THE Platform SHALL fall back to the generic `monospace` font family via the font-family stack

### Requirement 3: SNAP Design Tokens

**User Story:** As a developer, I want SNAP design tokens available as global CSS variables, so that all POI components can use consistent surface, text, border, pillar, and profile colors in both light and dark modes.

#### Acceptance Criteria

1. THE Platform SHALL define all SNAP light-mode tokens under `:root` in `styles.scss`, including `--snap-surface-1`, `--snap-surface-2`, `--snap-surface-3`, `--snap-text-primary`, `--snap-text-secondary`, `--snap-text-muted`, `--snap-border-subtle`, `--snap-border-default`, `--snap-pillar-color`, `--snap-pillar-light`, `--snap-pillar-dark`, `--snap-focus-ring`, `--snap-overlay-bg`, and all `--snap-perfil-*` profile color tokens
2. THE Platform SHALL define all SNAP dark-mode token overrides under the `.p-dark` selector in `styles.scss`
3. WHEN the ThemeService toggles dark mode by adding the `.p-dark` class, THE SNAP_Tokens SHALL switch to their dark-mode values
4. THE Platform SHALL NOT use `.snap-dark` or `.snap-light` as dark mode selectors; all dark mode switching SHALL use the existing `.p-dark` selector

### Requirement 4: InteligenciaPreset Theme

**User Story:** As a developer, I want an InteligenciaPreset theme for the Intelligence pillar, so that POI routes display the burgundy `#72284B` primary palette while other routes keep the ApoloPreset.

#### Acceptance Criteria

1. THE Platform SHALL define an `InteligenciaPreset` in `themes/inteligencia-preset.ts` using `definePreset(Aura, ...)` with burgundy `#72284B` as the primary-900 value and a complete primary palette from 50 to 950
2. THE Platform SHALL keep `ApoloPreset` as the default preset in the `providePrimeNG` configuration in `app.config.ts`
3. WHEN a user navigates to a route under `/poi/`, THE Shell SHALL apply the InteligenciaPreset context
4. WHEN a user navigates away from `/poi/` routes, THE Shell SHALL restore the ApoloPreset context without residual InteligenciaPreset state
5. THE InteligenciaPreset SHALL NOT modify Aura base tokens for surface, danger, info, success, or warn palettes

### Requirement 5: Sidebar POI Navigation

**User Story:** As a developer, I want the sidebar to include POI navigation items under the Intelligence section, so that users can navigate to the People of Interest module.

#### Acceptance Criteria

1. THE Sidebar_Service SHALL include a POI navigation item with label `'shell.nav.poi'`, icon `'pi pi-users'`, and route `'/poi'` under the `intelligence` section
2. THE Sidebar_Service SHALL preserve all existing navigation items (SNAP Search under intelligence, Audit under administration) without modification
3. WHILE the sidebar is in collapsed mode, THE Sidebar_Service SHALL continue to support pinned, auto, and collapsed modes identically to the current behavior

### Requirement 6: Header Pillar Border and Organizational Context

**User Story:** As a developer, I want the header to display a pillar-colored top border and organizational context when in POI routes, so that users have a clear visual indicator of the active Intelligence pillar.

#### Acceptance Criteria

1. WHILE the active route is under `/poi/`, THE Header_Component SHALL display a 7px `border-top` using the `--snap-pillar-color` CSS variable
2. WHILE the active route is under `/poi/`, THE Header_Component SHALL display the organizational context identifier (SEAP-RJ) in the topbar area
3. WHILE the active route is NOT under `/poi/`, THE Header_Component SHALL NOT display the pillar border or organizational context
4. THE Header_Component SHALL preserve the existing theme toggle, i18n controls, and user menu functionality

### Requirement 7: Breadcrumb POI Labels

**User Story:** As a developer, I want the breadcrumb to resolve POI route segments into human-readable labels, so that users can orient themselves within the POI module hierarchy.

#### Acceptance Criteria

1. WHEN the active route is under `/poi/`, THE Breadcrumb_Service SHALL resolve POI route segments (e.g., `pessoas`, `tela-01`, `cadastro`) into descriptive Portuguese labels
2. WHILE the active route is under `/poi/`, THE Breadcrumb_Service SHALL apply the `.font-accent` CSS class (Cygnito Mono) to the breadcrumb text
3. THE Breadcrumb_Service SHALL continue to resolve existing route segments (`/snap`, `/audit-logs`) with their current labels without modification

### Requirement 8: POI Route Registration

**User Story:** As a developer, I want all 24 POI screens and module placeholders registered under a `/poi/` route prefix, so that they coexist with existing routes and are lazy-loaded within the shell.

#### Acceptance Criteria

1. THE Platform SHALL register a `/poi` child route under the `ShellComponent` in `app.routes.ts` that lazy-loads `poi.routes.ts`
2. THE POI_Routes SHALL define routes for all 24 screens (tela-01 through tela-24) and 5 module placeholders (busca, analise, documentos, monitoramento, configuracoes) under the `/poi/` prefix
3. THE POI_Routes SHALL use `loadComponent` for lazy loading each screen component
4. WHEN navigating to `/poi/`, THE POI_Routes SHALL redirect to `/poi/pessoas/tela-01` as the default entry point
5. THE POI_Routes SHALL define redirect routes for tela-05 through tela-09 pointing to `/poi/pessoas/cadastro`
6. THE Platform SHALL NOT modify existing `/snap` or `/audit-logs` routes
7. WHILE the user is authenticated, THE Platform SHALL protect all `/poi/` routes via the existing `AuthGuard` through the `ShellComponent` parent route

### Requirement 9: POI Screen Components

**User Story:** As a developer, I want all 24 POI screen components ported into `features/poi/pages/`, so that each screen renders correctly within the platform shell.

#### Acceptance Criteria

1. THE POI_Module SHALL contain standalone Angular components for all 24 screens organized in `features/poi/pages/`, one folder per screen
2. THE POI_Module SHALL contain standalone Angular components for all 5 module placeholders (busca, analise, documentos, monitoramento, configuracoes) in `features/poi/pages/`
3. WHEN a POI screen component is rendered, THE POI_Module SHALL display the component within the Shell's `<router-outlet>` preserving the sidebar, header, and breadcrumb
4. THE POI screen components SHALL use `ChangeDetectionStrategy.OnPush`
5. THE POI screen components SHALL adapt all prototype SCSS references from `.snap-dark` / `:host-context(.snap-dark)` to `.p-dark` / `:host-context(.p-dark)`

### Requirement 10: Intelligence UI Components

**User Story:** As a developer, I want reusable Intelligence UI components (SourceBadge, DivergenceIndicator, PartialDataIndicator, EmptyState, LoadingContent) ported into `features/poi/components/`, so that POI screens can compose them for consistent intelligence-domain presentation.

#### Acceptance Criteria

1. THE POI_Module SHALL contain standalone components for SourceBadge, DivergenceIndicator, PartialDataIndicator, EmptyState, and LoadingContent in `features/poi/components/`
2. THE Intelligence_Components SHALL be standalone Angular components with `ChangeDetectionStrategy.OnPush`
3. THE Intelligence_Components SHALL use SNAP_Tokens for all styling (no hardcoded color values)
4. THE Intelligence_Components SHALL have no dependency on Shell services, auth services, or any service outside `features/poi/`
5. WHEN the SourceBadge component receives a `fonte` input of type `TipoFonte`, THE SourceBadge SHALL render the corresponding source label (SIPEN, SNAP, or Manual)
6. WHEN the DivergenceIndicator component receives a `status` input, THE DivergenceIndicator SHALL render the appropriate divergence visual state
7. WHEN the EmptyState component receives `icon`, `title`, and optional `subtitle` and `actions` inputs, THE EmptyState SHALL render a contextual empty state with the provided content

### Requirement 11: POI Data Models

**User Story:** As a developer, I want all POI data models (Pessoa, Alerta, Fonte, Perfil, Tag, Vinculo) defined as TypeScript interfaces in `features/poi/models/`, so that POI screens and services have strongly-typed data contracts.

#### Acceptance Criteria

1. THE POI_Module SHALL define TypeScript interfaces for Pessoa, Alerta, Fonte, Perfil, Tag, and Vinculo in `features/poi/models/`, one file per model
2. THE Pessoa interface SHALL require `id` (string), `nome` (string), `perfis` (array with minimum one entry), and `fontes` (array with minimum one entry)
3. THE Alerta interface SHALL require `id`, `tipo`, `severidade` (union of `'critica' | 'alta' | 'media' | 'baixa'`), `descricao`, `dataGeracao`, `lido`, `pessoaId`, and `fonte`
4. THE Vinculo interface SHALL require `pessoaOrigemId` and `pessoaDestinoId` fields referencing valid Pessoa IDs
5. THE Perfil interface SHALL define `tipo` as a union type of all 8 profile types: `'preso' | 'ex-preso' | 'visitante' | 'familiar' | 'advogado' | 'alvo' | 'pessoa-relacionada' | 'servidor'`

### Requirement 12: Mock Data

**User Story:** As a developer, I want mock data files in `features/poi/data/` providing realistic sample data for all POI screens, so that the prototype can be demonstrated without a backend.

#### Acceptance Criteria

1. THE POI_Module SHALL contain mock data files in `features/poi/data/` for pessoas, alertas, cadastro-integracao, preso-visao, tags, and vinculos
2. WHEN mock data references a `pessoaId` in alertas or vinculos, THE mock data SHALL reference an `id` that exists in the pessoas mock data
3. WHEN mock data defines a Pessoa, THE mock data SHALL include at least one entry in `perfis` and at least one entry in `fontes`

### Requirement 13: MockDataService

**User Story:** As a developer, I want a MockDataService that provides signal-based reactive access to all mock data, so that POI screen components can consume data through Angular signals.

#### Acceptance Criteria

1. THE MockDataService SHALL be an injectable service provided in root, located in `features/poi/services/mock-data.service.ts`
2. THE MockDataService SHALL expose `pessoas`, `alertas`, `vinculos`, and `tags` as read-only `Signal` properties
3. WHEN `getPessoaById` is called with a valid ID, THE MockDataService SHALL return a `Signal` containing the matching Pessoa object
4. WHEN `getPessoaById` is called with an ID that does not exist in mock data, THE MockDataService SHALL return a `Signal` containing `undefined`
5. WHEN `getAlertasByPessoaId` is called with a pessoaId, THE MockDataService SHALL return a `Signal` containing only alertas whose `pessoaId` matches the provided ID
6. WHEN `getVinculosByPessoaId` is called with a pessoaId, THE MockDataService SHALL return a `Signal` containing only vinculos where `pessoaOrigemId` or `pessoaDestinoId` matches the provided ID

### Requirement 14: Shell Backward Compatibility

**User Story:** As a developer, I want all existing shell features to continue working identically after the portability, so that current users experience no regressions.

#### Acceptance Criteria

1. WHEN navigating to `/snap`, THE Platform SHALL render the SNAP Search page identically to the pre-portability state
2. WHEN navigating to `/audit-logs`, THE Platform SHALL render the Audit Logs page identically to the pre-portability state
3. THE Sidebar_Service SHALL continue to support pinned, auto, and collapsed modes with identical behavior for non-POI routes
4. THE Header_Component SHALL continue to provide theme toggle and i18n functionality for all routes
5. THE Platform SHALL continue to protect all shell child routes via the existing AuthGuard

### Requirement 15: Dark Mode Consistency

**User Story:** As a developer, I want dark mode toggling to correctly switch all SNAP tokens and PrimeNG theme tokens simultaneously, so that POI screens render correctly in both light and dark modes.

#### Acceptance Criteria

1. WHEN the ThemeService toggles dark mode, THE Platform SHALL add or remove the `.p-dark` class on the root element
2. WHILE the `.p-dark` class is active, THE SNAP_Tokens SHALL use their dark-mode values as defined under the `.p-dark` selector in `styles.scss`
3. WHILE the `.p-dark` class is active, THE InteligenciaPreset SHALL render with its dark-mode variant via PrimeNG's `darkModeSelector: '.p-dark'` configuration
4. THE Platform SHALL NOT use `.snap-dark` or `.snap-light` selectors anywhere in the ported code

### Requirement 16: PrimeNG Global Overrides

**User Story:** As a developer, I want PrimeNG global style overrides ported from the prototype, so that form inputs, selects, multiselects, and checkboxes use the pillar color for focus and highlight states in POI context.

#### Acceptance Criteria

1. THE Platform SHALL override PrimeNG focus styles for `p-select` and `p-inputtext` to use `--snap-pillar-color` for border and `--snap-focus-ring` for box-shadow
2. THE Platform SHALL override PrimeNG multiselect highlight styles to use `--snap-pillar-color` with 15% opacity for background
3. THE Platform SHALL override PrimeNG checkbox highlight styles to use `--snap-pillar-color` for background and border

### Requirement 17: Lazy Load Error Resilience

**User Story:** As a developer, I want the shell to remain functional when a POI page component fails to lazy-load, so that navigation errors do not break the entire application.

#### Acceptance Criteria

1. IF a POI page component fails to load during lazy loading, THEN THE Shell SHALL remain functional with sidebar, header, and breadcrumb intact
2. IF a POI page component fails to load, THEN THE Platform SHALL rely on Angular's default route error handling to display the error
