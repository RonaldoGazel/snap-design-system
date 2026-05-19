# Graph MFE CTA Recovery — Bugfix Design

## Overview

Three graph-navigation buttons in the person detail page's relations panel and drawer are missing their `(click)="openGraph()"` bindings and the `@if (isProduction && hasGraphPermission())` visibility gate. The `openGraph()` method, `isProduction` flag, and `hasGraphPermission()` computed signal already exist and are correctly used by the title bar button. The fix is purely template-level — adding click bindings and wrapping the three buttons in the same conditional guard the title bar button uses.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — user clicks one of the three graph buttons (panel header, panel footer, drawer) and nothing happens because no click handler is bound
- **Property (P)**: The desired behavior — clicking any graph button navigates to `/intelligence/person/:id/graph` via `openGraph()`
- **Preservation**: Existing title bar graph button, relations panel interactions (search, filters, list items), and drawer "Abrir prontuário" button must remain unchanged
- **openGraph()**: Method in `ProfileNewComponent` that calls `router.navigate(['/intelligence/person', id, 'graph'])` when `personId()` is non-empty
- **isProduction**: Build-time flag (`environment.production`) that gates graph MFE features
- **hasGraphPermission()**: Computed signal that checks `intelligence:graph-viewer` permission via `ShellContextBridge`

## Bug Details

### Bug Condition

The bug manifests when a user clicks any of the three graph buttons in the relations panel or drawer. The buttons exist in the DOM but have no `(click)` binding, so the click event is swallowed with no effect. Additionally, the buttons are always visible regardless of permission/environment state, inconsistent with the title bar button.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type UserClickEvent
  OUTPUT: boolean

  RETURN input.targetButton IN ['pr-right__graph', 'pr-right__see-more', 'pr-drawer__graph']
         AND buttonExistsInDOM(input.targetButton)
         AND NOT hasClickHandler(input.targetButton)
