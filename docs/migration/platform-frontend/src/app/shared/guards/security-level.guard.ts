import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthStateService } from '../services/auth-state.service';

export const securityLevelGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const minLevel = route.data['minSecurityLevel'] as number | undefined;

  if (minLevel == null) {
    return true;
  }

  if (authState.hasMinSecurityLevel(minLevel)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
