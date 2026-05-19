import { Routes } from '@angular/router';
import { iamInitResolver } from '../iam/guards/iam-init.resolver';
import { OrgContextGuard } from '../iam/guards/org-context.guard';

export const workflowsRoutes: Routes = [
  {
    path: '',
    resolve: { init: iamInitResolver },
    canActivate: [OrgContextGuard],
    children: [
      { path: '', redirectTo: 'visual-bpms', pathMatch: 'full' },

      // Visual BPMS (flow builder)
      {
        path: 'visual-bpms',
        loadComponent: () =>
          import('./visual-bpms/visual-flow-list/visual-flow-list').then(
            (m) => m.VisualFlowListComponent,
          ),
      },
      {
        path: 'visual-bpms/new',
        loadComponent: () =>
          import('./visual-bpms/visual-flow-form/visual-flow-form').then(
            (m) => m.VisualFlowFormComponent,
          ),
      },
      {
        path: 'visual-bpms/:id',
        loadComponent: () =>
          import('./visual-bpms/visual-flow-builder/visual-flow-builder').then(
            (m) => m.VisualFlowBuilderComponent,
          ),
      },
      {
        path: 'visual-bpms/:id/edit',
        loadComponent: () =>
          import('./visual-bpms/visual-flow-form/visual-flow-form').then(
            (m) => m.VisualFlowFormComponent,
          ),
      },

      // Flows (definition-based)
      {
        path: 'flows',
        loadComponent: () =>
          import('./flows/flow-list/flow-list').then((m) => m.FlowListComponent),
      },
      {
        path: 'flows/new',
        loadComponent: () =>
          import('./flows/flow-form/flow-form').then((m) => m.FlowFormComponent),
      },
      {
        path: 'flows/:id',
        loadComponent: () =>
          import('./flows/flow-detail/flow-detail').then((m) => m.FlowDetailComponent),
      },

      // Org structure
      {
        path: 'org-structure',
        loadComponent: () =>
          import('./org-structure/org-tree/org-tree').then((m) => m.OrgTreeComponent),
      },
      {
        path: 'org-structure/:id',
        loadComponent: () =>
          import('./org-structure/org-unit-detail/org-unit-detail').then(
            (m) => m.OrgUnitDetailComponent,
          ),
      },

      // Step catalog
      {
        path: 'step-catalog',
        loadComponent: () =>
          import('./step-catalog/step-catalog-list/step-catalog-list').then(
            (m) => m.StepCatalogListComponent,
          ),
      },
      {
        path: 'step-catalog/new',
        loadComponent: () =>
          import('./step-catalog/step-catalog-form/step-catalog-form').then(
            (m) => m.StepCatalogFormComponent,
          ),
      },
      {
        path: 'step-catalog/:id',
        loadComponent: () =>
          import('./step-catalog/step-catalog-form/step-catalog-form').then(
            (m) => m.StepCatalogFormComponent,
          ),
      },

      // Document types
      {
        path: 'document-types',
        loadComponent: () =>
          import('./doc-types/doc-type-list/doc-type-list').then((m) => m.DocTypeListComponent),
      },
      {
        path: 'document-types/new',
        loadComponent: () =>
          import('./doc-types/doc-type-form/doc-type-form').then((m) => m.DocTypeFormComponent),
      },
      {
        path: 'document-types/:id',
        loadComponent: () =>
          import('./doc-types/doc-type-form/doc-type-form').then((m) => m.DocTypeFormComponent),
      },

      // Templates
      {
        path: 'templates',
        loadComponent: () =>
          import('./templates/template-list/template-list').then((m) => m.TemplateListComponent),
      },
      {
        path: 'templates/new',
        loadComponent: () =>
          import('./templates/template-form/template-form').then((m) => m.TemplateFormComponent),
      },
      {
        path: 'templates/:id',
        loadComponent: () =>
          import('./templates/template-form/template-form').then((m) => m.TemplateFormComponent),
      },

      // Processes
      {
        path: 'processes',
        loadComponent: () =>
          import('./processes/process-list/process-list').then((m) => m.ProcessListComponent),
      },
      {
        path: 'processes/new',
        loadComponent: () =>
          import('./processes/process-form/process-form').then((m) => m.ProcessFormComponent),
      },
      {
        path: 'processes/:id',
        loadComponent: () =>
          import('./processes/process-detail/process-detail').then(
            (m) => m.ProcessDetailComponent,
          ),
      },

      // Documents
      {
        path: 'documents',
        loadComponent: () =>
          import('./documents/document-list/document-list').then((m) => m.DocumentListComponent),
      },
      {
        path: 'documents/new',
        loadComponent: () =>
          import('./documents/document-instance/document-instance').then(
            (m) => m.DocumentInstanceComponent,
          ),
      },
      {
        path: 'documents/:id',
        loadComponent: () =>
          import('./documents/document-instance/document-instance').then(
            (m) => m.DocumentInstanceComponent,
          ),
      },

      // Pending tasks
      {
        path: 'pending-tasks',
        loadComponent: () =>
          import('./pending-tasks/pending-task-list/pending-task-list').then(
            (m) => m.PendingTaskListComponent,
          ),
      },
    ],
  },
];
