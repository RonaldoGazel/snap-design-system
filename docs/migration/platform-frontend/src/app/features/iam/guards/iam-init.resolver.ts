import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';

import { ActiveOrgService } from '../services/active-org.service';

/**
 * Route resolver that ensures ActiveOrgService is initialized before any
 * guarded page loads. Delegates to ensureInitialized() which deduplicates
 * concurrent calls (e.g. when OrgContextGuard already triggered it).
 *
 * Attached to the parent route so it runs once when entering /admin/* and
 * /intelligence/workflows/*.
 */
export const iamInitResolver: ResolveFn<boolean> = async () => {
  const activeOrg = inject(ActiveOrgService);
  await activeOrg.ensureInitialized();
  return true;
};
