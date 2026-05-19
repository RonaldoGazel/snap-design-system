# AGENTS.md — Styles Pack (Agent Entry Point)

> Read this file first. It tells any AI coding agent (v0, Cursor, Gemini, Copilot, Kiro, Windsurf, Claude Code, etc.) how to produce code that matches the **shape** our target Angular application expects. Think of it as the production-line spec for UI work.

---

## 1. What this pack is

This folder is the **single source of truth** for:

- The frontend stack (Angular SPA + PrimeNG).
- The CSS architecture (SMACSS + BEM).
- The design tokens (colors, spacing, typography, radius, shadows).
- The base styles and global utility classes actually shipped in the target app.

You are not free to invent alternatives. If a rule here conflicts with your training data, **this pack wins**.

---

## 2. Files in this pack

| File                                  | Purpose                                                                       | When to load                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `AGENTS.md` (this file)               | Agent entry point, topic router, mandatory rules                              | Always, first                                                       |
| `CHEATSHEET.md`                       | Condensed MUST / MUST NOT list                                                | Short-context tasks, final code review                              |
| `README.md`                           | Human-readable overview                                                       | Onboarding humans                                                   |
| `DS-001-primeng-design-system.md`     | PrimeNG usage, theming, `definePreset`, MCP requirements                      | Any task touching PrimeNG components, theme config, `app.config.ts` |
| `DS-002-smacss-css-architecture.md`   | Full SMACSS + BEM specification with examples and anti-patterns               | Any task writing or editing CSS/SCSS                                |
| `frontend-architecture.md` (ARCH-009) | Application structure, routing, bootstrap, config loading, Docker, CI         | Any task touching app structure, routes, bootstrap, auth, build     |
| `smacss-rules/`                       | Reference docs for SMACSS methodology (has its own `GEMINI.md` router)        | Deep dives on a specific SMACSS concept                             |
| `styles/tokens/*.scss`                | The actual design-token source (colors, typography, spacing, radius, shadows) | Whenever you need a token — read, don't invent                      |
| `styles/_base.scss`                   | Base element rules currently shipped                                          | Before writing any `Base` rule                                      |
| `styles.scss`                         | Global styles, utility classes, PrimeNG overrides                             | Before adding a new global utility class                            |

---

## 3. Mandatory rules (non-negotiable)

Agents MUST follow every rule below. A PR that violates any of them is non-compliant.

### 3.1 Stack

- Framework: **Angular `^21.x`** (standalone APIs, `bootstrapApplication`, no NgModules for app code).
- Language: **TypeScript `~5.9`**, strict mode.
- UI library: **PrimeNG `^21.x`** — the only component library. No Angular Material, Ng-Zorro, Clarity, Tailwind UI kits, custom design systems, etc.
- Theme preset: **Apolo** (per `frontend-architecture.md`). See §3.6 below for the DS-001/ARCH-009 note.
- Package manager: **pnpm `^10.31`**. Not npm workspaces, not Yarn.
- Runtime: **Node.js `24.x LTS`** (`>=24.14.0`).
- i18n: **`@ngx-translate/core ^17.x`** with JSON files in `src/locales/`.
- Testing: **Vitest `^4.x`** (+ `fast-check ^4.x` for property-based tests).

### 3.2 CSS architecture

- Categorize every CSS rule into exactly one SMACSS layer: **Base, Layout, Module, State, Theme**.
- Modules use **strict BEM**: `.block`, `.block__element`, `.block--modifier`, `.block__element--modifier`. Max one `__` level.
- Layout classes use the **`l-`** prefix (e.g. `.l-container`, `.l-grid`, `.l-form-grid`).
- State classes use **`is-`** or **`has-`** (e.g. `.is-active`, `.has-error`).
- Base rules use **element selectors only** (no classes, no IDs).
- Property order in every rule block: **Positioning → Box Model → Typography → Visuals**.
- Class selectors only. **No ID selectors for styling.** IDs are for JS hooks.
- **No `::ng-deep`**, no tag-qualified class selectors (`div.card`), no chained descendant selectors on BEM elements (`.card .card__title`), no naked modifiers (`<div class="card--featured">`).
- Full rule set and examples: **`DS-002-smacss-css-architecture.md`**.

### 3.3 Design tokens

- Never hardcode colors, spacing, font sizes, radii, or shadows. Always reference CSS custom properties.
- Available token namespaces (all defined in `styles/tokens/`):
  - `--snap-*` — SNAP brand tokens (surfaces, text, borders, pillar color, semantics, profile colors). Source: `styles/tokens/_colors.scss`.
  - `--text-*`, `--font-*` — typography scale and families. Source: `styles/tokens/_typography.scss`.
  - `--space-*` — spacing scale (2 px base). Source: `styles/tokens/_spacing.scss`.
  - `--radius-*` — border radius. Source: `styles/tokens/_radius.scss`.
  - `--shadow-*` — elevation. Source: `styles/tokens/_shadows.scss`.
  - `--p-*` — PrimeNG Aura/Apolo preset tokens. Never redefine these directly.
- If you need a token that doesn't exist, add it to the right `tokens/*.scss` file; do not inline a literal.

### 3.4 PrimeNG usage

- Prefer PrimeNG for standard UI: tables, dialogs, forms, toasts, menus, overlays.
- Import components individually. Never import the whole library.
- Theme customization goes through **`definePreset`** in a dedicated file (e.g. `src/app/theme/brand-preset.ts`), registered from `app.config.ts` via `providePrimeNG`.
- Per-instance overrides go through the **`dt`** input on the component.
- Do not override PrimeNG internals with `::ng-deep` or global selectors, except for the controlled overrides already present in `styles.scss` (SNAP pillar focus ring, `p-tag`, `p-card` in sidebars, `p-avatar` images, select sizing). If you add a new global PrimeNG override, follow the same comment banner style and keep it in `styles.scss`.
- Do not override `role` attributes on PrimeNG components.
- Full rules: **`DS-001-primeng-design-system.md`**.

