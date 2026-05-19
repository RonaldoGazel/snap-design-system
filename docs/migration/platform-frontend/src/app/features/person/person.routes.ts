import { Routes } from '@angular/router';

export const personRoutes: Routes = [
  // Default redirect → Dashboard
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  // ── Registration & Consolidation ──────────────────────────────────────────
  // Static route MUST precede the :id wildcard
  {
    path: 'registration',
    loadComponent: () =>
      import('./pages/person-registration/person-registration.component').then(
        (m) => m.PersonRegistrationComponent,
      ),
  },
  // ── Person Profile (canonical, live-data-backed) ──────────────────────────
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
];
