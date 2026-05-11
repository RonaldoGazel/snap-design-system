# State Rules
State rules describe how a module looks in a specific condition (e.g., hidden, active, or in an error state).

## Key Rules
- **Conditionality:** Styles should indicate a change triggered by user interaction or JavaScript.
- **Naming:** Prefer the `is-` prefix for stateful conditions (e.g., `.is-active`).
- **BEM Modifier vs. State:** Use BEM modifiers for structural or fixed variations (`.btn--large`) and SMACSS state classes for temporary conditions (`.is-active`).
- **Overriding:** `!important` is permitted and often recommended here to ensure state rules override other styles.