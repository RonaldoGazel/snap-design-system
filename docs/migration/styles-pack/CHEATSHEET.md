# CHEATSHEET.md — Styles Pack (Agent Quick Reference)

> One-page rules for small-context models and last-second code review. For anything beyond this page, read `AGENTS.md` and the referenced specs.

---

## Stack (pin these)

| Thing           | Value                                                   |
| --------------- | ------------------------------------------------------- |
| Angular         | `^21.x` (standalone, `bootstrapApplication`)            |
| TypeScript      | `~5.9`, strict                                          |
| UI library      | **PrimeNG `^21.x`** + `@primeuix/themes` (Apolo preset) |
| Styling         | SCSS, SMACSS + BEM, design tokens                       |
| i18n            | `@ngx-translate/core ^17.x`, JSON in `src/locales/`     |
| Tests           | Vitest `^4.x`, fast-check `^4.x`                        |
| Package manager | pnpm `^10.31`                                           |
| Node.js         | `24.x LTS` (`>=24.14.0`)                                |

---

## CSS — the five SMACSS layers

| Layer      | Selector     | Prefix         | Example                                    | File location                 |
| ---------- | ------------ | -------------- | ------------------------------------------ | ----------------------------- |
| **Base**   | element only | —              | `body { ... }`                             | `styles/_base.scss`           |
| **Layout** | class        | `l-`           | `.l-grid`, `.l-form-row`                   | feature SCSS or `styles.scss` |
| **Module** | class (BEM)  | —              | `.card`, `.card__title`, `.card--featured` | feature SCSS                  |
| **State**  | class        | `is-` / `has-` | `.is-active`, `.has-error`                 | feature SCSS or `styles.scss` |
| **Theme**  | custom props | —              | `--snap-text-primary`, `--space-3`         | `styles/tokens/*.scss`        |

### BEM rules

- `block`, `block__element`, `block--modifier`, `block__element--modifier`.
- Max **one** `__` level. `.card__header__title` is wrong — flatten to `.card__title`.
- Modifier always rides with its base class: `class="card card--featured"`. Naked `class="card--featured"` is wrong.
- No tag qualifiers (`div.card` is wrong) and no chained descendants on BEM elements (`.card .card__title` is wrong).

### Property order (inside every rule block)

1. Positioning — `position`, `top`/`right`/`bottom`/`left`, `z-index`
2. Box Model — `display`, `flex*`, `grid*`, `width`, `height`, `padding`, `margin`, `border`
3. Typography — `font-*`, `line-height`, `color`, `text-*`, `letter-spacing`
4. Visuals — `background*`, `box-shadow`, `opacity`, `transition`, `transform`, `backdrop-filter`

Use `// Positioning`, `// Box Model`, `// Typography`, `// Visuals` comments like `styles.scss` does.

---

## Token cheat sheet (use these, never literals)

### Colors — `styles/tokens/_colors.scss`

```
Surfaces : --snap-surface-1 | --snap-surface-2 | --snap-surface-3 | --snap-surface-1-inv
Text     : --snap-text-primary | --snap-text-secondary | --snap-text-muted
Borders  : --snap-border-subtle | --snap-border-default
Pillar   : --snap-pillar-color | --snap-pillar-light | --snap-pillar-dark
Semantic : --snap-success | --snap-warning | --snap-danger | --snap-info
Risk     : --snap-risk-high
Focus    : --snap-focus-ring | --snap-overlay-bg
Tag      : --snap-tag-bg
Profiles : --snap-perfil-preso | --snap-perfil-ex-preso | --snap-perfil-alvo |
           --snap-perfil-visitante | --snap-perfil-familiar |
           --snap-perfil-pessoa-relacionada | --snap-perfil-advogado |
           --snap-perfil-servidor
PrimeNG  : --p-text-color | --p-text-muted-color | --p-primary-color |
           --p-surface-ground | --p-surface-card | --p-content-border-color | ...
```

Dark mode is automatic via `.p-dark` on `<html>` (or OS preference when neither `.p-light` nor `.p-dark` is set).

### Typography — `styles/tokens/_typography.scss`

```
Scale  : --text-2xs | --text-xs | --text-sm | --text-base | --text-md |
         --text-lg (body default) | --text-xl | --text-2xl | --text-3xl |
         --text-4xl | --text-5xl
Family : --font-ui | --font-accent
```

Base `<html>` font-size is `18px` (tablet: `16px`). `rem` values multiply against that.