END FUNCTION
```

### Examples

- User clicks "Grafo" button in `.pr-right__head` → Expected: navigate to `/intelligence/person/123/graph` → Actual: nothing happens
- User clicks "Ver grafo (5)" button in `.pr-right__footer` → Expected: navigate to `/intelligence/person/123/graph` → Actual: nothing happens
- User clicks "Ver no grafo" button in `.pr-drawer__actions` → Expected: navigate to `/intelligence/person/123/graph` → Actual: nothing happens
- User without `intelligence:graph-viewer` permission views the page → Expected: three buttons hidden → Actual: buttons visible (but non-functional)

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Title bar graph button must continue to navigate to `/intelligence/person/:id/graph` with its existing `(click)="openGraph()"` binding and `@if (isProduction && hasGraphPermission())` gate
- Relations panel search input, filter chips, and relation list items must continue to filter and open the drawer as they do today
- "Abrir prontuário" button in the drawer must continue to behave as it does today
- `openGraph()` method must continue to guard against empty `personId()` (no TS changes needed)

**Scope:**
All interactions that do NOT involve the three graph buttons should be completely unaffected by this fix. This includes:
- Mouse clicks on relation items (open drawer)
- Filter chip clicks (change relation filter)
- Search input typing (filter relations)
- Drawer close button and backdrop click
- Title bar buttons (export, share, create document)

## Hypothesized Root Cause

Based on the bug description, the root cause is straightforward:

1. **Missing `(click)` bindings**: During a UI enhancement that rebuilt the relations panel, the three graph buttons were added as static HTML without Angular event bindings. The `openGraph()` method exists but was never wired to these buttons.

2. **Missing visibility gate**: The `@if (isProduction && hasGraphPermission())` conditional that wraps the title bar button was not replicated for the three new buttons. This is a secondary defect — the buttons should not be visible at all for users without the required permission or in non-production builds.

3. **No TypeScript defect**: The `openGraph()` method, `isProduction` flag, and `hasGraphPermission()` signal are all correctly implemented and working (proven by the title bar button functioning correctly).

## Correctness Properties

Property 1: Bug Condition — Graph Buttons Trigger Navigation

_For any_ click event on one of the three graph buttons (panel header "Grafo", panel footer "Ver grafo (N)", drawer "Ver no grafo") where `personId()` is non-empty and `isProduction && hasGraphPermission()` is true, the fixed template SHALL invoke `openGraph()` which navigates to `/intelligence/person/:id/graph`.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition — Graph Buttons Visibility Gating

_For any_ page render where `isProduction` is false OR `hasGraphPermission()` returns false, the three graph buttons SHALL NOT be present in the DOM, consistent with the title bar button behavior.

**Validates: Requirements 2.4**

Property 3: Preservation — Existing Functionality Unchanged

_For any_ interaction that does NOT target the three graph buttons (title bar button, relation items, search, filters, drawer close, "Abrir prontuário"), the fixed template SHALL produce exactly the same behavior as the original template, preserving all existing functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `platform-frontend/src/app/features/person/pages/profile-new/profile-new.component.html`

**No TypeScript changes required** — `openGraph()`, `isProduction`, `hasGraphPermission()`, and `personId()` already exist.

**Specific Changes**:

1. **Panel header "Grafo" button** (`.pr-right__head`):
   - Wrap in `@if (isProduction && hasGraphPermission())`
   - Add `(click)="openGraph()"` binding
   - Add `[disabled]="!personId()"` for consistency with title bar button

2. **Panel footer "Ver grafo (N)" button** (`.pr-right__footer`):
   - Wrap in `@if (isProduction && hasGraphPermission())`
   - Add `(click)="openGraph()"` binding
   - Add `[disabled]="!personId()"` for consistency with title bar button

3. **Drawer "Ver no grafo" button** (`.pr-drawer__actions`):
   - Wrap in `@if (isProduction && hasGraphPermission())`
   - Add `(click)="openGraph()"` binding
   - Add `[disabled]="!personId()"` for consistency with title bar button

4. **Pattern reference** — the title bar button demonstrates the correct pattern:
   ```html
   @if (isProduction && hasGraphPermission()) {
   <button pButton [label]="'person.profile.openGraph' | translate" icon="pi pi-share-alt" [outlined]="true"
     size="small" (click)="openGraph()" [disabled]="!personId()"></button>
   }
   ```

5. **Minimal change principle** — only the three buttons are modified; no surrounding elements are touched.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that the three buttons lack click handlers and visibility gating.

**Test Plan**: Write component tests that render `ProfileNewComponent` with a valid person loaded, then query the three button elements and assert their event bindings. Run on UNFIXED code to observe failures.

**Test Cases**:
1. **Panel header button test**: Query `.pr-right__graph` button, assert it has a `(click)` binding → will fail on unfixed code
2. **Panel footer button test**: Query `.pr-right__see-more` button, assert it has a `(click)` binding → will fail on unfixed code
3. **Drawer button test**: Open drawer, query `.pr-btn--ghost` with "Ver no grafo" text, assert it has a `(click)` binding → will fail on unfixed code
4. **Visibility gate test**: Set `hasGraphPermission()` to false, assert buttons are not in DOM → will fail on unfixed code (buttons always visible)

**Expected Counterexamples**:
- Buttons exist in DOM but have no click handler attached
- Buttons are visible even when permission is not granted
- Possible cause: template was rebuilt without wiring event bindings or conditional rendering

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed template produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := renderFixedTemplate(input)
  ASSERT button.hasClickBinding('openGraph()')
  ASSERT button.isWrappedIn('@if (isProduction && hasGraphPermission())')
  ASSERT clickButton(button) triggers router.navigate(['/intelligence/person', personId, 'graph'])
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed template produces the same result as the original template.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT renderOriginalTemplate(input) = renderFixedTemplate(input)
END FOR
```

**Testing Approach**: Since this is a template-only fix touching exactly three button elements, preservation checking focuses on verifying that no other elements in the template were modified. Property-based testing can generate random component states (different person data, different permission combinations) and verify that all non-graph-button interactions produce identical results.

**Test Plan**: Observe behavior on UNFIXED code for title bar button, relation interactions, and drawer actions, then write tests capturing that behavior.

**Test Cases**:
1. **Title bar button preservation**: Verify title bar graph button still navigates correctly after fix
2. **Relation list preservation**: Verify clicking relation items still opens drawer after fix
3. **Filter preservation**: Verify filter chips still filter relations after fix
4. **Drawer "Abrir prontuário" preservation**: Verify this button is unaffected by the fix

### Unit Tests

- Test that each of the three buttons has `(click)="openGraph()"` binding after fix
- Test that each button is hidden when `isProduction` is false
- Test that each button is hidden when `hasGraphPermission()` returns false
- Test that each button is disabled when `personId()` is empty
- Test that clicking each button calls `router.navigate` with correct path

### Property-Based Tests

- Generate random person records with varying relation counts and verify graph buttons are correctly bound
- Generate random permission states (true/false combinations) and verify visibility gating is consistent across all four graph buttons (title bar + three new)
- Generate random personId values (empty string, valid IDs) and verify disabled state is correct

### Integration Tests

- Test full flow: load person → click "Grafo" in panel header → verify navigation to graph route
- Test full flow: load person → click "Ver grafo (N)" in panel footer → verify navigation to graph route
- Test full flow: load person → open drawer → click "Ver no grafo" → verify navigation to graph route
- Test permission gating: load person without permission → verify all four graph buttons are absent from DOM
