# Complicated Inheritance
Managing inheritance is crucial when modules (BEM Blocks) need to share styles or exist within specific contexts.

## Key Concepts
- **BEM Modifiers:** Use modifiers (e.g., `.btn--primary`) to handle variations instead of arbitrary sub-classes.
- **Avoiding Contextual Selectors:** Never use `.sidebar .btn` to change a button’s style. Instead, use a modifier: `.btn--sidebar`.
- **Inheritance vs. Sub-classing:** A modifier should always be applied alongside its base block (e.g., `class="btn btn--primary"`) to leverage inheritance correctly.
- **Multi-class Pattern:** This is the foundation of BEM, ensuring each class has a singular, clear responsibility.
