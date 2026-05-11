# Implementation Plan: Port Gold-Standards to Platform-Frontend (POI Module)

## Overview

Port all person flow screens, models, mock data, services, shared components, and global PrimeNG style overrides from `gold-standards-prototype/snap-pessoas` into `platform-frontend/src/app/features/poi/`. The port follows a bottom-up approach: models → data → services → shared components → page components → routes → navigation links → global styles → build verification.

Source of truth: `gold-standards-prototype/snap-pessoas/src/app/`
Target: `platform-frontend/src/app/features/poi/`

## Tasks

- [x] 1. Align model interfaces with gold-standards
  - [x] 1.1 Update `IndicadoresAnaliticos`, `Monitoramento`, and `SituacaoPrisional` interfaces in `platform-frontend/src/app/features/poi/models/pessoa.model.ts` to match `gold-standards-prototype/snap-pessoas/src/app/models/pessoa.model.ts` exactly
    - `IndicadoresAnaliticos`: rename `grauPericulosidade` → `periculosidade`, `nivelRisco` to union type `'critico' | 'alto' | 'medio' | 'baixo'`, `pontuacaoRelevancia` → `relevancia` (required), `totalAlertas` → `qtdAlertas` (required), `totalVinculos` → `qtdVinculos` (required), `totalDocumentos` → `qtdDocumentosCitantes` (required)
    - `Monitoramento`: rename `ativo` → `monitorado`, `dataInicio` → `dataInicioMonitoramento`, `responsavel` → `setorResponsavel`, `criticidade` to union type; add `alvo: boolean`; remove `dataFim`, `motivo`
    - `SituacaoPrisional`: make `unidade` and `regime` required, rename `dataIngresso` → `dataUltimaAtualizacao` (required), remove `previsaoSaida`
    - Verify `Pessoa` interface matches gold-standards (import order, field order)
    - Confirm `alerta.model.ts`, `fonte.model.ts`, `perfil.model.ts`, `tag.model.ts`, `vinculo.model.ts` are identical — no changes needed
    - Verify `models/index.ts` barrel exports all updated interfaces including `Monitoramento` and `SituacaoPrisional`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Synchronize mock data files
  - [x] 2.1 Overwrite `pessoas.data.ts` with gold-standards version
    - Copy from `gold-standards-prototype/snap-pessoas/src/app/data/pessoas.data.ts` to `platform-frontend/src/app/features/poi/data/pessoas.data.ts`
    - Adjust import paths to use barrel `'../models'` instead of direct file imports
    - Adjust photo paths from `assets/images/photos/pessoa-XX.png` to `/images/photos/pessoa-XX.png`
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 2.2 Compare and sync remaining data files (`alertas.data.ts`, `cadastro-integracao.data.ts`, `preso-visao.data.ts`, `tags.data.ts`, `vinculos.data.ts`)
    - For each file, compare gold-standards vs platform-frontend; overwrite with gold-standards version if divergent
    - Adjust import paths to use barrel `'../models'`
    - Adjust photo paths to Platform_Frontend convention `/images/photos/`
    - _Requirements: 2.2, 2.4, 2.5_

  - [x] 2.3 Add new `pessoa-snap-visao.data.ts` file
    - Copy from `gold-standards-prototype/snap-pessoas/src/app/data/pessoa-snap-visao.data.ts` to `platform-frontend/src/app/features/poi/data/pessoa-snap-visao.data.ts`
    - Adjust import paths if needed (barrel imports for models)
    - _Requirements: 2.3, 2.4_

- [x] 3. Synchronize services
  - [x] 3.1 Sync `mock-data.service.ts` to gold-standards version
    - Compare and overwrite `platform-frontend/src/app/features/poi/services/mock-data.service.ts` with `gold-standards-prototype/snap-pessoas/src/app/services/mock-data.service.ts`
    - Adjust import paths for models (barrel) and data files
    - _Requirements: 3.1_

  - [x] 3.2 Add new `tarefa-background.service.ts`
    - Copy from `gold-standards-prototype/snap-pessoas/src/app/services/tarefa-background.service.ts` to `platform-frontend/src/app/features/poi/services/tarefa-background.service.ts`
    - Verify it uses Angular signals for reactive state and `inject()` for DI
    - _Requirements: 3.2, 3.3, 12.4_

