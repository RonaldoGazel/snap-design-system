# Implementation Plan: CSS SMACSS Migration

## Overview

Migrate ~3,800 lines of CSS/SCSS across 18 files to DS-002 SMACSS compliance. Eight sequential phases, each leaving the project buildable with zero visual changes. All class renames follow the naming map in the design document. Angular ViewEncapsulation requires SCSS + HTML + TS to be updated together for every rename.

## Tasks

- [ ] 1. Phase 1 — Token Infrastructure
  - [x] 1.1 Create token directory and color tokens file
    - Create `src/styles/tokens/` directory
    - Create `src/styles/tokens/_colors.scss` — move all `--snap-*` custom properties from the `:root` and `.p-dark` blocks in `styles.scss` into this file
    - Preserve both `:root` and `.p-dark` scopes exactly as they are
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Create typography tokens file
    - Create `src/styles/tokens/_typography.scss`
    - Define `:root` block with tokens: `--text-2xs: 0.5rem`, `--text-xs: 0.625rem`, `--text-sm: 0.6875rem`, `--text-base: 0.75rem`, `--text-md: 0.8125rem`, `--text-lg: 0.875rem`, `--text-xl: 1rem`, `--text-2xl: 1.125rem`, `--text-3xl: 1.25rem`, `--text-4xl: 1.5rem`, `--text-5xl: 1.875rem`
    - _Requirements: 1.1, 1.3_

  - [x] 1.3 Create spacing tokens file
    - Create `src/styles/tokens/_spacing.scss`
    - Define `:root` block with tokens: `--space-0: 0`, `--space-px: 1px`, `--space-0-5: 0.0625rem`, `--space-1: 0.125rem`, `--space-1-5: 0.25rem`, `--space-2: 0.375rem`, `--space-2-5: 0.5rem`, `--space-3: 0.625rem`, `--space-3-5: 0.75rem`, `--space-4: 0.875rem`, `--space-5: 1rem`, `--space-6: 1.25rem`, `--space-7: 1.5rem`, `--space-8: 2rem`, `--space-9: 2.5rem`, `--space-10: 3.5rem`
    - _Requirements: 1.1, 1.4_

  - [x] 1.4 Create radius tokens file
    - Create `src/styles/tokens/_radius.scss`
    - Define `:root` block with tokens: `--radius-xs: 3px`, `--radius-sm: 4px`, `--radius-md: 6px`, `--radius-lg: 8px`, `--radius-xl: 12px`, `--radius-full: 9999px`
    - _Requirements: 1.1, 1.5_

  - [x] 1.5 Create shadow tokens file
    - Create `src/styles/tokens/_shadows.scss`
    - Define `:root` block with light mode shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
    - Define `.p-dark` block with dark mode shadow variants
    - Values as specified in the design Token Value Map
    - _Requirements: 1.1, 1.6_

  - [x] 1.6 Create barrel file and update styles.scss imports
    - Create `src/styles/tokens/_index.scss` with `@forward` for all five token files
    - Update `styles.scss` to `@use 'tokens/index'` instead of containing inline `:root`/`.p-dark` token definitions
    - Remove the extracted `:root` and `.p-dark` token blocks from `styles.scss`
    - _Requirements: 1.7, 1.8_

  - [x] 1.7 Checkpoint — Verify token infrastructure
    - Run `ng build` and confirm zero errors
    - Visually verify dashboard, profile, and cadastro pages render identically in light and dark mode
    - _Requirements: 1.9, 9.1, 9.2_

- [ ] 2. Phase 2 — Base Rules Extraction
  - [x] 2.1 Extract base rules into _base.scss
    - Create `src/styles/_base.scss`
    - Move all element-only selectors from `styles.scss`: `body`, `h1`–`h6`, `a`, `input`, `button` defaults
    - Ensure `_base.scss` contains ONLY element selectors — no class (`.`) or ID (`#`) selectors
    - Replace any hardcoded typography, spacing, and color values with token references (`--text-*`, `--space-*`, `--snap-*`)
    - Update `styles.scss` to import `_base.scss`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Checkpoint — Verify base rules extraction
    - Run `ng build` and confirm zero errors
    - Verify no class or ID selectors leaked into `_base.scss`
    - Visually verify pages render identically
    - _Requirements: 2.4, 9.1, 9.2_

- [ ] 3. Phase 3 — Layout Class Renaming
  - [x] 3.1 Rename layout classes in shell.scss
    - Rename `.shell-layout` → `.l-shell`, `.shell__main` → `.l-shell__main`, `.shell__content` → `.l-shell__content`
    - Update the corresponding shell HTML template with the new class names
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Rename layout classes in dashboard.component.scss
    - Rename `.conteudo-principal` → `.l-dashboard`, `.coluna-esquerda` → `.l-dashboard__main`, `.coluna-direita` → `.l-dashboard__aside`, `.coluna-monitorados` → `.l-dashboard__monitored`, `.grade-monitorados` → `.l-card-grid`
    - Update `dashboard.component.html` with the new class names
    - _Requirements: 3.1, 3.2_

  - [x] 3.3 Rename layout classes in profile.component.scss
    - Rename `.coluna-identidade` → `.l-profile__sidebar`, `.coluna-central` → `.l-profile__main`, `.coluna-direita` → `.l-profile__aside`
    - Add `.l-profile` semantics to `:host` grid layout
    - Update `profile.component.html` with the new class names
    - _Requirements: 3.1, 3.2_

  - [x] 3.4 Rename layout classes in cadastro-integracao.component.scss
    - Rename `.stepper-body` → `.l-wizard`, `.step-content` → `.l-wizard__main`, `.step-sidebar` → `.l-wizard__aside`
    - Update `cadastro-integracao.component.html` with the new class names
    - _Requirements: 3.1, 3.2_

  - [x] 3.5 Rename layout classes in styles.scss (global)
    - Rename `.page-container` → `.l-page`, `.page-header` → `.l-page__header`, `.form-grid` → `.l-form-grid`, `.form-row` → `.l-form-row`
    - Search ALL HTML templates across all components for references to these global classes and update each reference
    - _Requirements: 3.1, 3.2, 8.4_

  - [x] 3.6 Checkpoint — Verify layout renaming
    - Run `ng build` and confirm zero errors
    - Verify every layout class starts with `l-` using grep: `grep -rn "\.l-" --include="*.scss" src/`
    - Verify no old layout class names remain: `grep -rn "conteudo-principal\|coluna-esquerda\|coluna-direita\|grade-monitorados\|shell-layout\|stepper-body\|step-content\|step-sidebar\|page-container\|form-grid\|form-row" --include="*.scss" --include="*.html" src/`
    - _Requirements: 3.3, 3.4, 9.1, 9.2_

