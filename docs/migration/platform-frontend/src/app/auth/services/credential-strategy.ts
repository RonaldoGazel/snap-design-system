import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpRequest } from '@angular/common/http';
import { TokenStoreService } from './token-store.service';

export interface CredentialStrategy {
  attachCredentials(req: HttpRequest<unknown>): HttpRequest<unknown>;
}

export const CREDENTIAL_STRATEGY = new InjectionToken<CredentialStrategy>('CredentialStrategy');

@Injectable()
export class BearerTokenStrategy implements CredentialStrategy {
  private readonly tokenStore = inject(TokenStoreService);

  attachCredentials(req: HttpRequest<unknown>): HttpRequest<unknown> {
    const token = this.tokenStore.access;
    return req.clone({
      setHeaders: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  }
}

@Injectable()
export class BffCookieStrategy implements CredentialStrategy {
  attachCredentials(req: HttpRequest<unknown>): HttpRequest<unknown> {
    return req.clone({
      setHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    });
  }
}
