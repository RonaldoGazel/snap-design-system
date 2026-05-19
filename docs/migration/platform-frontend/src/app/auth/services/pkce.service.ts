import { Injectable } from '@angular/core';
import { AuthError } from '../models/auth-errors.model';

@Injectable({ providedIn: 'root' })
export class PkceService {
  private static readonly STORAGE_KEY_VERIFIER = 'pkce_code_verifier';
  private static readonly STORAGE_KEY_STATE = 'pkce_state';
  private static readonly STORAGE_KEY_NONCE = 'pkce_nonce';

  generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const verifier = this.base64UrlEncode(array);
    sessionStorage.setItem(PkceService.STORAGE_KEY_VERIFIER, verifier);
    return verifier;
  }

  async deriveCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  generateState(): string {
    const state = crypto.randomUUID();
    sessionStorage.setItem(PkceService.STORAGE_KEY_STATE, state);
    return state;
  }

  generateNonce(): string {
    const nonce = crypto.randomUUID();
    sessionStorage.setItem(PkceService.STORAGE_KEY_NONCE, nonce);
    return nonce;
  }

  get storedState(): string | null {
    return sessionStorage.getItem(PkceService.STORAGE_KEY_STATE);
  }

  get storedNonce(): string | null {
    return sessionStorage.getItem(PkceService.STORAGE_KEY_NONCE);
  }

  get storedCodeVerifier(): string | null {
    return sessionStorage.getItem(PkceService.STORAGE_KEY_VERIFIER);
  }

  buildAuthorizationUrl(config: {
    authorizationEndpoint: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    state: string;
    nonce: string;
  }): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: 'openid',
      code_challenge: config.codeChallenge,
      code_challenge_method: 'S256',
      state: config.state,
      nonce: config.nonce,
    });
    return `${config.authorizationEndpoint}?${params.toString()}`;
  }

  async exchangeCode(
    code: string,
    codeVerifier: string,
    tokenEndpoint: string,
    redirectUri: string,
    clientId: string,
  ): Promise<Record<string, unknown>> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
      client_id: clientId,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new AuthError('invalid_grant', `Token exchange failed: ${response.status}`, errorBody);
    }

    return response.json();
  }

  validateNonce(idToken: string, expectedNonce: string): void {
    const payload = this.decodeTokenPayload(idToken);
    if (payload['nonce'] !== expectedNonce) {
      throw new AuthError('invalid_token', 'ID token nonce mismatch');
    }
  }

  validateIssuerAndAudience(idToken: string, expectedIssuer: string, expectedClientId: string): void {
    const payload = this.decodeTokenPayload(idToken);
    if (payload['iss'] !== expectedIssuer) {
      throw new AuthError('invalid_token', `Issuer mismatch: expected ${expectedIssuer}, got ${payload['iss']}`);
    }
    const aud = payload['aud'];
    const audiences = Array.isArray(aud) ? aud : [aud];
    if (!audiences.includes(expectedClientId)) {
      throw new AuthError('invalid_token', `Audience mismatch: expected ${expectedClientId} in ${JSON.stringify(audiences)}`);
    }
  }

  decodeTokenPayload(token: string): Record<string, unknown> {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new AuthError('invalid_token', 'Malformed JWT: expected 3 segments');
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    const binaryString = atob(padded);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  }

  clearPkceState(): void {
    sessionStorage.removeItem(PkceService.STORAGE_KEY_VERIFIER);
    sessionStorage.removeItem(PkceService.STORAGE_KEY_STATE);
    sessionStorage.removeItem(PkceService.STORAGE_KEY_NONCE);
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    let binary = '';
    for (const byte of buffer) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}