- [ ] 4. Phase 4 — Module Class Renaming (BEM) — Dashboard Component
  - [x] 4.1 Rename Feed Tabs module classes in dashboard
    - In `dashboard.component.scss` and `dashboard.component.html`:
    - `.busca-tabs-row` → `.feed-tabs`, `.busca-tabs-scroll` → `.feed-tabs__scroll`, `.busca-tab` → `.feed-tab`, `.busca-tab-badge-wrapper` → `.feed-tab__badge-wrapper`, `.busca-tab-fechar` → `.feed-tab__close`, `.resultados-label` → `.results-label`
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.2 Rename Section Heading module classes in dashboard
    - `.titulo-secao` → `.section-heading`, `.titulo-acoes` → `.section-heading__actions`, `.secao-nome` → `.section-heading__name`, `.secao-icone` → `.section-heading__icon`, `.secao-titulo-row` → `.section-heading__row`, `.secao-titulo` → `.section-heading__title`, `.secao-titulo-icone` → `.section-heading__title-icon`, `.titulo-badge` → `.count-badge`, `.titulo-badge--neutro` → `.count-badge--neutral`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.3 Rename New Person Popover module classes in dashboard
    - `.nova-pessoa-menu` → `.new-person-menu`, `.nova-pessoa-opcao` → `.new-person-menu__option`, `.nova-pessoa-opcao--last` → `.new-person-menu__option--last`, `.nova-pessoa-opcao-texto` → `.new-person-menu__text`, `.nova-pessoa-opcao-titulo` → `.new-person-menu__title`, `.nova-pessoa-opcao-subtitulo` → `.new-person-menu__subtitle`, `.cta-nova-pessoa` → `.new-person-cta`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.4 Rename Search Hero module classes in dashboard
    - `.hero-busca` → `.search-hero`, `.hero-titulo` → `.search-hero__title`, `.titulo-destaque` → `.search-hero__highlight`, `.hero-subtitulo` → `.search-hero__subtitle`, `.busca-hero-row` → `.search-hero__row`, `.busca-pill` → `.search-pill`, `.busca-input-pill` → `.search-pill__input`, `.busca-icon-btn` → `.search-pill__icon-btn`, `.filtros-icon-btn` → `.filter-btn`, `.filtros-badge` → `.filter-btn__badge`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.5 Rename Advanced Filters module classes in dashboard
    - `.filtros-avancados-painel` → `.advanced-filters`, `.filtros-avancados-header` → `.advanced-filters__header`, `.filtros-avancados-titulo` → `.advanced-filters__title`, `.filtros-recolher-btn` → `.advanced-filters__collapse-btn`, `.filtros-avancados-separador` → `.advanced-filters__separator`, `.filtros-avancados-body` → `.advanced-filters__body`, `.filtros-avancados-campo` → `.advanced-filters__field`, `.filtros-avancados-acoes` → `.advanced-filters__actions`, `.filtros-aplicar-btn` → `.advanced-filters__apply-btn`, `.limpar-link` → `.advanced-filters__clear-link`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.6 Rename Base Distribution module classes in dashboard
    - `.distribuicao-base` → `.base-distribution`, `.distribuicao-total` → `.base-distribution__total`, `.total-valor` → `.base-distribution__value`, `.total-icone` → `.base-distribution__icon`, `.total-label` → `.base-distribution__label`, `.barra-segmentada` → `.segmented-bar`, `.barra-segmento` → `.segmented-bar__segment`, `.distribuicao-legenda` → `.base-distribution__legend`, `.legenda-item` → `.legend-item`, `.legenda-dot` → `.legend-item__dot`, `.legenda-texto` → `.legend-item__text`, `.legenda-rotulo` → `.legend-item__label`, `.legenda-valor` → `.legend-item__value`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.7 Rename Toolbar module classes in dashboard
    - `.toolbar-ordenacao` → `.sort-toolbar`, `.toolbar-sort-sep` → `.sort-toolbar__separator`, `.toolbar-sort-btn` → `.sort-toolbar__btn`, `.toolbar-direita` → `.sort-toolbar__right`, `.toolbar-label` → `.sort-toolbar__label`, `.toolbar-separator` → `.sort-toolbar__divider`
    - Note: `.toolbar-sort-btn--ativo` → `.sort-toolbar__btn.is-active` is handled in Phase 5 (State)
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.8 Rename Pagination module classes in dashboard
    - `.paginacao-inline` → `.pagination`, `.pag-btn` → `.pagination__btn`, `.paginacao-bottom` → `.pagination--bottom`, `.pag-btn-label` → `.pagination__btn-label`, `.paginacao-numeros` → `.pagination__numbers`, `.pag-num` → `.pagination__num`, `.pag-elipse` → `.pagination__ellipsis`
    - Note: `.pag-num--ativo` → `.pagination__num.is-active` is handled in Phase 5 (State)
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.9 Rename Person Card module classes in dashboard
    - `.monitorado-card` → `.person-card`, `.monitorado-topo` → `.person-card__top`, `.monitorado-foto-wrapper` → `.person-card__photo-wrapper`, `.monitorado-foto` → `.person-card__photo`, `.monitorado-foto-placeholder` → `.person-card__photo-placeholder`, `.monitorado-identidade` → `.person-card__identity`, `.monitorado-nome` → `.person-card__name`, `.monitorado-vulgo` → `.person-card__alias`, `.card-alerta-badge` → `.person-card__alert-badge`, `.card-divider` → `.person-card__divider`, `.monitorado-detalhes` → `.person-card__details`, `.indicador-perfil` → `.person-card__profile-indicator`, `.faccao-badge` → `.person-card__faction-badge`
    - Also rename Risk Indicator: `.monitorado-risco` → `.risk-indicator`, `.risco-dot` → `.risk-indicator__dot`, `.risco-critico` → `.risk-indicator__dot--critical`, `.risco-alto` → `.risk-indicator__dot--high`, `.risco-medio` → `.risk-indicator__dot--medium`, `.risco-baixo` → `.risk-indicator__dot--low`, `.risco-texto` → `.risk-indicator__text`
    - Also rename Tags/Alert area: `.monitorado-tags` → `.person-card__tags`, `.monitorado-alerta-area` → `.person-card__alert-area`
    - Update SCSS + HTML. Check TS for any class references to `monitorado-*`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 4.10 Rename Alert Area module classes in dashboard
    - `.alerta-icone` → `.alert-area__icon`, `.alerta-conteudo` → `.alert-area__content`, `.alerta-vazio` → `.alert-area__empty`, `.alerta-data-inline` → `.alert-area__date`, `.alerta-texto-inline` → `.alert-area__text`, `.alerta-acao-btn` → `.alert-area__action-btn`, `.alerta-nav` → `.alert-area__nav`, `.alerta-nav-btn` → `.alert-area__nav-btn`, `.alerta-pulse` → `.alert-area__pulse`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.11 Rename Alert List (sidebar panel) module classes in dashboard
    - `.painel-header` → `.panel-header`, `.painel-titulo` → `.panel-header__title`, `.painel-titulo-icone` → `.panel-header__icon`, `.painel-icone` → `.panel-header__action-icon`
    - `.alertas-lista` → `.alert-list`, `.alerta-item` → `.alert-item`, `.alerta-foto-wrapper` → `.alert-item__photo-wrapper`, `.alerta-foto` → `.alert-item__photo`, `.alerta-foto-placeholder` → `.alert-item__photo-placeholder`, `.alerta-corpo` → `.alert-item__body`, `.alerta-nome` → `.alert-item__name`, `.alerta-tipo` → `.alert-item__type`, `.alerta-meta` → `.alert-item__meta`, `.alerta-data` → `.alert-item__date`, `.alerta-acao` → `.alert-item__action`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.12 Rename Pending Items module classes in dashboard
    - `.categorias-filtro` → `.category-filter`, `.categoria-tag` → `.category-filter__tag`, `.pendencia-row` → `.pending-item`, `.pendencia-data` → `.pending-item__date`, `.pendencia-pessoa` → `.pending-item__person`, `.pendencia-nome` → `.pending-item__name`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.13 Rename Query Dialog module classes in dashboard
    - `.dialog-header-custom` → `.query-dialog__header`, `.dialog-header-icone` → `.query-dialog__header-icon`, `.dialog-header-titulo` → `.query-dialog__header-title`, `.dialog-consulta-form` → `.query-dialog__form`, `.dialog-campo` → `.query-dialog__field`, `.dialog-label` → `.query-dialog__label`, `.obrigatorio` → `.query-dialog__required`, `.dialog-label-hint` → `.query-dialog__label-hint`, `.dialog-input` → `.query-dialog__input`
    - `.dialog-rg-cpf-row` → `.query-dialog__id-row`, `.dialog-campo-inner` → `.query-dialog__field-inner`, `.dialog-nome-uf-row` → `.query-dialog__name-state-row`, `.dialog-campo-uf` → `.query-dialog__state-field`, `.dialog-campo-nome` → `.query-dialog__name-field`, `.dialog-select-uf` → `.query-dialog__state-select`
    - `.dialog-ou-separador` → `.query-dialog__or-separator`, `.dialog-ou-linha` → `.query-dialog__or-line`, `.dialog-ou-texto` → `.query-dialog__or-text`, `.dialog-hint` → `.query-dialog__hint`, `.dialog-btn-cancelar` → `.query-dialog__cancel-btn`, `.dialog-btn-consultar` → `.query-dialog__submit-btn`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.14 Rename Search Status module classes in dashboard
    - `.busca-status` → `.search-status`, `.busca-comunicacao` → `.search-status__communication`, `.busca-com-icone` → `.search-status__comm-icon`, `.busca-linha-animada` → `.search-status__animated-line`, `.busca-status-titulo` → `.search-status__title`, `.busca-separador` → `.search-status__separator`, `.busca-status-aviso` → `.search-status__notice`, `.busca-status-aviso-destaque` → `.search-status__notice-highlight`, `.busca-contador` → `.search-status__counter`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.15 Rename Background Task Icon module classes in dashboard
    - `.tarefa-background-icone` → `.bg-task-fab`, `.tarefa-spin` → `.bg-task-fab__spinner`, `.tarefa-tooltip` → `.bg-task-tooltip`, `.tarefa-tooltip-titulo` → `.bg-task-tooltip__title`, `.tarefa-tooltip-desc` → `.bg-task-tooltip__description`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 4.16 Checkpoint — Verify dashboard module renaming
    - Run `ng build` and confirm zero errors
    - Verify no old Portuguese class names remain in dashboard files: `grep -rn "monitorado-\|busca-tab\|alerta-\|filtros-\|titulo-secao\|nova-pessoa\|paginacao\|pendencia\|tarefa-\|toolbar-ordenacao" --include="*.scss" --include="*.html" src/app/**/dashboard*`
    - Verify all module classes match BEM pattern
    - _Requirements: 4.5, 9.1, 9.2_

