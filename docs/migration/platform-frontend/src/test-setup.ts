import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

// jsdom does not provide matchMedia — stub it globally
if (typeof window !== 'undefined') {
  window.matchMedia =
    window.matchMedia ||
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList);
}

// Initialize Angular's TestBed environment once for all tests
TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
