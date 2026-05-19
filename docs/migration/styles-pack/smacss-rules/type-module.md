# Module Rules
Modules are the discrete, reusable components of a design. In this architecture, **Modules must strictly follow BEM notation**.

## Key Rules
- **Standalone:** A module (BEM Block) must function correctly regardless of its placement.
- **Flat Selectors:** Use `.block__element` instead of nested selectors (e.g., `.block li a`) to keep specificity low.
- **Subclassing:** Use BEM Modifiers (e.g., `.btn--large`) for variations.
- **Portability:** Avoid IDs and element selectors; rely exclusively on BEM class names.