- [ ] 5. Phase 4 (cont.) — Module Class Renaming (BEM) — Profile Component
  - [x] 5.1 Rename Page Header module classes in profile
    - In `profile.component.scss` and `profile.component.html`:
    - `.cabecalho` → `.page-header`, `.cab-esquerda` → `.page-header__left`, `.cab-voltar` → `.page-header__back-btn`, `.cab-titulos` → `.page-header__titles`, `.cab-titulo` → `.page-header__title`, `.cab-breadcrumb` → `.page-header__breadcrumb`, `.cab-acoes` → `.page-header__actions`, `.btn-acoes` → `.page-header__action-btn`
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.2 Rename Identity Card module classes in profile
    - `.cartao-identidade` → `.identity-card`, `.cartao-foto` → `.identity-card__photo`, `.cartao-foto-placeholder` → `.identity-card__photo-placeholder`, `.cartao-foto-inicial` → `.identity-card__photo-initial`, `.cartao-nome` → `.identity-card__name`, `.cartao-vulgo` → `.identity-card__alias`, `.cartao-dados` → `.identity-card__data`, `.cartao-campo` → `.identity-card__field`, `.cartao-label` → `.identity-card__label`, `.cartao-valor` → `.identity-card__value`
    - `.cartao-artigo` → `.identity-card__article`, `.cartao-tags` → `.identity-card__tags`, `.cartao-fonte-badge` → `.identity-card__source-badge`, `.cartao-divider` → `.identity-card__divider`, `.cartao-status` → `.identity-card__status`, `.cartao-risco` → `.identity-card__risk`, `.cartao-crime` → `.identity-card__crime`, `.cartao-dados-compactos` → `.identity-card__compact-data`, `.cartao-monitoramento` → `.identity-card__monitoring`, `.cartao-botoes` → `.identity-card__buttons`, `.cartao-alerta` → `.identity-card__alert`
    - `.btn-monitorar` → `.identity-card__monitor-btn`, `.btn-acao` → `.identity-card__action-btn`, `.status-label` → `.identity-card__status-label`, `.status-seg` → `.identity-card__status-detail`
    - Update SCSS + HTML. Check TS for class references
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.3 Rename Content Card and Field Grid module classes in profile
    - `.conteudo-card` → `.content-card`, `.conteudo-card-titulo` → `.content-card__title`, `.campo-grid` → `.field-grid`, `.campo` → `.field-grid__item`, `.campo-label` → `.field-grid__label`, `.campo-valor` → `.field-grid__value`, `.campo-data` → `.field-grid__date`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.4 Rename Sub-sections and Inline Items module classes in profile
    - `.sub-secao` → `.sub-section`, `.sub-titulo` → `.sub-section__title`, `.item-inline` → `.inline-item`, `.item-tipo` → `.inline-item__type`, `.item-compacto` → `.compact-item`, `.item-titulo` → `.compact-item__title`, `.item-desc` → `.compact-item__description`, `.item-data` → `.compact-item__date`, `.item-meta` → `.compact-item__meta`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.5 Rename Timeline module classes in profile
    - `.timeline-container` → `.timeline`, `.timeline-evento` → `.timeline__event`, `.timeline-icone` → `.timeline__icon`, `.timeline-conteudo` → `.timeline__content`, `.timeline-titulo` → `.timeline__title`, `.timeline-desc` → `.timeline__description`, `.timeline-data` → `.timeline__date`, `.timeline-pag` → `.timeline__pagination`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.6 Rename Quick Panel module classes in profile
    - `.painel-bloco` → `.quick-panel`, `.painel-bloco-titulo` → `.quick-panel__title`, `.painel-bloco-icone` → `.quick-panel__icon`, `.painel-item` → `.quick-panel__item`, `.painel-item-info` → `.quick-panel__item-info`, `.painel-item-nome` → `.quick-panel__item-name`, `.painel-item-detalhe` → `.quick-panel__item-detail`, `.painel-link` → `.quick-panel__link`, `.painel-alerta` → `.quick-panel__alert`, `.painel-alerta-texto` → `.quick-panel__alert-text`, `.painel-monitoramento` → `.quick-panel__monitoring`, `.painel-links` → `.quick-panel__links`, `.btn-grafo` → `.quick-panel__graph-btn`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.7 Rename Visitors module classes in profile
    - `.visitante-item` → `.visitor-item`, `.visitante-foto` → `.visitor-item__photo`, `.visitante-placeholder` → `.visitor-item__placeholder`, `.visitante-info` → `.visitor-item__info`, `.visitante-nome` → `.visitor-item__name`, `.visitante-qual` → `.visitor-item__relationship`, `.visitante-carteira` → `.visitor-item__card-id`, `.visitante-badges` → `.visitor-item__badges`, `.visitante-analise` → `.visitor-item__analysis`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.8 Rename Lawyers module classes in profile
    - `.advogado-item` → `.lawyer-item`, `.advogado-info` → `.lawyer-item__info`, `.advogado-nome` → `.lawyer-item__name`, `.advogado-oab` → `.lawyer-item__bar-id`, `.advogado-clientes` → `.lawyer-item__clients`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.9 Rename Photos and Marks module classes in profile
    - Photos: `.fotos-grid` → `.photo-grid`, `.foto-item` → `.photo-grid__item`, `.foto-tipo` → `.photo-grid__type`, `.foto-data` → `.photo-grid__date`
    - Marks/Tattoos: `.marca-card` → `.mark-card`, `.marca-foto` → `.mark-card__photo`, `.marca-info` → `.mark-card__info`, `.marca-titulo` → `.mark-card__title`, `.marca-desc` → `.mark-card__description`, `.marca-local` → `.mark-card__location`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.10 Rename Location History module classes in profile
    - `.localizacao-item` → `.location-item`, `.loc-periodo` → `.location-item__period`, `.loc-data` → `.location-item__date`, `.loc-sep` → `.location-item__separator`, `.loc-unidade` → `.location-item__unit`, `.loc-detalhe` → `.location-item__detail`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.11 Rename Legal Process and Sentences module classes in profile
    - `.processo-card` → `.legal-process`, `.sentenca-item` → `.sentence-item`, `.sentenca-crime` → `.sentence-item__crime`, `.sentenca-pena` → `.sentence-item__penalty`, `.sentenca-data` → `.sentence-item__date`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.12 Rename Benefits and Companies module classes in profile
    - Benefits: `.beneficio-grid` → `.benefit-grid`, `.beneficio-item` → `.benefit-grid__item`, `.beneficio-label` → `.benefit-grid__label`, `.beneficio-data` → `.benefit-grid__date`
    - Companies: `.empresa-card` → `.company-card`, `.empresa-nome` → `.company-card__name`, `.empresa-cnpj` → `.company-card__tax-id`, `.empresa-meta` → `.company-card__meta`, `.socio-item` → `.partner-item`, `.socio-qual` → `.partner-item__role`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.13 Rename Empty States module classes in profile
    - `.estado-vazio-tab` → `.empty-state`, `.estado-vazio-inline` → `.empty-state--inline`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 5.14 Checkpoint — Verify profile module renaming
    - Run `ng build` and confirm zero errors
    - Verify no old Portuguese class names remain in profile files: `grep -rn "cartao-\|cabecalho\|cab-\|conteudo-card\|campo-grid\|painel-bloco\|visitante-\|advogado-\|fotos-\|marca-\|localizacao-\|processo-\|beneficio-\|empresa-\|estado-vazio" --include="*.scss" --include="*.html" src/app/**/profile*`
    - _Requirements: 4.5, 9.1, 9.2_

