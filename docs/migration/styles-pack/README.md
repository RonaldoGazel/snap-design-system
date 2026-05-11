# Styles Pack

This folder is a **production-line standard** for frontend UI work on the platform. It tells both humans and AI coding agents (v0, Cursor, Gemini, Copilot, Kiro, Windsurf, Claude Code, …) exactly what shape a new screen, component, or style should take in the target Angular application.

If your tool, your prior project, or your training data says something different from what's written here, **this pack wins**.

---

## TL;DR — what agents need to know

- **Stack**: Angular 21 SPA + PrimeNG 21 (Apolo preset) + SCSS with SMACSS + BEM.
- **No free choice** on component library, CSS architecture, or design tokens.
- **All colors, spacing, typography, radii, shadows** come from `styles/tokens/*.scss`. Never hardcode literals.
- **Agent entry point**: [`AGENTS.md`](./AGENTS.md). Load it first, every time.
- **Quick reference for short-context models**: [`CHEATSHEET.md`](./CHEATSHEET.md).

---

## File map

### Root (read these first)

| File                               | Audience                                  | Purpose                                                               |
| ---------------------------------- | ----------------------------------------- | --------------------------------------------------------------------- |
| [`AGENTS.md`](./AGENTS.md)         | AI agents                                 | Mandatory rules, output contract, topic router, self-review checklist |
| [`CHEATSHEET.md`](./CHEATSHEET.md) | AI agents (short context), code reviewers | Condensed MUST / MUST NOT list and token index                        |
| [`README.md`](./README.md)         | Humans                                    | This overview                                                         |

### Specs (authoritative)

| File                                                                       | Spec ID       | Scope                                                                                                                   |
| -------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`DS-001-primeng-design-system.md`](./DS-001-primeng-design-system.md)     | DS-001        | PrimeNG as the mandated component library; setup, usage, theming via `definePreset`, MCP tooling requirements, AI rules |
| [`DS-002-smacss-css-architecture.md`](./DS-002-smacss-css-architecture.md) | DS-002        | SMACSS five-layer model, BEM notation, naming prefixes, property ordering, anti-patterns, full examples                 |
| [`frontend-architecture.md`](./frontend-architecture.md)                   | ARCH-009 v2.0 | Angular SPA topology, bootstrap, runtime config, routing, auth, build, Docker, CI, prohibited patterns                  |

### Reference material

| Path                                       | Purpose                                                                                                                                                                                               |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`smacss-rules/`](./smacss-rules/)         | Per-topic SMACSS reference with its own agent router ([`smacss-rules/GEMINI.md`](./smacss-rules/GEMINI.md)) and manifest ([`smacss-rules/.agent-manifest.json`](./smacss-rules/.agent-manifest.json)) |
| [`styles/tokens/`](./styles/tokens/)       | Design-token source files (`_colors.scss`, `_typography.scss`, `_spacing.scss`, `_radius.scss`, `_shadows.scss`)                                                                                      |
| [`styles/_base.scss`](./styles/_base.scss) | Shipped base element rules (html, body, headings)                                                                                                                                                     |
| [`styles.scss`](./styles.scss)             | Global utility classes and controlled PrimeNG overrides currently in production                                                                                                                       |

---

## How to use this pack

### As a human developer

1. Skim [`AGENTS.md`](./AGENTS.md) once. It's a good summary of the rules even if you're not an agent.
2. Read the relevant spec (`DS-001`, `DS-002`, or `ARCH-009`) for the area you're touching.
3. Check `styles/tokens/` and `styles.scss` before you invent a new token or utility class — most of what you need already exists.

### When prompting an AI agent

Point the agent at this folder and tell it to follow `AGENTS.md`. Any of the following work:

- Open this folder in an IDE that respects root agent files (Cursor, Windsurf, Claude Code, Kiro, etc.) — `AGENTS.md` is picked up automatically.
- Paste or `@-mention` `AGENTS.md` into your prompt.
- Add a project rule like: _"Before writing any code, read `AGENTS.md` in this folder. Follow its output contract and self-review checklist."_

For short-context models, point them at [`CHEATSHEET.md`](./CHEATSHEET.md) instead.

---

## Why the rules are strict

- **Consistency across teams** — multiple features converge on the same visual language without constant style arbitration.
- **Brand integrity** — swapping or tuning the brand is a token change, not a sweep across hundreds of components.
- **Safer refactors** — BEM + SMACSS means a class change can't leak into unrelated features.
- **Agent-friendly** — explicit rules remove guesswork, which is exactly what LLM-based tools need to produce compliant code on the first pass.

---

## Known spec drift

`DS-001` references the **Aura** preset (the PrimeNG default). `frontend-architecture.md` (v2.0, accepted) specifies the **Apolo** preset, which is what currently ships in `app.config.ts`. Apolo extends Aura, so every DS-001 rule (use `definePreset`, never `::ng-deep`, tokens over literals) still applies — only the base preset import changes. When generating or editing theme code, match what is already wired in `app.config.ts` and note the discrepancy in the PR rather than silently switching presets.

---

## Contributing to this pack

- Keep the root files (`AGENTS.md`, `CHEATSHEET.md`, `README.md`) in sync when a spec changes.
- Changes to `DS-001`, `DS-002`, or `ARCH-009` go through the normal ARB / platform-architecture review process. Bump `version` and `last_updated` in the spec front-matter.
- New design tokens: add to the right `styles/tokens/_*.scss` file, then update `CHEATSHEET.md`'s token index.
- New global utility classes: add to `styles.scss` with the banner-comment style already in use, then mention them in `CHEATSHEET.md` under _Reusable global classes_.
