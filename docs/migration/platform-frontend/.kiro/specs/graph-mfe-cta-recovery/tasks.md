# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Graph Buttons Missing Click Handlers and Visibility Gate
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the three concrete button selectors (`.pr-right__graph`, `.pr-right__see-more`, `.pr-drawer__actions .pr-btn--ghost`) with deterministic test inputs
  - Create a component test for `ProfileNewComponent` that:
    - Renders the component with a valid person loaded (`personId()` non-empty)
    - Sets `isProduction = true` and `hasGraphPermission()` returning true
    - Queries the three button elements by their CSS classes
    - Asserts each button has a `(click)` binding that invokes `openGraph()`
    - Asserts each button is wrapped in `@if (isProduction && hasGraphPermission())` (i.e., hidden when permission is false)
    - Asserts each button has `[disabled]="!personId()"` binding
  - Test that setting `hasGraphPermission()` to false removes all three buttons from DOM
  - Test that clicking each button triggers `router.navigate(['/intelligence/person', id, 'graph'])`
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (buttons have no click handler, no visibility gate, no disabled guard)
  - Document counterexamples: buttons exist in DOM without click binding, buttons visible without permission
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Relations Panel and Drawer Interactions Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe on UNFIXED code:
    - Title bar graph button navigates correctly with `(click)="openGraph()"` and visibility gate
    - Clicking relation items opens the drawer (`openDrawer(item)` is called)
    - Filter chips change the active filter (`setRelFilter(key)` is called)
    - Search input filters relations (`onRelSearch(event)` is called)
    - Drawer close button and backdrop close the drawer (`closeDrawer()` is called)
    - "Abrir prontuário" button in drawer remains functional
  - Write property-based tests capturing observed behavior:
    - For all relation items rendered, clicking them opens the drawer with the correct item
    - For all filter chip clicks, the `relFilter` signal updates to the correct key
    - For all search input events, the `relSearch` signal updates correctly
    - Title bar graph button continues to call `openGraph()` and navigate
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for graph buttons missing click handlers and visibility gate

  - [x] 3.1 Implement the fix in profile-new.component.html
    - Wrap panel header "Grafo" button (`.pr-right__graph`) in `@if (isProduction && hasGraphPermission()) { ... }`
    - Add `(click)="openGraph()"` and `[disabled]="!personId()"` to the "Grafo" button
    - Wrap panel footer "Ver grafo (N)" button (`.pr-right__see-more`) in `@if (isProduction && hasGraphPermission()) { ... }`
    - Add `(click)="openGraph()"` and `[disabled]="!personId()"` to the "Ver grafo" button
    - Wrap drawer "Ver no grafo" button (`.pr-drawer__actions .pr-btn--ghost`) in `@if (isProduction && hasGraphPermission()) { ... }`
    - Add `(click)="openGraph()"` and `[disabled]="!personId()"` to the "Ver no grafo" button
    - No TypeScript changes needed — `openGraph()`, `isProduction`, `hasGraphPermission()`, and `personId()` already exist
    - _Bug_Condition: isBugCondition(input) where input.targetButton IN ['pr-right__graph', 'pr-right__see-more', 'pr-drawer__graph'] AND NOT hasClickHandler(input.targetButton)_
    - _Expected_Behavior: Each button invokes openGraph() which navigates to /intelligence/person/:id/graph; buttons hidden when !isProduction OR !hasGraphPermission(); buttons disabled when !personId()_
    - _Preservation: Title bar button, relation items, search, filters, drawer close, and "Abrir prontuário" button remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Graph Buttons Trigger Navigation
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — buttons now have click handlers, visibility gate, and disabled guard)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Relations Panel and Drawer Interactions Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — title bar button, relation items, filters, search, drawer all work as before)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
