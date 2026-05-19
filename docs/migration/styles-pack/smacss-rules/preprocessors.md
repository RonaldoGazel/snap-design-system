# Preprocessors
Integrating CSS preprocessors like Sass or Less with SMACSS involves using their features to reinforce modularity rather than bypass it.

## Key Concepts
- **File Organization:** Use `@import` to mirror SMACSS categories (e.g., `base.scss`, `layout.scss`, `modules.scss`).
- **Nesting:** Avoid deep nesting to keep specificity low. Nesting should primarily be used for state changes (`&.is-active`) or media queries.
- **Variables:** Use variables for Theme and Base rules (colors, typography) to ensure project-wide consistency.
- **Mixins:** Use mixins for repetitive patterns but avoid over-use to prevent code bloat in the compiled CSS.
