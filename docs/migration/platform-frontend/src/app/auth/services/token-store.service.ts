import { Injectable } from '@angular/core';

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  id_token: string;
}

@Injectable({ providedIn: 'root' })
export class TokenStoreService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private idToken: string | null = null;
  private _sessionStart: number | null = null;
  private _isStale = false;
  private _generation = 0;
  private _authSessionId: string | null = null;

  store(tokens: TokenSet): void {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    this.idToken = tokens.id_token;

    if (this._sessionStart === null) {
      this._sessionStart = Date.now();
      this._authSessionId = crypto.randomUUID();
    }

    this._generation++;
  }

  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.idToken = null;
    this._sessionStart = null;
    this._isStale = false;
    this._generation = 0;
    this._authSessionId = null;
  }

  markStale(): void {
    this._isStale = true;
  }

  clearStale(): void {
    this._isStale = false;
  }

  get access(): string | null {
    return this.accessToken;
  }

  get refresh(): string | null {
    return this.refreshToken;
  }

  get id(): string | null {
    return this.idToken;
  }

  get sessionStart(): number | null {
    return this._sessionStart;
  }

  get hasTokens(): boolean {
    return this.accessToken !== null;
  }

  get isStale(): boolean {
    return this._isStale;
  }

  get generation(): number {
    return this._generation;
  }

  get authSessionId(): string | null {
    return this._authSessionId;
  }
}