- [ ] 6. Phase 4 (cont.) — Module Class Renaming (BEM) — Cadastro-Integração Component
  - [x] 6.1 Rename Wizard Header module classes in cadastro-integracao
    - In `cadastro-integracao.component.scss` and `cadastro-integracao.component.html`:
    - `.stepper-header` → `.page-header` (reuse from profile), `.cab-esquerda` → `.page-header__left`, `.cab-voltar` → `.page-header__back-btn`, `.cab-titulos` → `.page-header__titles`, `.cab-titulo` → `.page-header__title`, `.cab-breadcrumb` → `.page-header__breadcrumb`
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.2 Rename Step Content module classes in cadastro-integracao
    - `.step-section` → `.step-section` (already English, keep), `.step-skeleton` → `.step-skeleton` (keep), `.step-footer` → `.step-footer` (keep), `.btn-avancar` → `.step-footer__next-btn`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.3 Rename Wizard Sidebar module classes in cadastro-integracao
    - `.sidebar-card` → `.wizard-sidebar`, `.sidebar-titulo` → `.wizard-sidebar__title`, `.sidebar-campo` → `.wizard-sidebar__field`, `.sidebar-label` → `.wizard-sidebar__label`, `.sidebar-valor` → `.wizard-sidebar__value`, `.sidebar-divider` → `.wizard-sidebar__divider`, `.sidebar-secao-titulo` → `.wizard-sidebar__section-title`, `.sidebar-fonte` → `.wizard-sidebar__source`, `.fonte-ok` → `.wizard-sidebar__source--ok`, `.fonte-pend` → `.wizard-sidebar__source--pending`, `.sidebar-status` → `.wizard-sidebar__status`, `.sidebar-alerta` → `.wizard-sidebar__alert`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.4 Rename Form Card module classes in cadastro-integracao
    - `.form-card` → `.form-card` (already English, keep), `.form-campo` → `.form-card__field`, `.form-label` → `.form-card__label`, `.form-row-2` → `.form-card__row`, `.form-secao-titulo` → `.form-card__section-title`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.5 Rename Validation Card module classes in cadastro-integracao
    - `.validacao-card` → `.validation-card`, `.validacao-titulo` → `.validation-card__title`, `.validacao-item` → `.validation-card__item`, `.validacao-item.info` → `.validation-card__item--info`, `.validacao-item.warn` → `.validation-card__item--warn`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.6 Rename Hypothesis Card module classes in cadastro-integracao
    - `.hipoteses-card` → `.hypothesis-card`, `.hipoteses-titulo` → `.hypothesis-card__title`, `.hipotese-item` → `.hypothesis-card__item`, `.hipotese-info` → `.hypothesis-card__item-info`, `.hipotese-nome` → `.hypothesis-card__name`, `.hipotese-vulgo` → `.hypothesis-card__alias`, `.hipotese-score` → `.hypothesis-card__score`, `.score-alto` → `.hypothesis-card__score--high`, `.score-medio` → `.hypothesis-card__score--medium`, `.score-baixo` → `.hypothesis-card__score--low`, `.hipoteses-hint` → `.hypothesis-card__hint`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.7 Rename SIPEN Result and Criteria Card module classes in cadastro-integracao
    - `.criterios-card` → `.criteria-card`, `.criterios-titulo` → `.criteria-card__title`, `.badge-criterio` → `.criteria-card__badge`
    - `.sipen-resultado-card` → `.sipen-result`, `.fonte-primaria-badge` → `.sipen-result__primary-badge`, `.sipen-resultado-inner` → `.sipen-result__grid`, `.sipen-foto-col` → `.sipen-result__photo-col`, `.sipen-foto` → `.sipen-result__photo`, `.sipen-nome` → `.sipen-result__name`, `.sipen-vulgo` → `.sipen-result__alias`, `.sipen-dados-col` → `.sipen-result__data-col`, `.sipen-operacional-col` → `.sipen-result__ops-col`, `.sipen-resumo` → `.sipen-result__summary`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.8 Rename Decision Grid module classes in cadastro-integracao
    - `.decisao-grid` → `.decision-grid`, `.decisao-card` → `.decision-card`, `.decisao-icone` → `.decision-card__icon`, `.decisao-icone-ok` → `.decision-card__icon--ok`, `.decisao-icone-warn` → `.decision-card__icon--warn`, `.decisao-titulo` → `.decision-card__title`, `.decisao-desc` → `.decision-card__description`, `.decisao-recomendado` → `.decision-card__recommended`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.9 Rename Conciliation Table module classes in cadastro-integracao
    - `.conciliacao-header` → `.conciliation__header`, `.conciliacao-titulo` → `.conciliation__title`, `.conciliacao-subtitulo` → `.conciliation__subtitle`, `.conciliacao-legenda` → `.conciliation__legend`, `.conciliacao-table` → `.conciliation__table`, `.row-divergente` → `.conciliation__row--divergent`, `.campo-nome` → `.conciliation__field-name`, `.divergencia-icon` → `.conciliation__divergence-icon`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.10 Rename Deduplication module classes in cadastro-integracao
    - `.dedup-item` → `.dedup-item` (already English, keep), `.dedup-score` → `.dedup-item__score`, `.dedup-nomes` → `.dedup-item__names`, `.dedup-nome-a` → `.dedup-item__name-a`, `.dedup-nome-b` → `.dedup-item__name-b`, `.dedup-vs` → `.dedup-item__vs`, `.dedup-motivo` → `.dedup-item__reason`, `.dedup-perfis` → `.dedup-item__profiles`, `.dedup-acoes` → `.dedup-item__actions`, `.btn-comparar` → `.dedup-item__compare-btn`, `.btn-adiar` → `.dedup-item__defer-btn`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.11 Rename Comparison View module classes in cadastro-integracao
    - `.comparacao-header` → `.comparison__header`, `.comparacao-score` → `.comparison__score`, `.comparacao-grid` → `.comparison__grid`
    - `.registro-card` → `.record-card`, `.registro-topo` → `.record-card__top`, `.registro-foto` → `.record-card__photo`, `.registro-foto-placeholder` → `.record-card__photo-placeholder`, `.registro-nome` → `.record-card__name`, `.registro-id` → `.record-card__id`, `.registro-fontes` → `.record-card__sources`, `.registro-secao-titulo` → `.record-card__section-title`
    - `.campo-comp` → `.field-comparison`, `.campo-comp-nome` → `.field-comparison__name`, `.campo-comp-val` → `.field-comparison__value`, `.campo-comp.match` → `.field-comparison--match`, `.campo-comp.divergente` → `.field-comparison--divergent`, `.campo-comp.exclusivo` → `.field-comparison--exclusive`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.12 Rename Impact Card and Merge Actions module classes in cadastro-integracao
    - `.impacto-card` → `.impact-card`, `.impacto-titulo` → `.impact-card__title`, `.impacto-grid` → `.impact-card__grid`, `.impacto-item` → `.impact-card__item`, `.impacto-num` → `.impact-card__number`, `.impacto-label` → `.impact-card__label`
    - `.merge-acoes` → `.merge-actions`, `.btn-mesclar` → `.merge-actions__merge-btn`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.13 Rename SNAP Alerts module classes in cadastro-integracao
    - `.alertas-snap-card` → `.snap-alert-card`, `.alertas-snap-titulo` → `.snap-alert-card__title`, `.alerta-snap-item` → `.snap-alert-card__item`
    - Update SCSS + HTML
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 6.14 Checkpoint — Verify cadastro-integracao module renaming
    - Run `ng build` and confirm zero errors
    - Verify no old Portuguese class names remain in cadastro files: `grep -rn "hipotese\|validacao-\|decisao-\|conciliacao-\|comparacao-\|impacto-\|merge-acoes\|btn-mesclar\|btn-avancar\|sidebar-card\|sidebar-titulo\|sidebar-campo" --include="*.scss" --include="*.html" src/app/**/cadastro*`
    - _Requirements: 4.5, 9.1, 9.2_

