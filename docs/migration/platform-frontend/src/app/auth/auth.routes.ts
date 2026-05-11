import { Routes } from '@angular/router';
import { CallbackComponent } from './pages/callback/callback.component';
import { SessionExpiredComponent } from './pages/session-expired/session-expired.component';
import { AuthErrorComponent } from './pages/auth-error/auth-error.component';

export const authRoutes: Routes = [
  { path: 'auth/callback', component: CallbackComponent },
  { path: 'auth/session-expired', component: SessionExpiredComponent },
  { path: 'auth/error', component: AuthErrorComponent },
];