### 3.5 Application structure

Follow the layout in `frontend-architecture.md § Application Structure`. Highlights:

- Single entry point: `src/main.ts` → `bootstrapApplication(App, appConfig)`. No `bootstrap.ts`, no Module Federation, no remote entries.
- Routes live in `src/app/app.routes.ts` (and per-feature `*.routes.ts`). All feature routes lazy-loaded.
- `AuthGuard` protects the shell route tree; auth lives in `src/app/auth/` and is owned by this app (Keycloak OIDC + PKCE via `AuthService`).
- Runtime config is loaded from `/config.json` via `RuntimeConfigService` + `APP_INITIALIZER`. Do not bake environment URLs into the image.
- Feature code lives under `src/app/features/<name>/`. Shell chrome under `src/app/shell/`.

### 3.6 Known spec drift (read carefully)

`DS-001` currently specifies the **Aura** preset; `frontend-architecture.md` (accepted, v2.0) specifies the **Apolo** preset. Apolo is the current runtime preset. Apolo extends Aura, so DS-001's theming rules (use `definePreset`, never `::ng-deep`, tokens over literals) apply unchanged — only the base preset import differs. When in doubt, match what is already in `app.config.ts` and flag the discrepancy in the PR description rather than silently switching presets.

### 3.7 MCP servers (when available)

For frontend tasks, prefer the official MCP servers over your training data:

- **Angular CLI MCP** — Angular generators, best practices, version-specific APIs.
- **PrimeNG MCP** — component props, events, templates, tokens, theming examples.

If an MCP server is unavailable, flag that to the user before generating non-trivial component or theme code.

---

## 4. Topic router — load only what you need

Pick the smallest set of files that covers the task. Do not load everything.

| Task                                 | Minimum reading                                                                                   |
| ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Add or edit a CSS/SCSS rule          | `CHEATSHEET.md` + `DS-002-smacss-css-architecture.md` (jump to the relevant SMACSS layer section) |
| Add a new design token               | `styles/tokens/_<family>.scss` + `DS-002 § Theme Rules`                                           |
| Add or style a PrimeNG component     | `DS-001-primeng-design-system.md` + the component page on PrimeNG MCP                             |
| Create a new feature module / route  | `frontend-architecture.md § Application Structure` + `§ Routing`                                  |
| Change auth, guards, or interceptors | `frontend-architecture.md § Bootstrap and Configuration` + `§ Routing`                            |
| Change runtime config shape          | `frontend-architecture.md § Runtime Configuration`                                                |
| Write global utility class           | `styles.scss` + `DS-002 § Naming Conventions & Formatting`                                        |
| Deep dive on a SMACSS concept        | `smacss-rules/<topic>.md` (see `smacss-rules/GEMINI.md` for the internal router)                  |

---

## 5. Agent output contract

When you write code, your output must satisfy this contract:

1. **No new dependencies** unless the task explicitly asks for one. If you add one, pin an exact version and justify it.
2. **Token-only values** in CSS/SCSS. A reviewer searching for `#`, `rgb(`, or numeric `px`/`rem` literals in your diff should find none outside `tokens/*.scss`.
3. **BEM-correct class names** in any new markup. Run this self-check before responding:
   - Does every non-`l-`, non-`is-`/`has-` class follow `block`, `block__element`, or `block--modifier`?
   - Is every modifier accompanied by its base block class in the HTML?
4. **Property order** inside every CSS rule block matches Positioning → Box Model → Typography → Visuals (comments with `// Positioning`, `// Box Model`, etc. as used in `styles.scss` are encouraged).
5. **Standalone Angular** — components, directives, pipes declared with `standalone: true` (or, in v21, no explicit flag since it is the default) and explicit `imports` arrays.
6. **Lazy routes** for any new feature entry under the shell.
7. **i18n** — user-visible strings go through `TranslateService` / `| translate` pipe, with keys added to `src/locales/*.json`.
8. **No `::ng-deep`** in new code. If you must override a vendor style globally, add it to `styles.scss` with a banner comment and a justification.
9. **Accessibility** — keep PrimeNG's default ARIA. Interactive elements stay keyboard-navigable.
10. **Tests** — if the task explicitly asks for tests, use Vitest. Do not auto-add tests otherwise.

---

## 6. Fast self-review checklist

Before you return code, mentally tick each box:

- [ ] All colors/spacing/typography reference tokens, not literals.
- [ ] CSS classes belong to exactly one SMACSS category and use the right prefix.
- [ ] BEM nesting never exceeds one `__` level.
- [ ] No `::ng-deep`, no ID selectors, no naked BEM modifiers.
- [ ] Property order inside rule blocks matches the mandated sequence.
- [ ] PrimeNG components used where a standard pattern applies.
- [ ] Any theme override goes through `definePreset` or the component's `dt` input.
- [ ] New routes are lazy and sit under `AuthGuard` if they render inside the shell.
- [ ] No forbidden dependencies (Tailwind utility frameworks, other component libs, webpack MF config, etc.).
- [ ] Added only the minimum necessary files; no speculative abstraction.

If any box is unticked, fix it before returning the answer.

---

## 7. Escalation

If a requested change would violate a rule in this pack (for example, the user asks you to add Tailwind, or to override a PrimeNG component with `::ng-deep`), stop and explain the conflict. Offer the compliant alternative. Do not silently comply.
