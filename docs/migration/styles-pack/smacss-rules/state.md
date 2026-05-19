# Changing State
State changes describe how a module’s appearance shifts based on interaction or environment.

## Key Methods
- **Class Names (SMACSS):** Toggled via JavaScript (e.g., `.is-active`). This is preferred for temporary, behavioral states.
- **BEM Modifiers:** Used for structural or fixed variations (e.g., `.block--active`).
- **Pseudo-classes:** CSS-native states like `:hover` or `:focus`.
- **Media Queries:** Responsive state adjustments.

The goal is to keep state-related styles localized to the components (BEM Blocks) they affect, maintaining modular isolation.