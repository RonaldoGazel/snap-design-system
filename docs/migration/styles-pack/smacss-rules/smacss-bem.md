# SMACSS + BEM: The Architecture Blueprint
This document outlines the mandatory integration of SMACSS categories with BEM naming conventions to achieve the highest level of scalability and clarity.

## 🧱 The Core Hybrid Concept
While SMACSS provides the high-level organization (the "where"), BEM provides the granular syntax (the "how").

### 🏗 SMACSS Categories in a BEM World
- **Base:** Global defaults (no BEM).
- **Layout (`l-`):** Major structure (can be BEM Blocks, e.g., `.l-grid__col`).
- **Module:** Independent components (BEM Blocks, Elements, and Modifiers).
- **State (`is-`):** Temporary behavioral states (BEM Modifiers can also be used, but `.is-` is preferred for cross-module states).
- **Theme:** Skin/Style overrides (no BEM).

## 🛠 Naming Strategy (STRICT)

### 1. Blocks (The SMACSS Module)
A Block is a functionally independent page component.
- **Rule:** Use a clear, noun-based name.
- **Example:** `.search-form`, `.profile-card`.

### 2. Elements (The Module Parts)
A part of a block that has no standalone meaning.
- **Syntax:** `block__element`
- **Rule:** Never nest elements more than one level deep (`.block__el1__el2` is NOT allowed).
- **Example:** `.search-form__input`, `.search-form__button`.

### 3. Modifiers (Variations)
Used to change appearance, state, or behavior.
- **Syntax:** `block--modifier` or `block__element--modifier`
- **Rule:** Modifiers must always be used WITH the base class (e.g., `class="btn btn--large"`).
- **Example:** `.search-form--hidden`, `.button--disabled`.

### 4. State (The SMACSS Condition)
While BEM uses modifiers for states, we prioritize SMACSS `.is-` prefixes for states toggled by JavaScript.
- **Rule:** Use `.is-` for states that could apply to multiple types of modules (e.g., `.is-active`).
- **Rule:** Use BEM modifiers for structural variations (e.g., `.card--wide`).

## ⚡ Integration Blueprint (HTML Example)
```html
<!-- Layout Category -->
<section class="l-container">

  <!-- Module Category (BEM Block) -->
  <article class="card card--featured is-active">
    
    <!-- BEM Element -->
    <h2 class="card__title">Module Title</h2>
    
    <!-- BEM Element with Modifier -->
    <p class="card__body card__body--compact">
      Component content...
    </p>
    
  </article>

</section>
```

## 🚫 Critical Anti-Patterns (NEVER DO)
- **Chain of command:** `.card .card__title` (Avoid nesting. Just use `.card__title`).
- **Identity Crisis:** `.card__title__icon` (Element nesting is illegal. Use `.card__title-icon` or a separate module).
- **Naked Modifiers:** `class="card--featured"` (Always include the block class: `class="card card--featured"`).