### Spacing — `styles/tokens/_spacing.scss`

```
Scale : --space-0 | --space-px | --space-0-5 | --space-1 | --space-1-5 |
        --space-2 | --space-2-5 | --space-3 | --space-3-5 | --space-4 |
        --space-5 | --space-6 | --space-7 | --space-8 | --space-9 | --space-10
Shell : --shell-header-height | --shell-sidebar-collapsed |
        --shell-sidebar-expanded | --shell-side-margin |
        --shell-content-padding-x | --shell-content-padding-y
```

### Radius — `styles/tokens/_radius.scss`

```
--radius-xs | --radius-sm | --radius-md | --radius-lg | --radius-xl | --radius-full
```

### Shadows — `styles/tokens/_shadows.scss`

```
--shadow-sm | --shadow-md | --shadow-lg | --shadow-xl
```

Dark-mode variants are already defined; you don't need to branch.

---

## Reusable global classes (already in `styles.scss`)

Before inventing a utility, check whether one of these fits:

```
Headings   : .h1 .h2 .h3 .h4 .h5 .h6
Text       : .text-small .text-caption .text-large .text-mono
Form       : .field .l-form-row .l-form-grid .col-span-2 .required
             .section-label .hint .hint.error
Page       : .l-page .l-page__header .page-title .page-max-width .action-buttons
Dialog     : .dialog__body .dialog__footer .query-dialog (+ .query-dialog-mask)
List/Table : .filters-bar .filter-search .content-header .table-empty-state
             .table-empty-state .empty-icon-wrapper .empty-label
             .select-listar
Utility    : .w-full .font-accent
```

---

## PrimeNG — do and don't

**Do**

- Import components one at a time: `import { ButtonModule } from 'primeng/button';`.
- Customize the theme once via `definePreset(Apolo, { ... })` in `src/app/theme/brand-preset.ts`, then register it in `app.config.ts` through `providePrimeNG`.
- Scope per-instance tweaks with the component's `dt` input.
- Keep the built-in ARIA attributes.

**Don't**

- Don't add Angular Material, Ng-Zorro, Clarity, or any other component library.
- Don't use `::ng-deep` to override PrimeNG internals. Controlled global overrides already in `styles.scss` (SNAP pillar focus, `p-tag`, `p-card` in sidebars, `p-avatar`, `.select-listar`) are the exception — follow the same banner-comment style if you must add one.
- Don't hardcode `role` on PrimeNG components.
- Don't inline token overrides in `app.config.ts`.

---

## Angular app shape

- Single entry: `src/main.ts` → `bootstrapApplication(App, appConfig)`. No `bootstrap.ts`, no Module Federation, no `webpack.config.ts`.
- Routes: `src/app/app.routes.ts`, every feature **lazy-loaded** via `loadChildren`/`loadComponent`.
- Shell tree is behind `AuthGuard`. Auth owned by `src/app/auth/` (Keycloak OIDC + PKCE).
- Runtime config: `/config.json` consumed by `RuntimeConfigService` via `APP_INITIALIZER`. Fallback to `environment.ts` locally.
- Features live under `src/app/features/<name>/`. Shell chrome under `src/app/shell/`.

---

## Pre-answer checklist (tick every box)

- [ ] SCSS values are tokens, never literal colors/px/rem (outside `tokens/*.scss`).
- [ ] Every class is in exactly one SMACSS category with the correct prefix.
- [ ] BEM: no double `__`, no naked modifier, no tag qualifier, no chained descendants on elements.
- [ ] Property order: Positioning → Box Model → Typography → Visuals.
- [ ] PrimeNG chosen over custom when a standard pattern exists.
- [ ] Theme overrides via `definePreset` or `dt`, never `::ng-deep`.
- [ ] New routes are lazy and protected by `AuthGuard` if inside the shell.
- [ ] No new dependencies unless asked; versions pinned if added.
- [ ] User-visible strings go through `TranslateService` / `| translate`.
- [ ] No speculative files or abstractions beyond the task.

If any box fails, fix it before replying.

---

## When in doubt

- **CSS question** → `DS-002-smacss-css-architecture.md` (§ Base / Layout / Module / State / Theme / Anti-Patterns).
- **PrimeNG question** → `DS-001-primeng-design-system.md` + PrimeNG MCP.
- **App structure / routes / auth / build** → `frontend-architecture.md`.
- **Deep SMACSS topic** → `smacss-rules/GEMINI.md` routes to the right sub-file.