- [ ] 7. Phase 4 (cont.) — Module Class Renaming (BEM) — Shell Components & Remaining Files
  - [x] 7.1 Rename User Menu module classes
    - In `user-menu.css` and corresponding HTML template:
    - `.user-menu-trigger` → `.user-menu`, `.user-info` → `.user-menu__info`, `.user-name` → `.user-menu__name`, `.user-role` → `.user-menu__role`, `.chevron-icon` → `.user-menu__chevron`
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 7.2 Rename Documents List module classes
    - In `documents-list.scss` and corresponding HTML template:
    - `.page-header` → `.page-header` (keep), `.page-title` → `.page-header__title`, `.page-title-icon` → `.page-header__icon`, `.page-title-text` → `.page-header__text`, `.placeholder-text` → `.page-header__placeholder`
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 7.3 Rename global module classes in styles.scss
    - `.dialog-body` → `.dialog__body`, `.dialog-footer` → `.dialog__footer`, `.dialog-consulta` → `.query-dialog`
    - Search ALL HTML templates for references to these global classes and update each reference
    - _Requirements: 4.1, 4.2, 8.4_

  - [x] 7.4 Verify already-BEM-compliant files need no module renames
    - Confirm `header.scss`, `sidebar.scss`, `breadcrumb.css`, `snap-search.scss` are already BEM compliant and need no module class renames
    - These files will be addressed in Phase 6 (property ordering) and Phase 7 (hardcoded values)
    - _Requirements: 4.2_

  - [x] 7.5 Rename module classes in remaining person SCSS files (~280 lines across 6 files)
    - Identify all Portuguese or non-BEM class names in the 6 other person SCSS files
    - Apply English BEM naming following the same patterns established in profile
    - Update corresponding HTML templates and TS files
    - _Requirements: 4.1, 4.2, 4.4_

  - [x] 7.6 Checkpoint — Verify all module renaming complete
    - Run `ng build` and confirm zero errors
    - Run comprehensive grep to verify no Portuguese class names remain across entire project: `grep -rn "monitorado\|cartao-\|busca-tab\|alerta-item\|filtros-avancados\|titulo-secao\|nova-pessoa\|hipotese\|validacao-\|decisao-\|conciliacao-\|comparacao-\|impacto-\|pendencia\|tarefa-background\|distribuicao\|paginacao\|toolbar-ordenacao" --include="*.scss" --include="*.html" --include="*.ts" src/`
    - Verify all module classes match BEM pattern
    - _Requirements: 4.5, 9.1, 9.2, 10.1, 10.3_

