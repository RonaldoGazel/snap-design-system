import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';
import { authRoutes } from './auth/auth.routes';
import { ShellComponent } from './shell/shell';

export const routes: Routes = [
  ...authRoutes,
  {
    path: '',
    component: ShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'intelligence/person', pathMatch: 'full' },
      { path: 'snap', redirectTo: 'intelligence/snap', pathMatch: 'prefix' },
      {
        path: 'intelligence',
        children: [
          { path: '', redirectTo: 'person', pathMatch: 'full' },
          {
            path: 'person',
            loadChildren: () =>
              import('./features/person/person.routes').then((m) => m.personRoutes),
          },
          {
            path: 'documents',
            loadChildren: () =>
              import('./features/documents/documents.routes').then((m) => m.documentsRoutes),
          },
          {
            path: 'workflows',
            loadChildren: () =>
              import('./features/workflows/workflows.routes').then((m) => m.workflowsRoutes),
          },
          {
            path: 'snap',
            loadChildren: () => import('./features/snap/snap.routes').then((m) => m.snapRoutes),
          },
        ],
      },
      { path: 'audit-logs', redirectTo: 'admin/audit-logs', pathMatch: 'prefix' },
      {
        path: 'admin',
        children: [
          {
            path: '',
            loadChildren: () => import('./features/iam/iam.routes').then((m) => m.iamRoutes),
          },
          {
            path: 'audit-logs',
            loadChildren: () => import('./features/audit/audit.routes').then((m) => m.auditRoutes),
          },
          {
            path: 'tasks',
            loadChildren: () => import('./features/tasks/tasks.routes').then((m) => m.tasksRoutes),
          },
        ],
      },
    ],
  },
];
