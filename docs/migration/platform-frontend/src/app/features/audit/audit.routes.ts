import { Routes } from '@angular/router';
import { AuditLogListComponent } from './pages/audit-log-list/audit-log-list.component';
import { AuditLogDetailComponent } from './pages/audit-log-detail/audit-log-detail.component';

export const auditRoutes: Routes = [
  { path: '', component: AuditLogListComponent },
  { path: ':eventId', component: AuditLogDetailComponent },
];
