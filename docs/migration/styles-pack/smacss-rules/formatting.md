# Formatting Code and Naming Conventions
Consistent coding style improves maintainability and team collaboration. In this architecture, we strictly follow **BEM (Block, Element, Modifier)** notation within the SMACSS framework.

## Naming Conventions (SMACSS + BEM)
To ensure clarity and prevent style collisions, every class name must follow this hybrid pattern:

### 1. Categories (SMACSS Prefixes)
- **Layout (`l-`):** Major page sections (e.g., `.l-header`, `.l-grid`).
- **State (`is-` or `has-`):** Temporary conditions (e.g., `.is-active`, `.has-error`).
- **Module (No prefix):** Reusable components (e.g., `.card`, `.button`).

### 2. Module Structure (BEM Syntax)
Modules MUST use BEM notation to define their internal structure:
- **Block:** The standalone component (e.g., `.card`).
- **Element (`__`):** A part of a block with no standalone meaning (e.g., `.card__title`, `.card__image`).
- **Modifier (`--`):** A flag that changes appearance or behavior (e.g., `.card--featured`, `.button--large`).

### 3. Integration Example
```css
/* SMACSS Module (BEM Block) */
.card { ... }

/* BEM Element */
.card__title { ... }

/* BEM Modifier */
.card--featured { ... }

/* SMACSS State (Applied to a Block or Element) */
.card.is-expanded { ... }
```

## Property Ordering
Group properties logically to improve readability:
1. **Positioning:** `position`, `top`, `z-index`.
2. **Box Model:** `display`, `width`, `padding`, `margin`, `border`.
3. **Typography:** `font-family`, `font-size`, `line-height`, `color`.
4. **Visuals:** `background`, `box-shadow`, `opacity`.

## Documentation
Use comments to clearly separate SMACSS categories within files.
