import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AuthStateService } from './auth-state.service';
import { User } from '../models/user.model';
import { STORAGE_KEY_TOKEN, STORAGE_KEY_USER } from '../utils/constants';

const mockUser: User = {
  id: 'u1',
  name: 'Ana Silva',
  email: 'ana@example.com',
  security_level: 2,
  role: 'COORDINATOR',
  is_active: true,
  password_reset_required: false,
  failed_login_attempts: 0,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('AuthStateService', () => {
  let service: AuthStateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // -- Initial state (empty localStorage) ---------------------------------

  it('should start with null currentUser when localStorage is empty', () => {
    expect(service.currentUser()).toBeNull();
  });

  it('should start with null token when localStorage is empty', () => {
    expect(service.token()).toBeNull();
  });

  it('should not be authenticated when no session exists', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should return null userRole when no user is set', () => {
    expect(service.userRole()).toBeNull();
  });

  it('should return 0 userSecurityLevel when no user is set', () => {
    expect(service.userSecurityLevel()).toBe(0);
  });

  // -- setSession ---------------------------------------------------------

  it('setSession() should update signals', () => {
    service.setSession(mockUser, 'tok-123');

    expect(service.currentUser()).toEqual(mockUser);
    expect(service.token()).toBe('tok-123');
    expect(service.isAuthenticated()).toBe(true);
  });

  it('setSession() should persist to localStorage', () => {
    service.setSession(mockUser, 'tok-123');

    expect(localStorage.getItem(STORAGE_KEY_TOKEN)).toBe('tok-123');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_USER)!)).toEqual(mockUser);
  });

  // -- clearSession -------------------------------------------------------

  it('clearSession() should reset signals to null', () => {
    service.setSession(mockUser, 'tok-123');
    service.clearSession();

    expect(service.currentUser()).toBeNull();
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('clearSession() should remove items from localStorage', () => {
    service.setSession(mockUser, 'tok-123');
    service.clearSession();

    expect(localStorage.getItem(STORAGE_KEY_TOKEN)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY_USER)).toBeNull();
  });

  // -- getToken -----------------------------------------------------------

  it('getToken() should return current token value', () => {
    service.setSession(mockUser, 'tok-abc');
    expect(service.getToken()).toBe('tok-abc');
  });

  it('getToken() should return null when no session', () => {
    expect(service.getToken()).toBeNull();
  });

  // -- Computed signals ---------------------------------------------------

  it('userRole should reflect current user role', () => {
    service.setSession(mockUser, 'tok-123');
    expect(service.userRole()).toBe('COORDINATOR');
  });

  it('userSecurityLevel should reflect current user security level', () => {
    service.setSession(mockUser, 'tok-123');
    expect(service.userSecurityLevel()).toBe(2);
  });

  it('isAuthenticated should be false when only token is set', () => {
    service.token.set('tok-only');
    expect(service.isAuthenticated()).toBe(false);
  });

  it('isAuthenticated should be false when only user is set', () => {
    service.currentUser.set(mockUser);
    expect(service.isAuthenticated()).toBe(false);
  });

  // -- hasRole ------------------------------------------------------------

  it('hasRole() should return true when user has one of the given roles', () => {
    service.setSession(mockUser, 'tok-123');
    expect(service.hasRole('ADMIN', 'COORDINATOR')).toBe(true);
  });

  it('hasRole() should return false when user does not have any of the given roles', () => {
    service.setSession(mockUser, 'tok-123');
    expect(service.hasRole('ADMIN', 'CHIEF')).toBe(false);
  });

  it('hasRole() should return false when no user is set', () => {
    expect(service.hasRole('ADMIN')).toBe(false);
  });

  // -- hasMinSecurityLevel ------------------------------------------------

  it('hasMinSecurityLevel() should return true when user level >= required', () => {
    service.setSession(mockUser, 'tok-123');
    expect(service.hasMinSecurityLevel(2)).toBe(true);
    expect(service.hasMinSecurityLevel(1)).toBe(true);
  });

  it('hasMinSecurityLevel() should return false when user level < required', () => {
    service.setSession(mockUser, 'tok-123');
    expect(service.hasMinSecurityLevel(3)).toBe(false);
  });

  it('hasMinSecurityLevel() should return false when no user (level defaults to 0)', () => {
    expect(service.hasMinSecurityLevel(1)).toBe(false);
  });
});
