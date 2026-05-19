import { Routes } from '@angular/router';

import { iamInitResolver } from './guards/iam-init.resolver';
import { OrgContextGuard } from './guards/org-context.guard';
import { InvitationListPage } from './pages/invitation-list/invitation-list.component';
import { AllUsersPage } from './pages/all-users/all-users.component';
import { RoleListPage } from './pages/role-list/role-list.component';
import { RoleDetailPage } from './pages/role-detail/role-detail.component';
import { GroupListPage } from './pages/group-list/group-list.component';
import { GroupDetailPage } from './pages/group-detail/group-detail.component';
import { UserListPage } from './pages/user-list/user-list.component';
import { UserDetailPage } from './pages/user-detail/user-detail.component';
import { OrganizationListPage } from './pages/organization-list/organization-list.component';
import { OrganizationDetailPage } from './pages/organization-detail/organization-detail.component';

export const iamRoutes: Routes = [
  {
    path: '',
    resolve: { init: iamInitResolver },
    children: [
      // Platform-view routes (no org context required)
      { path: 'organizations', component: OrganizationListPage },
      { path: 'organizations/:orgId', component: OrganizationDetailPage },
      { path: 'all-users', component: AllUsersPage },

      // Org-scoped routes (require non-null activeOrganizationId)
      { path: 'users', component: UserListPage, canActivate: [OrgContextGuard] },
      { path: 'users/:userId', component: UserDetailPage, canActivate: [OrgContextGuard] },
      { path: 'groups', component: GroupListPage, canActivate: [OrgContextGuard] },
      { path: 'groups/:groupId', component: GroupDetailPage, canActivate: [OrgContextGuard] },
      { path: 'roles', component: RoleListPage, canActivate: [OrgContextGuard] },
      { path: 'roles/:roleId', component: RoleDetailPage, canActivate: [OrgContextGuard] },
      { path: 'invitations', component: InvitationListPage, canActivate: [OrgContextGuard] },

      // Default redirect
      { path: '', redirectTo: 'organizations', pathMatch: 'full' },
    ],
  },
];