- [ ] 8. Phase 5 — State Class Renaming
  - [x] 8.1 Rename state classes in dashboard component
    - In `dashboard.component.scss`, `dashboard.component.html`, and `dashboard.component.ts`:
    - `.busca-tab--ativa` → `.is-active` (on feed-tab context)
    - `.busca-ativa` → `.is-search-active` (on search icon context)
    - `.toolbar-sort-btn--ativo` → `.is-active` (on sort-toolbar__btn context)
    - `.pag-num--ativo` → `.is-active` (on pagination__num context)
    - `.categoria-ativa` → `.is-active` (on category-filter__tag context)
    - `.alerta-pulse` → `.is-searching` (during search animation)
    - Update all `[class.*]` bindings and `classList` operations in the TypeScript file
    - Preserve BEM modifiers (`--modifier`) for structural/fixed variations — only rename JS-toggled conditions
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.2 Rename state classes in profile component
    - In `profile.component.scss`, `profile.component.html`, and `profile.component.ts`:
    - `.localizacao-atual` → `.is-current`
    - `.loc-atual` → `.is-current` (text label context)
    - Update all TypeScript class toggle references
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.3 Rename state classes in cadastro-integracao component
    - In `cadastro-integracao.component.scss`, `cadastro-integracao.component.html`, and `cadastro-integracao.component.ts`:
    - `.decisao-ativa` → `.is-selected`
    - Update all TypeScript class toggle references
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 8.4 Checkpoint — Verify state renaming
    - Run `ng build` and confirm zero errors
    - Verify all JS-toggled state classes use `is-`/`has-` prefix: `grep -rn "class\.\|classList" --include="*.ts" src/ | grep -v "is-\|has-"`
    - Verify no old state class names remain: `grep -rn "busca-ativa\|categoria-ativa\|busca-tab--ativa\|toolbar-sort-btn--ativo\|pag-num--ativo\|localizacao-atual\|decisao-ativa" --include="*.scss" --include="*.html" --include="*.ts" src/`
    - _Requirements: 5.4, 9.1, 9.2, 10.4_

