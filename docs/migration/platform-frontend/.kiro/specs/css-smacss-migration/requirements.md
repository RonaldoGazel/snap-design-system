# Requirements Document

## Introduction

This document defines the requirements for migrating ~3,800 lines of CSS/SCSS across 18 files in the platform-frontend Angular application to comply with the DS-002 SMACSS CSS Architecture Standard. The migration is purely structural and naming-focused — zero visual changes are expected. It covers token infrastructure, SMACSS category enforcement (Base, Layout, Module, State, Theme), BEM naming, property ordering, hardcoded value replacement, and validation. Each phase must leave the project in a buildable state.

## Glossary

- **Migration_System**: The set of processes and tooling used to transform existing CSS/SCSS files to DS-002 compliance
- **Token_Infrastructure**: The centralized set of CSS custom property files (`_colors.scss`, `_typography.scss`, `_spacing.scss`, `_radius.scss`, `_shadows.scss`) under `src/styles/tokens/`
- **Base_Rules**: CSS rules using element-only selectors (no class or ID selectors) that define default styling for HTML elements
- **Layout_Rules**: CSS rules using the `l-` prefix that define page structure and positioning
- **Module_Rules**: CSS rules using BEM (Block__Element--Modifier) notation for reusable component styles
- **State_Rules**: CSS rules using `is-`/`has-` prefixes for JavaScript-toggled temporary conditions
- **BEM_Pattern**: The regex `/^[a-z][a-z0-9]*(-[a-z0-9]+)*(__[a-z][a-z0-9]*(-[a-z0-9]+)*)?(--[a-z][a-z0-9]*(-[a-z0-9]+)*)?$/`
- **Property_Order**: The mandated CSS property sequence: Positioning → Box Model → Typography → Visuals
- **Design_Token**: A CSS custom property (e.g., `--text-md`, `--space-3`, `--radius-lg`) that replaces a hardcoded value
- **ViewEncapsulation**: Angular's mechanism that scopes component styles, requiring SCSS + HTML + TS to be updated together
- **Naming_Map**: The complete mapping of ~330 current class names to their DS-002-compliant target names as defined in the design document

## Requirements

### Requirement 1: Token Infrastructure

**User Story:** As a frontend developer, I want all design tokens centralized in dedicated files under `src/styles/tokens/`, so that theme values have a single source of truth and can be maintained independently from component styles.

#### Acceptance Criteria

1.1. WHEN the migration begins, THE Migration_System SHALL create a `src/styles/tokens/` directory containing `_colors.scss`, `_typography.scss`, `_spacing.scss`, `_radius.scss`, `_shadows.scss`, and `_index.scss`

1.2. WHEN extracting color tokens, THE Migration_System SHALL move all `--snap-*` custom properties from the `:root` and `.p-dark` blocks in `styles.scss` into `_colors.scss`

1.3. WHEN creating typography tokens, THE Migration_System SHALL define tokens `--text-2xs` through `--text-5xl` in `_typography.scss` with the values specified in the design document Token Value Map

1.4. WHEN creating spacing tokens, THE Migration_System SHALL define tokens `--space-0` through `--space-10` in `_spacing.scss` with the values specified in the design document Token Value Map

1.5. WHEN creating radius tokens, THE Migration_System SHALL define tokens `--radius-xs` through `--radius-full` in `_radius.scss` with the values specified in the design document Token Value Map

1.6. WHEN creating shadow tokens, THE Migration_System SHALL define tokens `--shadow-sm` through `--shadow-xl` in `_shadows.scss` with both light and `.p-dark` variants

1.7. THE `_index.scss` barrel file SHALL forward all five token files using `@forward`

1.8. WHEN token extraction is complete, THE `styles.scss` file SHALL import `tokens/index` instead of containing inline token definitions

1.9. WHEN token infrastructure is complete, THE Angular project SHALL build successfully with zero visual changes

### Requirement 2: Base Rules Extraction

**User Story:** As a frontend developer, I want element-only selectors extracted into a dedicated `_base.scss` file, so that base styling is separated from component and layout styles per SMACSS.

#### Acceptance Criteria

