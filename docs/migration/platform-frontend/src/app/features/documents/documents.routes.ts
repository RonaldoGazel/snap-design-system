import { Routes } from '@angular/router';
import { securityLevelGuard } from '../../shared/guards/security-level.guard';

export const documentsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/document-home/document-home').then((m) => m.DocumentHomeComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./pages/document-wizard/document-wizard').then((m) => m.DocumentWizardComponent),
  },
  {
    path: 'inbox',
    loadComponent: () => import('./pages/inbox/inbox').then((m) => m.InboxComponent),
  },
  {
    path: 'inbox/document',
    loadComponent: () =>
      import('./pages/inbox/inbox-document-view/inbox-document-view').then(
        (m) => m.InboxDocumentViewComponent,
      ),
  },
  {
    path: 'reviews',
    loadComponent: () =>
      import('./pages/review-panel/review-panel').then((m) => m.ReviewPanelComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search-panel/search-panel').then((m) => m.SearchComponent),
  },
  {
    path: 'formalization/:id',
    canActivate: [securityLevelGuard],
    data: { minSecurityLevel: 3 },
    loadComponent: () =>
      import('./pages/formalization-panel/formalization-panel').then(
        (m) => m.FormalizationComponent,
      ),
  },
  {
    path: 'dissemination/:id',
    canActivate: [securityLevelGuard],
    data: { minSecurityLevel: 3 },
    loadComponent: () =>
      import('./pages/dissemination-panel/dissemination-panel').then(
        (m) => m.DisseminationComponent,
      ),
  },
  {
    path: 'apolization/:id',
    canActivate: [securityLevelGuard],
    data: { minSecurityLevel: 2 },
    loadComponent: () =>
      import('./pages/apolization-panel/apolization-panel').then((m) => m.ApolizationComponent),
  },
  {
    path: 'editor/:id',
    canActivate: [securityLevelGuard],
    data: { minSecurityLevel: 2 },
    loadComponent: () =>
      import('./pages/document-editor/document-editor').then((m) => m.DocumentEditorComponent),
  },
  {
    path: 'processes',
    canActivate: [securityLevelGuard],
    data: { minSecurityLevel: 2 },
    loadComponent: () =>
      import('./pages/process-list/process-list').then((m) => m.ProcessListComponent),
  },
  {
    path: 'processes/:id',
    canActivate: [securityLevelGuard],
    data: { minSecurityLevel: 2 },
    loadComponent: () =>
      import('./pages/process-detail/process-detail').then((m) => m.ProcessDetailComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/document-view/document-view').then((m) => m.DocumentViewComponent),
  },
];
