import { InjectionToken } from '@angular/core';

export interface TokenProvider {
  getAccessToken(): Promise<string | null>;
  isAuthenticated(): boolean;
}

export const TOKEN_PROVIDER = new InjectionToken<TokenProvider>('TokenProvider');