2.1. WHEN extracting base rules, THE Migration_System SHALL move all element-only selectors (`body`, `h1`–`h6`, `a`, `input`, `button` defaults) from `styles.scss` into `src/styles/_base.scss`

2.2. THE `_base.scss` file SHALL contain only element selectors — no class or ID selectors

2.3. THE `_base.scss` file SHALL reference design tokens for all typography, spacing, and color values

2.4. WHEN base rules extraction is complete, THE Angular project SHALL build successfully with zero visual changes

### Requirement 3: Layout Class Naming

**User Story:** As a frontend developer, I want all structural/positioning classes to use the `l-` prefix, so that layout rules are instantly identifiable per DS-002.

#### Acceptance Criteria

3.1. WHEN renaming layout classes, THE Migration_System SHALL apply the `l-` prefix to all layout classes as defined in the Naming_Map (e.g., `.conteudo-principal` → `.l-dashboard`, `.coluna-esquerda` → `.l-dashboard__main`)

3.2. WHEN a layout class is renamed in a component SCSS file, THE Migration_System SHALL update the corresponding HTML template to reference the new class name

3.3. WHEN layout renaming is complete, THE Migration_System SHALL verify that every layout class name starts with `l-`

3.4. WHEN layout renaming is complete for a component, THE Angular project SHALL build successfully with zero visual changes

### Requirement 4: Module Class Naming (BEM)

**User Story:** As a frontend developer, I want all component classes to follow English BEM notation, so that module styles are collision-free and readable per DS-002.

#### Acceptance Criteria

4.1. WHEN renaming module classes, THE Migration_System SHALL translate all Portuguese class names to English equivalents and apply BEM notation as defined in the Naming_Map (e.g., `.monitorado-card` → `.person-card`, `.cartao-identidade` → `.identity-card`)

4.2. THE Migration_System SHALL ensure every module class name matches the BEM_Pattern

4.3. THE Migration_System SHALL ensure no BEM element has more than one `__` nesting level (no `block__element__subelement`)

4.4. WHEN a module class is renamed in a component SCSS file, THE Migration_System SHALL update the corresponding HTML template and TypeScript file (if the class is referenced there) to use the new class name

4.5. WHEN module renaming is complete for a component, THE Angular project SHALL build successfully with zero visual changes

### Requirement 5: State Class Naming

**User Story:** As a frontend developer, I want all JavaScript-toggled state classes to use `is-`/`has-` prefixes, so that temporary states are distinguishable from structural modifiers per DS-002.

#### Acceptance Criteria

5.1. WHEN renaming state classes, THE Migration_System SHALL apply `is-` or `has-` prefixes to all JavaScript-toggled state classes as defined in the Naming_Map (e.g., `.busca-tab--ativa` → `.is-active`, `.categoria-ativa` → `.is-active`)

5.2. WHEN a state class is renamed, THE Migration_System SHALL update the SCSS file, HTML template, and TypeScript file that toggles the class

5.3. THE Migration_System SHALL preserve BEM modifiers (`--modifier`) for structural/fixed variations and apply `is-`/`has-` prefixes only to JavaScript-toggled conditions

5.4. WHEN state renaming is complete for a component, THE Angular project SHALL build successfully with zero visual changes

### Requirement 6: CSS Property Ordering

**User Story:** As a frontend developer, I want all CSS properties ordered in the mandated sequence (Positioning → Box Model → Typography → Visuals), so that rule blocks are consistent and readable per DS-002.

#### Acceptance Criteria

6.1. WHEN reordering properties, THE Migration_System SHALL arrange properties in every CSS rule block following the Property_Order: Positioning (`position`, `top`, `right`, `bottom`, `left`, `z-index`), then Box Model (`display`, `width`, `height`, `padding`, `margin`, `border`, `flex`, `grid`, `gap`), then Typography (`font-family`, `font-size`, `font-weight`, `line-height`, `color`, `text-align`, `letter-spacing`), then Visuals (`background`, `box-shadow`, `opacity`, `transition`, `transform`, `cursor`, `animation`)

6.2. WHEN reordering properties, THE Migration_System SHALL not add, remove, or modify any property declaration — only change the order