- [x] 4. Checkpoint — Verify foundation layers compile
  - Ensure all model, data, and service files compile with zero TypeScript errors
  - Ensure all imports resolve correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Synchronize shared components
  - [x] 5.1 Sync all 6 shared components to gold-standards versions
    - For each of `divergence-indicator/`, `empty-state/`, `loading-content/`, `partial-data-indicator/`, `placeholder/`, `source-badge/`: compare `.ts`, `.html`, `.scss` files and overwrite with gold-standards versions
    - Adjust import paths to resolve within platform-frontend structure
    - Preserve `components/index.ts` barrel file and `components/poi-component.types.ts` (these exist only in platform-frontend)
    - Verify all components use `standalone: true` and `ChangeDetectionStrategy.OnPush`
    - _Requirements: 4.1, 4.2, 12.1, 12.2_

- [x] 6. Port Block A page components (Search & Screening)
  - [x] 6.1 Sync tela-01 through tela-04 and cadastro-integracao
    - Overwrite `.ts`, `.html`, `.scss` for: `tela-01-painel-inicial/`, `tela-02-busca-geral/`, `tela-03-resultado-busca/`, `tela-04-filtros-avancados/`, `cadastro-integracao/`
    - Adjust all import paths (models via barrel, data, services, components)
    - Verify `standalone: true` and `ChangeDetectionStrategy.OnPush` on all components
    - _Requirements: 5.1, 5.5, 12.1, 12.2_

- [x] 7. Port Block B page components (Registration & Consolidation)
  - [x] 7.1 Add new pages: tela-05 through tela-09
    - Copy from gold-standards: `tela-05-cadastro-rapido/`, `tela-06-identidade-incompleta/`, `tela-07-integracao-sipen/`, `tela-08-integracao-snap/`, `tela-09-conciliacao/`
    - Place at `platform-frontend/src/app/features/poi/pages/`
    - Adjust all import paths
    - _Requirements: 5.3, 5.5, 12.1, 12.2_

  - [x] 7.2 Sync tela-10 and tela-11
    - Overwrite `.ts`, `.html`, `.scss` for `tela-10-fila-duplicidades/` and `tela-11-comparacao-duplicidade/`
    - Adjust import paths
    - _Requirements: 5.1, 5.5_

- [x] 8. Port Block C page components (Analytical View)
  - [x] 8.1 Replace tela-12: remove `tela-12-visao-geral/` and add `tela-12-visao-pessoa-snap/`
    - Delete the entire `platform-frontend/src/app/features/poi/pages/tela-12-visao-geral/` directory
    - Copy `gold-standards-prototype/snap-pessoas/src/app/pages/tela-12-visao-pessoa-snap/` to `platform-frontend/src/app/features/poi/pages/tela-12-visao-pessoa-snap/`
    - Adjust all import paths (models barrel, data including `pessoa-snap-visao.data`, services including `tarefa-background.service`)
    - _Requirements: 5.2, 5.5, 12.1, 12.2_

  - [x] 8.2 Sync tela-13 through tela-18
    - Overwrite `.ts`, `.html`, `.scss` for: `tela-13-timeline/`, `tela-14-vinculos/`, `tela-15-grafo/`, `tela-16-tags/`, `tela-17-alertas/`, `tela-18-monitoramento/`
    - Adjust import paths
    - _Requirements: 5.1, 5.5_

