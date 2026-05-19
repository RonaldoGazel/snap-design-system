import { Injectable, inject } from '@angular/core';

import { AuthService } from './auth.service';
import { TokenProvider } from './token-provider';

@Injectable()
export class StandaloneTokenProvider implements TokenProvider {
  private readonly authService = inject(AuthService);

  getAccessToken(): Promise<string | null> {
    return Promise.resolve(this.authService.getAccessToken());
  }

  isAuthenticated(): boolean {
    return this.authService.snapshot.status === 'authenticated';
  }
}
