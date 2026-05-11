# Tasks: Graph Visualization MFE Integration

## Task List

- [x] 1. Write graph-visualization README
  - [x] 1.1 Write "What This Project Delivers" and Architecture Overview sections (topology diagram, boot sequence)
  - [x] 1.2 Write Project Structure section (annotated file tree matching actual src layout)
  - [x] 1.3 Write Tech Stack table, Scripts section, and Testing section
  - [x] 1.4 Write Running the Project (Option A: Standalone, Option B: Integrated via platform-runtime)
  - [x] 1.5 Write How graph-visualization Interacts with Other Components (dependency graph, runtime flow, integration points table, ShellContext mapping, events emitted/consumed)
  - [x] 1.6 Write CFMDS Artifact Layout section
  - [x] 1.7 Write Troubleshooting section
  - [x] 1.8 Write "For AI Agents" section (key invariants, file ownership map, common modification patterns)

- [x] 2. Register graph-visualization-remote in mfe-host route overlay
  - [x] 2.1 Add route overlay entry for `graph-visualization-remote` in `mfe-host/src/shell/route-overlay.ts` with `routes: ['/intelligence/graph/person/**']`, `exposedModule: './bootstrap'`, `remoteEntryType: 'module'`, and `requiredPermission: 'intelligence:graph-viewer'`
  - [x] 2.2 Update the route overlay table in `mfe-host/README.md` to include the `graph-visualization-remote` row

- [x] 3. Extend platform-runtime seed script for graph-visualization-remote artifacts
  - [x] 3.1 Add a seed step in `platform-runtime/scripts/seed-modules.sh` (or equivalent) that copies `graph-visualization/dist/` to `minio/${S3_BUCKET_CFMDS}/modules/graph-visualization-remote/0.1.0/`

- [x] 4. Add i18n translation keys for the Open Graph button
  - [x] 4.1 Add `person.profile.openGraph` key with value `"Ver Grafo de Vínculos"` to `platform-frontend/src/locales/pt-BR.json`
  - [x] 4.2 Add `person.profile.openGraph` key with value `"Open Relationship Graph"` to `platform-frontend/src/locales/en.json`

- [x] 5. Add "Open Graph" button to ProfileComponent
  - [x] 5.1 Add `openGraph()` method to `ProfileComponent` that calls `this.router.navigate(['/intelligence/graph/person', id])` guarded by a null check on `personId()`
  - [x] 5.2 Add the button element inside `<div class="page-header__actions">` using `[label]="'person.profile.openGraph' | translate"`, `icon="pi pi-share-alt"`, `[outlined]="true"`, `size="small"`, and `(click)="openGraph()"`
  - [x] 5.3 Verify the button only renders inside the `@else if (person)` block and is absent in loading, 404, 403, and error states
