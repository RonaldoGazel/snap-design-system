import { Injectable, computed, signal } from '@angular/core';

import { User } from '../models/user.model';
import { STORAGE_KEY_TOKEN, STORAGE_KEY_USER } from '../utils/constants';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  readonly currentUser = signal<User | null>(this.loadUser());
  readonly token = signal<string | null>(this.loadToken());

  readonly isAuthenticated = computed(() => this.token() !== null && this.currentUser() !== null);
  readonly userRole = computed(() => this.currentUser()?.role ?? null);
  readonly userSecurityLevel = computed(() => this.currentUser()?.security_level ?? 0);

  setSession(user: User, token: string): void {
    this.currentUser.set(user);
    this.token.set(token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
  }

  clearSession(): void {
    this.currentUser.set(null);
    this.token.set(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  }

  getToken(): string | null {
    return this.token();
  }

  hasRole(...roles: string[]): boolean {
    const role = this.currentUser()?.role;
    return role != null && roles.includes(role);
  }

  hasMinSecurityLevel(level: number): boolean {
    return this.userSecurityLevel() >= level;
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USER);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  }

  private loadToken(): string | null {
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }
}
