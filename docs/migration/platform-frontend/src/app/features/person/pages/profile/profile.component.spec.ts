/**
 * @vitest-environment node
 *
 * Bug Condition Exploration Test — Graph Buttons Missing Click Handlers and Visibility Gate
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4**
 *
 * This test is EXPECTED TO FAIL on unfixed code. Failure confirms the bug exists:
 * - Buttons have no (click)="openGraph()" binding
 * - Buttons are visible without permission gate (@if)
 * - Buttons lack [disabled]="!personId()" binding
 *
 * Approach: Template-level analysis using JSDOM to parse the HTML template and
 * verify Angular bindings on the three graph buttons. This avoids the need for
 * full Angular compilation while still testing the actual template content.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fc from 'fast-check';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

// ── Load the actual template file ──
const TEMPLATE_PATH = resolve(__dirname, 'profile.component.html');
const templateContent = readFileSync(TEMPLATE_PATH, 'utf-8');

// ── Parse template with JSDOM for DOM queries ──
const dom = new JSDOM(`<body>${templateContent}</body>`);
const document = dom.window.document;

// ── Button selectors under test ──
const BUTTON_SELECTORS = [
  { selector: '.pr-right__graph', label: 'Panel header "Grafo" button', requirement: '1.1' },
  { selector: '.pr-right__see-more', label: 'Panel footer "Ver grafo" button', requirement: '1.2' },
  {
    selector: '.pr-drawer__actions .pr-btn--ghost',
    label: 'Drawer "Ver no grafo" button',
    requirement: '1.3',
  },
] as const;

/**
 * Helper: Check if a button element has a (click) binding containing openGraph()
 */
function hasClickOpenGraph(button: Element): boolean {
  // Angular click bindings appear as attributes in the raw template
  // Check for (click)="openGraph()" in the element's outer HTML
  const outerHtml = button.outerHTML;
  return outerHtml.includes('(click)="openGraph()"');
}

/**
 * Helper: Check if a button element has [disabled]="!personId()" binding
 */
function hasDisabledBinding(button: Element): boolean {
  const outerHtml = button.outerHTML;
  return outerHtml.includes('[disabled]="!personId()"');
}

/**
 * Helper: Check if a button is wrapped in @if (isProduction && hasGraphPermission())
 * by searching the raw template text for the pattern near the button.
 */
