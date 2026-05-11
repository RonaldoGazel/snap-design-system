import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ActiveOrgService } from '../services/active-org.service';

export const OrgContextGuard: CanActivateFn = async () => {
  const activeOrg = inject(ActiveOrgService);
  const router = inject(Router);

  // Ensure ActiveOrgService is initialized before evaluating org context.
  // The guard runs before the iamInitResolver, so on a fresh page load (e.g. F5)
  // the service may not be initialized yet — calling ensureInitialized() here
  // prevents a premature redirect based on uninitialized signal defaults.
  await activeOrg.ensureInitialized();

  if (activeOrg.activeOrganizationId() !== null) {
    return true;
  }

  // Platform Admin with no org selected → auto-switch to own org (SNAP)
  // so they can access org-scoped pages immediately
  if (activeOrg.isPlatformAdmin()) {
    const ownOrgId = activeOrg.userOrganizationId();
    const ownOrgName = activeOrg.userOrganizationName();
    if (ownOrgId && ownOrgName) {
      activeOrg.switchOrg(ownOrgId, ownOrgName);
      return true;
    }
    // Fallback: no own org, redirect to organizations
    return router.createUrlTree(['/admin/organizations']);
  }

  // Org Admin should always have an org — if somehow null, redirect to home
  return router.createUrlTree(['/']);
};
