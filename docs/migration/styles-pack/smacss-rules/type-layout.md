# Layout Rules
Layout rules divide the page into major sections (headers/footers) and minor components (grids).

## Key Rules
- **Major Sections:** Often use ID selectors, but class selectors are preferred for flexibility.
- **Prefixing:** Use the `l-` prefix for all layout components (e.g., `.l-header`).
- **BEM Integration:** Reusable layout components should use BEM element notation for their parts (e.g., `.l-grid__col`).
- **Isolation:** Layout rules should only dictate the positioning of modules, not their internal styles.