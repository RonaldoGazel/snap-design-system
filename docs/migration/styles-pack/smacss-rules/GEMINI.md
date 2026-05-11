# AGENTIC ENTRY POINT: CSS Source of Truth (SMACSS)

## 🎯 Purpose
This repository is the authoritative Source of Truth for CSS architecture and implementation rules within this workspace. It is designed for multi-agent consumption (Gemini, Cursor, Windsurf, etc.).

## 🧭 Topic Router (Load ONLY the relevant file)
| If your task involves... | Read this file: |
| :--- | :--- |
| **Global element defaults, typography, resets** | `type-base.md` |
| **Major page structures, grids, headers/footers** | `type-layout.md` |
| **Reusable components (buttons, cards, widgets)** | `type-module.md` |
| **Interactions, hover, active, error states** | `type-state.md` |
| **Branding, colors, dark/light mode** | `type-theme.md` |
| **Performance, specificity, selectors** | `selectors.md` |
| **Sass/Less integration & variables** | `preprocessors.md` |
| **Modern HTML5 semantics** | `html5.md` |
| **Project standards & BEM naming** | `formatting.md` |
| **SMACSS + BEM integration** | `smacss-bem.md` |
| **Inheritance & complex overrides** | `complicated-inheritance.md` |

## 🤖 Multi-Agent Protocol
1. **Discovery:** Always search/read this file first to identify the correct sub-document.
2. **Context Efficiency:** Do NOT load all files. Load only the specific branch required for the current implementation task.
3. **Surgical Consistency:** When generating code, follow the **BEM naming notation** (`block__element--modifier`) defined in `formatting.md` and `smacss-bem.md`.
4. **Validation:** Every CSS change must be validated against the "Depth of Applicability" rules in `applicability.md`.