- [ ] 9. Phase 6 — CSS Property Ordering
  - [x] 9.1 Reorder properties in dashboard.component.scss
    - Reorder all CSS properties in every rule block to follow: Positioning (`position`, `top`, `right`, `bottom`, `left`, `z-index`) → Box Model (`display`, `width`, `height`, `padding`, `margin`, `border`, `flex`, `grid`, `gap`) → Typography (`font-family`, `font-size`, `font-weight`, `line-height`, `color`, `text-align`, `letter-spacing`) → Visuals (`background`, `box-shadow`, `opacity`, `transition`, `transform`, `cursor`, `animation`)
    - Do NOT add, remove, or modify any property declaration — only change the order
    - Add category comments (`// Positioning`, `// Box Model`, `// Typography`, `// Visuals`) as shown in the design example
    - _Requirements: 6.1, 6.2_

  - [x] 9.2 Reorder properties in profile.component.scss
    - Apply the same Positioning → Box Model → Typography → Visuals ordering to all rule blocks
    - Do NOT add, remove, or modify any property declaration — only change the order
    - _Requirements: 6.1, 6.2_

  - [x] 9.3 Reorder properties in cadastro-integracao.component.scss
    - Apply the same property ordering to all rule blocks
    - Do NOT add, remove, or modify any property declaration — only change the order
    - _Requirements: 6.1, 6.2_

  - [x] 9.4 Reorder properties in shell components (header.scss, sidebar.scss, shell.scss)
    - Apply property ordering to all rule blocks in `header.scss`, `sidebar.scss`, and `shell.scss`
    - These files are already BEM compliant — only ordering changes needed
    - _Requirements: 6.1, 6.2_

  - [x] 9.5 Reorder properties in remaining files
    - Apply property ordering to: `breadcrumb.css`, `snap-search.scss`, `user-menu.css`, `documents-list.scss`, and the 6 other person SCSS files
    - _Requirements: 6.1, 6.2_

  - [x] 9.6 Reorder properties in styles.scss and _base.scss
    - Apply property ordering to all rule blocks in `styles.scss` and `_base.scss`
    - _Requirements: 6.1, 6.2_

  - [x] 9.7 Checkpoint — Verify property ordering
    - Run `ng build` and confirm zero errors
    - Visually verify pages render identically (ordering changes must not affect rendering)
    - _Requirements: 6.3, 9.1, 9.2_