function isWrappedInPermissionGate(selector: string): boolean {
  // Find the button in the raw template and check if it's near the @if gate
  const searchTerm =
    selector === '.pr-drawer__actions .pr-btn--ghost'
      ? 'pr-drawer__actions'
      : selector.replace('.', '');
  const buttonIndex = templateContent.indexOf(searchTerm);

  if (buttonIndex === -1) return false;

  // For the drawer button, the @if gate is inside the container (after the div opening),
  // so we look forward. For other buttons, the @if gate precedes them.
  if (selector === '.pr-drawer__actions .pr-btn--ghost') {
    const followingContent = templateContent.substring(buttonIndex, buttonIndex + 500);
    return followingContent.includes('@if (isProduction && hasGraphPermission())');
  }

  // Look backwards from the button for the @if gate within a reasonable range (500 chars)
  const precedingContent = templateContent.substring(Math.max(0, buttonIndex - 500), buttonIndex);
  return precedingContent.includes('@if (isProduction && hasGraphPermission())');
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Bug Condition Exploration: Graph Buttons Missing Click Handlers and Visibility Gate', () => {
  // ── Property 1: Click handlers must invoke openGraph() ──
  // **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3**

  describe('Property 1: Each graph button must have a (click)="openGraph()" binding', () => {
    it('Panel header "Grafo" button (.pr-right__graph) should have (click)="openGraph()"', () => {
      const button = document.querySelector('.pr-right__graph');
      expect(button).not.toBeNull();
      expect(hasClickOpenGraph(button!)).toBe(true);
    });

    it('Panel footer "Ver grafo" button (.pr-right__see-more) should have (click)="openGraph()"', () => {
      const button = document.querySelector('.pr-right__see-more');
      expect(button).not.toBeNull();
      expect(hasClickOpenGraph(button!)).toBe(true);
    });

    it('Drawer "Ver no grafo" button (.pr-drawer__actions .pr-btn--ghost) should have (click)="openGraph()"', () => {
      const button = document.querySelector('.pr-drawer__actions .pr-btn--ghost');
      expect(button).not.toBeNull();
      expect(hasClickOpenGraph(button!)).toBe(true);
    });
  });

  // ── Property 2: Visibility gate — buttons wrapped in @if ──
  // **Validates: Requirements 2.4**

  describe('Property 2: Each graph button must be wrapped in @if (isProduction && hasGraphPermission())', () => {
    it('.pr-right__graph button should be gated by @if (isProduction && hasGraphPermission())', () => {
      expect(isWrappedInPermissionGate('.pr-right__graph')).toBe(true);
    });

    it('.pr-right__see-more button should be gated by @if (isProduction && hasGraphPermission())', () => {
      expect(isWrappedInPermissionGate('.pr-right__see-more')).toBe(true);
    });

    it('.pr-drawer__actions .pr-btn--ghost button should be gated by @if (isProduction && hasGraphPermission())', () => {
      expect(isWrappedInPermissionGate('.pr-drawer__actions .pr-btn--ghost')).toBe(true);
    });
  });

  // ── Property 3: Disabled guard — buttons have [disabled]="!personId()" ──
  // **Validates: Requirements 2.1, 2.2, 2.3**

  describe('Property 3: Each graph button must have [disabled]="!personId()" binding', () => {
    it('.pr-right__graph button should have [disabled]="!personId()"', () => {
      const button = document.querySelector('.pr-right__graph');
      expect(button).not.toBeNull();
      expect(hasDisabledBinding(button!)).toBe(true);
    });

    it('.pr-right__see-more button should have [disabled]="!personId()"', () => {
      const button = document.querySelector('.pr-right__see-more');
      expect(button).not.toBeNull();
      expect(hasDisabledBinding(button!)).toBe(true);
    });

    it('.pr-drawer__actions .pr-btn--ghost button should have [disabled]="!personId()"', () => {
      const button = document.querySelector('.pr-drawer__actions .pr-btn--ghost');
      expect(button).not.toBeNull();
      expect(hasDisabledBinding(button!)).toBe(true);
    });
  });

  // ── Property-Based Test: Bug condition across all button selectors ──
  // **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4**

  describe('PBT: Bug condition holds for all graph button selectors', () => {
    it('for any graph button selector, the button must have (click)="openGraph()" binding', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '.pr-right__graph',
            '.pr-right__see-more',
            '.pr-drawer__actions .pr-btn--ghost',
          ),
          (selector) => {
            const button = document.querySelector(selector);
            expect(button).not.toBeNull();
            expect(hasClickOpenGraph(button!)).toBe(true);
          },
        ),
        { numRuns: 30 },
      );
    });

    it('for any graph button selector, the button must be wrapped in permission gate', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '.pr-right__graph',
            '.pr-right__see-more',
            '.pr-drawer__actions .pr-btn--ghost',
          ),
          (selector) => {
            expect(isWrappedInPermissionGate(selector)).toBe(true);
          },
        ),
        { numRuns: 30 },
      );
    });

    it('for any graph button selector, the button must have [disabled]="!personId()" binding', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '.pr-right__graph',
            '.pr-right__see-more',
            '.pr-drawer__actions .pr-btn--ghost',
          ),
          (selector) => {
            const button = document.querySelector(selector);
            expect(button).not.toBeNull();
            expect(hasDisabledBinding(button!)).toBe(true);
          },
        ),
        { numRuns: 30 },
      );
    });
  });
});
