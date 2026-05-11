# Bugfix Requirements Document

## Introduction

The person detail page (`profile-new` component) has three buttons in the RELAÇÕES (relations) panel and relation detail drawer that should navigate to the graph-visualization MFE but are missing their `(click)="openGraph()"` bindings. The `openGraph()` method already exists in the component and correctly navigates to `/intelligence/person/:id/graph`. The buttons were left unwired during a UI enhancement that rebuilt the relations panel. This bug prevents users from accessing the graph visualization from the relations context, forcing them to use only the title bar button.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the user clicks the "Grafo" button in the relations panel header (`.pr-right__head`) THEN the system does nothing because the button has no click handler bound

1.2 WHEN the user clicks the "Ver grafo (N)" button in the relations panel footer (`.pr-right__footer`) THEN the system does nothing because the button has no click handler bound

1.3 WHEN the user clicks the "Ver no grafo" button in the relation detail drawer actions (`.pr-drawer__actions`) THEN the system does nothing because the button has no click handler bound

### Expected Behavior (Correct)

2.1 WHEN the user clicks the "Grafo" button in the relations panel header THEN the system SHALL navigate to `/intelligence/person/:id/graph` by invoking `openGraph()`

2.2 WHEN the user clicks the "Ver grafo (N)" button in the relations panel footer THEN the system SHALL navigate to `/intelligence/person/:id/graph` by invoking `openGraph()`

2.3 WHEN the user clicks the "Ver no grafo" button in the relation detail drawer actions THEN the system SHALL navigate to `/intelligence/person/:id/graph` by invoking `openGraph()`

2.4 WHEN the user lacks the `intelligence:graph-viewer` permission or the build is non-production THEN the system SHALL hide the three graph buttons, consistent with the existing title bar graph button gating (`isProduction && hasGraphPermission()`)

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the user clicks the existing graph button in the title bar THEN the system SHALL CONTINUE TO navigate to `/intelligence/person/:id/graph` as it does today

3.2 WHEN the user interacts with the relations panel search, filter chips, or relation list items THEN the system SHALL CONTINUE TO filter relations and open the detail drawer as it does today

3.3 WHEN the user clicks "Abrir prontuário" in the relation detail drawer THEN the system SHALL CONTINUE TO behave as it does today (unaffected by this fix)

3.4 WHEN `personId()` is empty (no person loaded) THEN the system SHALL CONTINUE TO prevent navigation (the `openGraph()` method already guards against this)
