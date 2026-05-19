import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { Role } from '../models/enums';
import { AuthStateService } from '../services/auth-state.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Role[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  if (authState.hasRole(...allowedRoles)) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