6.3. WHEN property reordering is complete for a file, THE Angular project SHALL build successfully with zero visual changes

### Requirement 7: Hardcoded Value Replacement

**User Story:** As a frontend developer, I want all hardcoded font-size, spacing, border-radius, and shadow values replaced with design token references, so that theme values are centralized and maintainable per DS-002.

#### Acceptance Criteria

7.1. WHEN replacing hardcoded values, THE Migration_System SHALL replace all hardcoded `font-size` values with the corresponding `--text-*` token reference from the Token Value Map

7.2. WHEN replacing hardcoded values, THE Migration_System SHALL replace all hardcoded `padding`, `margin`, and `gap` values with the corresponding `--space-*` token reference from the Token Value Map

7.3. WHEN replacing hardcoded values, THE Migration_System SHALL replace all hardcoded `border-radius` values with the corresponding `--radius-*` token reference from the Token Value Map

7.4. WHEN replacing hardcoded values, THE Migration_System SHALL replace all hardcoded `box-shadow` values with the corresponding `--shadow-*` token reference

7.5. IF a hardcoded value has no exact token equivalent, THEN THE Migration_System SHALL use the closest available token

7.6. WHEN hardcoded value replacement is complete for a file, THE Angular project SHALL build successfully with zero visual changes

### Requirement 8: Cross-Cutting Consistency

**User Story:** As a frontend developer, I want the migration to maintain full consistency between SCSS, HTML, and TypeScript files, so that no orphaned references or broken bindings exist after migration.

#### Acceptance Criteria

8.1. THE Migration_System SHALL ensure that every class defined in a component SCSS file has at least one corresponding reference in the component HTML template (no orphaned SCSS classes)

8.2. THE Migration_System SHALL ensure that every class referenced in a component HTML template has a corresponding definition in the component SCSS file or in `styles.scss` (no undefined HTML class references)

8.3. WHEN a class name is used in a TypeScript `[class.*]` binding or `classList` operation, THE Migration_System SHALL update the TypeScript reference to match the renamed class

8.4. WHEN renaming classes in `styles.scss` (global scope), THE Migration_System SHALL search all HTML templates across all components for references to the old class name and update each reference

8.5. WHEN renaming classes referenced in `::ng-deep` selectors, THE Migration_System SHALL update the `::ng-deep` selector to reference the new class name

### Requirement 9: Build Integrity Per Phase

**User Story:** As a frontend developer, I want each migration phase to leave the project in a buildable state, so that I can verify correctness incrementally and revert a single phase if needed.

#### Acceptance Criteria

9.1. WHEN any migration phase (token infrastructure, base rules, layout, modules, state, property ordering, hardcoded values) is completed, THE Angular project SHALL compile successfully using `ng build`

9.2. WHEN any migration phase is completed, THE Migration_System SHALL produce zero visual changes compared to the pre-phase state

9.3. IF a migration phase introduces a build failure, THEN THE Migration_System SHALL identify and fix the cause before proceeding to the next phase

### Requirement 10: Validation

**User Story:** As a frontend developer, I want a final validation pass that confirms full DS-002 compliance, so that no non-compliant patterns remain after migration.

#### Acceptance Criteria

10.1. WHEN validation runs, THE Migration_System SHALL verify that no Portuguese class names from the Naming_Map remain in any SCSS, HTML, or TypeScript file

10.2. WHEN validation runs, THE Migration_System SHALL verify that all layout classes start with `l-`

10.3. WHEN validation runs, THE Migration_System SHALL verify that all module classes match the BEM_Pattern

10.4. WHEN validation runs, THE Migration_System SHALL verify that all JavaScript-toggled state classes start with `is-` or `has-`

10.5. WHEN validation runs, THE Migration_System SHALL verify that no hardcoded `font-size`, `padding`, `margin`, `gap`, `border-radius`, or `box-shadow` values exist when a token equivalent is available

10.6. WHEN validation runs, THE Migration_System SHALL verify that all CSS rule blocks follow the Property_Order

10.7. WHEN validation is complete, THE Angular project SHALL build successfully and pass visual regression checks in both light mode and dark mode