- [ ] 10. Phase 7 — Hardcoded Value Replacement
  - [x] 10.1 Replace hardcoded values in dashboard.component.scss
    - Replace all hardcoded `font-size` values with `--text-*` tokens (e.g., `0.8125rem` → `var(--text-md)`, `0.75rem` → `var(--text-base)`)
    - Replace all hardcoded `padding`, `margin`, `gap` values with `--space-*` tokens (e.g., `0.5rem` → `var(--space-2-5)`, `0.75rem` → `var(--space-3-5)`)
    - Replace all hardcoded `border-radius` values with `--radius-*` tokens (e.g., `8px` → `var(--radius-lg)`, `6px` → `var(--radius-md)`)
    - Replace all hardcoded `box-shadow` values with `--shadow-*` tokens
    - Use closest available token when no exact match exists
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.2 Replace hardcoded values in profile.component.scss
    - Apply the same token replacements: `font-size` → `--text-*`, `padding`/`margin`/`gap` → `--space-*`, `border-radius` → `--radius-*`, `box-shadow` → `--shadow-*`
    - Use closest available token when no exact match exists
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.3 Replace hardcoded values in cadastro-integracao.component.scss
    - Apply the same token replacements for all hardcoded values
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.4 Replace hardcoded values in shell components (header.scss, sidebar.scss, shell.scss)
    - Apply token replacements for all hardcoded values in these already-BEM-compliant files
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.5 Replace hardcoded values in remaining files
    - Apply token replacements in: `breadcrumb.css`, `snap-search.scss`, `user-menu.css`, `documents-list.scss`, and the 6 other person SCSS files
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.6 Replace hardcoded values in styles.scss and _base.scss
    - Apply token replacements for all hardcoded values in global styles
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 10.7 Checkpoint — Verify hardcoded value replacement
    - Run `ng build` and confirm zero errors
    - Visually verify pages render identically in both light and dark mode
    - _Requirements: 7.6, 9.1, 9.2_

- [ ] 11. Phase 8 — Final Validation
  - [x] 11.1 Validate no Portuguese class names remain
    - Run comprehensive grep across all SCSS, HTML, and TS files for every "Current Class" entry in the naming map
    - Fix any remaining old class references found
    - _Requirements: 10.1_

  - [x] 11.2 Validate layout class prefix compliance
    - Verify all layout classes start with `l-`: `grep -rn "\.l-" --include="*.scss" src/`
    - Verify no structural/positioning classes exist without `l-` prefix
    - _Requirements: 10.2_

  - [x] 11.3 Validate BEM pattern compliance
    - Verify all module classes match the BEM pattern: `/^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?(--[a-z][a-z0-9]*(-[a-z0-9]+)*)?$/`
    - Verify no BEM element has more than one `__` nesting level
    - _Requirements: 10.3_

  - [x] 11.4 Validate state class prefix compliance
    - Verify all JS-toggled state classes start with `is-` or `has-`
    - Cross-reference TypeScript class toggle logic with SCSS/HTML
    - _Requirements: 10.4_

  - [x] 11.5 Validate hardcoded value elimination
    - Grep for remaining hardcoded `font-size`, `padding`, `margin`, `gap`, `border-radius`, `box-shadow` values that have token equivalents
    - Replace any remaining hardcoded values found
    - _Requirements: 10.5_

  - [x] 11.6 Validate property ordering compliance
    - Spot-check representative rule blocks in each file for Positioning → Box Model → Typography → Visuals ordering
    - _Requirements: 10.6_

  - [x] 11.7 Validate SCSS↔HTML class reference consistency
    - For each component, verify every class in SCSS has at least one HTML reference
    - For each component, verify every class in HTML has a SCSS definition (component-scoped or global)
    - Check for any `::ng-deep` selectors referencing old class names
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 11.8 Final build and visual regression check
    - Run `ng build` and confirm zero errors
    - Verify all pages (Dashboard, Profile, Registration Wizard, Shell) render identically in both light mode and dark mode
    - _Requirements: 9.1, 9.2, 10.7_

## Notes

- Each phase leaves the project in a buildable state — run `ng build` after every checkpoint
- Angular ViewEncapsulation requires SCSS + HTML + TS to be updated together for every class rename
- Global classes in `styles.scss` affect all components — search all templates when renaming global classes
- The naming map in the design document is the single source of truth for all class renames
- Files already BEM compliant (header.scss, sidebar.scss, breadcrumb.css, snap-search.scss) only need Phase 6 + Phase 7 changes
- Phase 4 is the largest phase (~330 class renames) — broken down by component for manageability
- Checkpoints ensure incremental validation and safe rollback points
