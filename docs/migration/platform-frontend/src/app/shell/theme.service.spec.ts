/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, beforeAll, afterEach, vi } from 'vitest';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

beforeAll(() => {
  // jsdom does not provide matchMedia — stub it globally
  window.matchMedia =
    window.matchMedia ||
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);

  TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
});

describe('ThemeService', () => {
  const STORAGE_KEY = 'apolo-theme';
  let service: ThemeService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('p-dark');
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem(STORAGE_KEY);
    document.documentElement.classList.remove('p-dark');
  });

  function createService(): ThemeService {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    TestBed.flushEffects();
    return service;
  }

  it('should read "dark" from localStorage and set isDark to true', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    createService();
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('p-dark')).toBe(true);
  });

  it('should read "light" from localStorage and set isDark to false', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    createService();
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('p-dark')).toBe(false);
  });

  it('should fall back to OS preference when localStorage is empty', () => {
    const original = window.matchMedia;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);

    createService();
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('p-dark')).toBe(true);

    window.matchMedia = original;
  });

  it('should toggle from light to dark', () => {
    localStorage.setItem(STORAGE_KEY, 'light');
    createService();

    service.toggle();
    TestBed.flushEffects();

    expect(service.isDark()).toBe(true);
    expect(document.documentElement.classList.contains('p-dark')).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    localStorage.setItem(STORAGE_KEY, 'dark');
    createService();

    service.toggle();
    TestBed.flushEffects();

    expect(service.isDark()).toBe(false);
    expect(document.documentElement.classList.contains('p-dark')).toBe(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('light');
  });

  it('should use OS preference via prefers-color-scheme when no stored value (light OS)', () => {
    const original = window.matchMedia;
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
    window.matchMedia = mockMatchMedia;

    createService();
    expect(service.isDark()).toBe(false);
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');

    window.matchMedia = original;
  });

  describe('standalone mode preservation', () => {
    it('should persist to localStorage when toggle is used (not host-controlled)', () => {
      localStorage.setItem(STORAGE_KEY, 'light');
      createService();

      service.toggle();
      TestBed.flushEffects();

      expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
    });
  });
});
