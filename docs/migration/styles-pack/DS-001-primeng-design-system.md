---
spec_id: DS-001
title: PrimeNG Design System Standard
version: "1.1"
status: draft
owner: platform-architecture
spec_type: design-system
tags:
  - design-system
  - primeng
  - angular
  - ui
  - theming
  - accessibility
last_updated: 2026-03-16
---

# PrimeNG Design System Standard

## Purpose

This specification establishes PrimeNG as the official component library and design system for all frontend development in the platform. It defines the required setup, component usage rules, theming approach, and brand customisation constraints that all frontend developers and AI Agents must follow.

## Design System

**PrimeNG** (`^21.x`) with the **Aura preset** from `@primeuix/themes` is the mandated component library for all Angular frontend work on this platform.

No alternative component libraries (e.g., Angular Material, Ng-Zorro, Clarity) may be introduced without explicit ARB approval.

## Required Setup

PrimeNG must be configured in `app.config.ts` using the Aura preset:

```typescript
import { ApplicationConfig } from "@angular/core";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeuix/themes/aura";

export const appConfig: ApplicationConfig = {
  providers: [
    providePrimeNG({
      theme: { preset: Aura },
    }),
  ],
};
```

## Component Usage Rules

1. Prefer PrimeNG components over custom implementations for standard UI patterns — tables, dialogs, forms, toasts, menus, overlays.
2. Import components individually — never import the entire PrimeNG module.
3. Use design tokens (`definePreset`) for theming customisation — do not override component styles with `::ng-deep`.
4. Scope token overrides with the `dt` property on the component when local customisation is needed.
5. PrimeNG components include built-in ARIA support — do not override `role` attributes unless intentional.

## Theming and Brand Customisation

The theming architecture must support brand customisation layered above the PrimeNG Aura baseline. This enables product teams to apply brand-specific colours, typography, and spacing without forking or patching PrimeNG internals.

### Theming Layers

| Layer               | Mechanism                         | Purpose                                                           |
| ------------------- | --------------------------------- | ----------------------------------------------------------------- |
| **Base preset**     | Aura from `@primeuix/themes`      | PrimeNG default component styles and tokens                       |
| **Brand preset**    | `definePreset(Aura, brandTokens)` | Platform or product brand overrides (colours, typography, radius) |
| **Component-level** | `dt` property on component        | Scoped per-instance token overrides                               |

### Rules

- The Aura preset is the baseline — never modify it directly.
- Brand customisation must be applied via `definePreset` from `@primeuix/themes`, extending Aura with a brand token map. This is the only permitted mechanism for platform-wide theming.
- Brand token maps must be defined in a dedicated file (e.g., `src/app/theme/brand-preset.ts`) and imported into `app.config.ts`.
- Dark mode must be configured via `darkModeSelector` in `providePrimeNG` — do not rely on the default `system` selector in production.
- Direct CSS overrides of PrimeNG internals are prohibited — use design tokens exclusively.
- Hardcoded colour values or spacing in component styles are prohibited — reference tokens only.

### Brand Preset Example

```typescript
import { definePreset } from "@primeuix/themes";
import Aura from "@primeuix/themes/aura";

export const BrandPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{your.brand.50}",
      500: "{your.brand.500}",
      // ... full palette
    },
  },
});
```

Register in `app.config.ts`:

```typescript
providePrimeNG({
  theme: { preset: BrandPreset },
});
```

## Dependency Versions

| Package            | Pinned Version | Notes                                     |
| ------------------ | -------------- | ----------------------------------------- |
| `primeng`          | `^21.x`        | No known critical CVEs as of March 2026   |
| `@primeuix/themes` | `^21.x`        | Required for Aura preset and definePreset |

## Node.js and Package Manager Requirements

All frontend repositories must use the following runtime and tooling versions:

| Tool    | Version                  | Notes                                 |
| ------- | ------------------------ | ------------------------------------- |
| Node.js | `24.x LTS` (`>=24.14.0`) | Active LTS "Krypton" — EOL April 2028 |
| npm     | `^11.9.0`                | Bundled with Node.js 24.x             |
| pnpm    | `^10.31`                 | Preferred workspace package manager   |

- Node.js version must be pinned in `.nvmrc` or `package.json` `engines` field.
- pnpm is the preferred package manager for all frontend workspaces.
- Do not use Yarn or npm workspaces — use pnpm workspaces.

## Accessibility

- PrimeNG components meet WCAG 2.1 AA baseline by default — do not override built-in ARIA attributes without justification.
- All interactive elements must remain keyboard-navigable.
- Use `aria-live` regions for dynamic content updates (toasts, loading states).
- Full WCAG compliance requires manual testing with assistive technologies — automated checks alone are insufficient.

## Rules for AI Agents

1. AI must use PrimeNG components for all standard UI patterns — do not generate custom implementations when a PrimeNG equivalent exists.
2. AI must not introduce alternative component libraries.
3. AI must not override PrimeNG styles with `::ng-deep`.
4. AI must apply brand customisation exclusively via `definePreset` — never via hardcoded CSS values.
5. AI must not override `role` attributes on PrimeNG components unless explicitly instructed.
6. When generating theme configuration, AI must produce a `brand-preset.ts` file and reference it from `app.config.ts` — never inline token overrides directly in the config.

## MCP Tooling Requirement

AI Agents must use the official MCP servers for Angular and PrimeNG on all frontend tasks. These are the authoritative source for current component APIs, design tokens, and usage patterns.

| MCP Server                           | Purpose                                                                     |
| ------------------------------------ | --------------------------------------------------------------------------- |
| **Angular CLI MCP** (`@angular/cli`) | Angular component generation, best practices, version-specific API guidance |
| **PrimeNG MCP** (`primeng`)          | Component props, events, templates, design tokens, theming examples         |

- Consult the PrimeNG MCP before using any component — props, event names, and template slots change across minor versions.
- Consult the Angular CLI MCP before generating any Angular construct to ensure compliance with the installed version's patterns.
- MCP servers take precedence over training data when API details conflict.
- If an MCP server is unavailable, flag this to the user before generating frontend code.

## Cross-References

- [ARCH-001] — System Architecture (Angular frontend stack, Node.js/pnpm versions)
- [AI-007] — Architecture Compliance (no unauthorized frontend frameworks)
- [AI-001] — Behavioral Rules (stack restrictions)
