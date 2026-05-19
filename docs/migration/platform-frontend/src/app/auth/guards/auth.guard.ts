import { Injectable, inject } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly auth = inject(AuthService);

  async canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    const snapshot = this.auth.snapshot;

    if (snapshot.status === 'initializing') {
      // Wait for initialization to complete
      await firstValueFrom(
        this.auth.sessionState$.pipe(filter((s) => s.status !== 'initializing')),
      );
    }

    const current = this.auth.snapshot;
    if (current.status === 'authenticated') {
      return true;
    }

    this.auth.login(state.url);
    return false;
  }
}