- [x] 9. Port Block D page components (Profile Views)
  - [x] 9.1 Sync tela-19 through tela-24
    - Overwrite `.ts`, `.html`, `.scss` for: `tela-19-visao-preso/`, `tela-20-visao-ex-preso/`, `tela-21-visao-visitante/`, `tela-22-visao-advogado/`, `tela-23-visao-alvo/`, `tela-24-visao-servidor/`
    - Adjust import paths
    - _Requirements: 5.1, 5.5, 12.1, 12.2_

- [x] 10. Port module placeholder component
  - [x] 10.1 Add generic `modulo-placeholder/` component and remove individual module placeholders
    - Copy `gold-standards-prototype/snap-pessoas/src/app/pages/modulo-placeholder/` to `platform-frontend/src/app/features/poi/pages/modulo-placeholder/`
    - Remove individual placeholder directories: `modulo-analise/`, `modulo-busca/`, `modulo-configuracoes/`, `modulo-documentos/`, `modulo-monitoramento/`
    - _Requirements: 5.3, 5.4_

- [x] 11. Checkpoint — Verify all page components exist
  - Ensure all page directories are in place and files are present
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Restructure routes in `poi.routes.ts`
  - [x] 12.1 Rewrite `poi.routes.ts` with semantic route pattern
    - Replace the entire `platform-frontend/src/app/features/poi/poi.routes.ts` with the new route structure
    - Block A: `pessoas` → Tela01, `pessoas/busca` → Tela02, `pessoas/resultados` → Tela03, `pessoas/filtros` → Tela04
    - Block B: `pessoas/cadastro` → CadastroIntegracao, `pessoas/cadastro-rapido` → Tela05, `pessoas/identidade-incompleta` → Tela06, `pessoas/integracao-sipen` → Tela07, `pessoas/integracao-snap` → Tela08, `pessoas/conciliacao` → Tela09, `pessoas/duplicidades` → Tela10, `pessoas/duplicidades/comparar` → Tela11
    - Block C: `pessoas/:id` → Tela12 (visao-pessoa-snap), `pessoas/:id/timeline` → Tela13, `pessoas/:id/vinculos` → Tela14, `pessoas/:id/grafo` → Tela15, `pessoas/:id/tags` → Tela16, `pessoas/:id/alertas` → Tela17, `pessoas/:id/monitoramento` → Tela18
    - Block D: `pessoas/:id/perfil/preso` → Tela19, `pessoas/:id/perfil/ex-preso` → Tela20, `pessoas/:id/perfil/visitante` → Tela21, `pessoas/:id/perfil/advogado` → Tela22, `pessoas/:id/perfil/alvo` → Tela23, `pessoas/:id/perfil/servidor` → Tela24
    - Module placeholder: `modulo/:nome` → ModuloPlaceholderComponent
    - Update tela-12 import path from `tela-12-visao-geral` to `tela-12-visao-pessoa-snap`
    - All routes must use `loadComponent` for lazy loading
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7, 12.3_

  - [x] 12.2 Add legacy redirect routes for backward compatibility
    - Add redirect entries for all old `tela-XX` paths to their new semantic equivalents
    - `pessoas/tela-01` → `pessoas`, `pessoas/tela-02` → `pessoas/busca`, `pessoas/tela-03` → `pessoas/resultados`, `pessoas/tela-04` → `pessoas/filtros`
    - `pessoas/tela-05` → `pessoas/cadastro-rapido`, `pessoas/tela-06` → `pessoas/identidade-incompleta`, `pessoas/tela-07` → `pessoas/integracao-sipen`, `pessoas/tela-08` → `pessoas/integracao-snap`, `pessoas/tela-09` → `pessoas/conciliacao`
    - `pessoas/tela-10` → `pessoas/duplicidades`, `pessoas/tela-11` → `pessoas/duplicidades/comparar`, `pessoas/tela-12` → `pessoas/:id` (use a default ID), `pessoas/tela-13` through `pessoas/tela-24` → corresponding semantic paths
    - _Requirements: 6.6_

- [x] 13. Update internal navigation links in all ported components
  - [x] 13.1 Update navigation links in Block A and Block B components
    - Find and replace all `router.navigate()` calls and `routerLink` directives in tela-01 through tela-11 and cadastro-integracao
    - Replace gold-standards paths (e.g., `/pessoas/tela-02`) with platform-frontend paths (e.g., `/poi/pessoas/busca`)
    - Prefix module paths with `/poi/` (e.g., `/modulo/busca` → `/poi/modulo/busca`)
    - _Requirements: 7.1, 7.3_

  - [x] 13.2 Update navigation links in Block C components
    - Update all navigation in tela-12 through tela-18
    - Replace `/pessoas/tela-XX` with `/poi/pessoas/:id/...` using dynamic person ID from route parameter
    - Update `voltar()` in tela-12 to navigate to `/poi/pessoas` instead of `/pessoas/tela-01`
    - _Requirements: 7.1, 7.2, 7.4_

  - [x] 13.3 Update navigation links in Block D components
    - Update all navigation in tela-19 through tela-24
    - Use dynamic person ID from route parameter for person-specific routes
    - _Requirements: 7.1, 7.2_

- [x] 14. Integrate route parameter reading in Block C and Block D components
  - [x] 14.1 Add `:id` route parameter reading to Block C components (tela-12 through tela-18)
    - Each component must read `:id` from `ActivatedRoute`
    - Use `MockDataService` to look up the person by ID
    - Handle missing person gracefully (no render errors)
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 14.2 Add `:id` route parameter reading to Block D components (tela-19 through tela-24)
    - Each component must read `:id` from `ActivatedRoute`
    - Use `MockDataService` to look up the person by ID
    - Handle missing person gracefully
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 15. Checkpoint — Verify routes and navigation compile
  - Ensure `poi.routes.ts` compiles with zero errors
  - Ensure all component import paths in routes resolve correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Add global PrimeNG style overrides to `styles.scss`
  - [x] 16.1 Add missing PrimeNG overrides and profile color tokens
    - Add to `platform-frontend/src/styles.scss` (append only, do not modify existing rules):
    - Focus overrides for `p-select` and `p-inputtext` using `--snap-pillar-color` and `--snap-focus-ring`
    - Select sizing override for `.select-listar .p-select`
    - Multiselect highlight override (Aura green → pillar color)
    - Dialog consulta overrides (header separator, semi-transparent background, blur backdrop)
    - `p-tag` label font-weight override (`font-weight: 400`)
    - `p-card` border override for `.coluna-direita`
    - `p-avatar img` override (`object-fit: cover; object-position: center top`)
    - Profile color tokens in `:root` scope: `--snap-perfil-alvo`, `--snap-perfil-visitante`, `--snap-perfil-familiar`, `--snap-perfil-pessoa-relacionada`, `--snap-perfil-advogado`, `--snap-perfil-servidor`
    - Do NOT duplicate existing SNAP design tokens, dark mode tokens, `@font-face` declarations, or any rules already present
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

- [x] 17. Final checkpoint — Build verification
  - Run `pnpm build` in `platform-frontend/` and verify zero TypeScript errors
  - Verify all import statements resolve to existing files
  - Verify zero type errors from mock data against updated model interfaces
  - Ensure no files outside `features/poi/` and `styles.scss` were modified (shell, auth, other features untouched)
  - Ensure all tests pass, ask the user if questions arise.
  - _Requirements: 10.1, 10.2, 10.3, 11.1, 11.2, 11.3, 11.4, 11.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP — none in this plan since all tasks are core porting work
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- The gold-standards project is the source of truth for all file contents
- All ported components must use `standalone: true`, `ChangeDetectionStrategy.OnPush`, and `loadComponent` lazy loading (Requirements 12.1, 12.2, 12.3)
- New services must use `inject()` and `signal()` (Requirement 12.4)
- No new npm dependencies should be introduced (Requirement 11.4)
