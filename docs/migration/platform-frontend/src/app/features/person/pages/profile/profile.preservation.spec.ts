/**
 * @vitest-environment node
 *
 * Preservation Property Tests — Existing Relations Panel and Drawer Interactions Unchanged
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
 *
 * These tests capture the EXISTING working behavior of the template BEFORE the fix.
 * They MUST PASS on unfixed code, confirming the baseline behavior to preserve.
 *
 * Observation-first methodology:
 * - Title bar graph button navigates correctly with (click)="openGraph()" and visibility gate
 * - Clicking relation items opens the drawer (openDrawer(item) is called)
 * - Filter chips change the active filter (setRelFilter(key) is called)
 * - Search input filters relations (onRelSearch(event) is called)
 * - Drawer close button and backdrop close the drawer (closeDrawer() is called)
 * - "Abrir prontuário" button in drawer remains functional
 *
 * Approach: Template-level analysis using JSDOM to parse the HTML template and
 * verify Angular bindings on preserved elements. This avoids the need for
 * full Angular compilation while still testing the actual template content.
 */
import { describe, it, expect } from 'vitest';
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

// ── Filter keys used in the relations panel ──
const FILTER_KEYS = ['all', 'faction', 'familiar', 'advogado', 'empresa'] as const;
type RelFilterKey = (typeof FILTER_KEYS)[number];

// ══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Helper: Check if an element's outerHTML contains a specific Angular binding
 */
function hasBinding(element: Element, binding: string): boolean {
  return element.outerHTML.includes(binding);
}

/**
 * Helper: Check if a section of raw template contains a specific pattern
 */
function templateContains(pattern: string): boolean {
  return templateContent.includes(pattern);
}

/**
 * Helper: Find all filter chip buttons in the relations panel
 */
function getFilterChips(): Element[] {
  const filtersContainer = document.querySelector('.pr-right__filters');
  if (!filtersContainer) return [];
  return Array.from(filtersContainer.querySelectorAll('.pr-right__chip'));
}

/**
 * Helper: Find all relation item buttons in the grouped list
 */
function getRelationItems(): Element[] {
  const listContainer = document.querySelector('.pr-right__list');
  if (!listContainer) return [];
  return Array.from(listContainer.querySelectorAll('.pr-rel'));
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTS
// ══════════════════════════════════════════════════════════════════════════════

describe('Preservation: Existing Relations Panel and Drawer Interactions Unchanged', () => {
  // ── Requirement 3.1: Title bar graph button continues to navigate ──

  describe('Requirement 3.1: Title bar graph button preservation', () => {
    it('title bar graph button has (click)="openGraph()" binding', () => {
      // The title bar button uses pButton directive, find it by its click binding in the title bar
      const titleBarActions = document.querySelector('.pr-title-bar__actions');
      expect(titleBarActions).not.toBeNull();

      // The button with openGraph() in the title bar area
      const titleBarHtml = titleBarActions!.outerHTML;
      expect(titleBarHtml).toContain('(click)="openGraph()"');
    });

    it('title bar graph button has [disabled]="!personId()" binding', () => {
      const titleBarActions = document.querySelector('.pr-title-bar__actions');
      expect(titleBarActions).not.toBeNull();

      const titleBarHtml = titleBarActions!.outerHTML;
      expect(titleBarHtml).toContain('[disabled]="!personId()"');
    });

    it('title bar graph button is wrapped in @if (isProduction && hasGraphPermission()) gate', () => {
      // Find the title bar section in raw template and verify the @if gate
      const titleBarActionsIndex = templateContent.indexOf('pr-title-bar__actions');
      expect(titleBarActionsIndex).toBeGreaterThan(-1);

      // The openGraph button in title bar should be preceded by the permission gate
      const openGraphInTitleBar = templateContent.indexOf(
        '(click)="openGraph()"',
        titleBarActionsIndex,
      );
      expect(openGraphInTitleBar).toBeGreaterThan(-1);

      // Look backwards from the openGraph button for the @if gate
      const precedingContent = templateContent.substring(titleBarActionsIndex, openGraphInTitleBar);
      expect(precedingContent).toContain('@if (isProduction && hasGraphPermission())');
    });
  });

  // ── Requirement 3.2: Relations panel interactions preserved ──

  describe('Requirement 3.2: Relations panel search, filters, and list items preservation', () => {
    // ── Search input ──

    it('search input has (input)="onRelSearch($event)" binding', () => {
      const searchContainer = document.querySelector('.pr-right__search');
      expect(searchContainer).not.toBeNull();

      const searchInput = searchContainer!.querySelector('input');
      expect(searchInput).not.toBeNull();
      expect(hasBinding(searchInput!, '(input)="onRelSearch($event)"')).toBe(true);
    });

    it('search input has [value]="relSearch()" binding', () => {
      const searchContainer = document.querySelector('.pr-right__search');
      expect(searchContainer).not.toBeNull();

      const searchInput = searchContainer!.querySelector('input');
      expect(searchInput).not.toBeNull();
      expect(hasBinding(searchInput!, '[value]="relSearch()"')).toBe(true);
    });

    // ── Filter chips ──

    it('filter chips container exists with correct CSS class', () => {
      const filtersContainer = document.querySelector('.pr-right__filters');
      expect(filtersContainer).not.toBeNull();
    });

    it('all expected filter chips are present', () => {
      const chips = getFilterChips();
      expect(chips.length).toBe(FILTER_KEYS.length);
    });

    // ── PBT: For all filter keys, the corresponding chip has the correct setRelFilter binding ──

    it('for all filter keys, the corresponding chip has (click)="setRelFilter(key)" binding', () => {
      fc.assert(
        fc.property(fc.constantFrom(...FILTER_KEYS), (filterKey: RelFilterKey) => {
          // The template must contain a setRelFilter call for this key
          const expectedBinding = `(click)="setRelFilter('${filterKey}')"`;
          expect(templateContains(expectedBinding)).toBe(true);
        }),
        { numRuns: 20 },
      );
    });

    it('for all filter chips, the ngClass binding references relFilter() signal', () => {
      fc.assert(
        fc.property(fc.constantFrom(...FILTER_KEYS), (filterKey: RelFilterKey) => {
          // Each chip should have ngClass that checks relFilter() === 'key'
          const expectedNgClass = `relFilter() === '${filterKey}'`;
          expect(templateContains(expectedNgClass)).toBe(true);
        }),
        { numRuns: 20 },
      );
    });

    // ── Relation list items ──

    it('relation items have (click)="openDrawer(item)" binding', () => {
      const relItems = getRelationItems();
      // There should be at least the template element with the binding
      // In the raw template, the @for loop creates .pr-rel buttons with openDrawer(item)
      expect(templateContains('(click)="openDrawer(item)"')).toBe(true);
    });

    it('relation items are rendered as buttons with class "pr-rel"', () => {
      // Verify the template structure: button.pr-rel with click handler
      expect(templateContains('class="pr-rel"')).toBe(true);
    });
  });

  // ── Requirement 3.3: Drawer "Abrir prontuário" button preservation ──

  describe('Requirement 3.3: Drawer "Abrir prontuário" button preservation', () => {
    it('"Abrir prontuário" button exists in drawer actions', () => {
      const drawerActions = document.querySelector('.pr-drawer__actions');
      expect(drawerActions).not.toBeNull();

      const drawerHtml = drawerActions!.innerHTML;
      expect(drawerHtml).toContain('Abrir prontuário');
    });

    it('"Abrir prontuário" button has pr-btn--primary class', () => {
      const drawerActions = document.querySelector('.pr-drawer__actions');
      expect(drawerActions).not.toBeNull();

      const primaryBtn = drawerActions!.querySelector('.pr-btn--primary');
      expect(primaryBtn).not.toBeNull();
      expect(primaryBtn!.textContent).toContain('Abrir prontuário');
    });

    it('drawer close button has (click)="closeDrawer()" binding', () => {
      const closeBtn = document.querySelector('.pr-drawer__close');
      expect(closeBtn).not.toBeNull();
      expect(hasBinding(closeBtn!, '(click)="closeDrawer()"')).toBe(true);
    });

    it('drawer backdrop has (click)="closeDrawer()" binding', () => {
      const backdrop = document.querySelector('.pr-drawer-backdrop');
      expect(backdrop).not.toBeNull();
      expect(hasBinding(backdrop!, '(click)="closeDrawer()"')).toBe(true);
    });
  });

  // ── Requirement 3.4: personId() guard in openGraph() ──

  describe('Requirement 3.4: personId() guard preserved on title bar button', () => {
    it('title bar graph button has [disabled]="!personId()" to prevent navigation when empty', () => {
      const titleBarActions = document.querySelector('.pr-title-bar__actions');
      expect(titleBarActions).not.toBeNull();

      const titleBarHtml = titleBarActions!.outerHTML;
      expect(titleBarHtml).toContain('[disabled]="!personId()"');
    });
  });

  // ── PBT: Comprehensive preservation across all interaction types ──

  describe('PBT: All preserved interactions maintain their bindings', () => {
    /**
     * Property: For all interaction types that should be preserved,
     * the template contains the correct Angular binding.
     */
    const PRESERVED_INTERACTIONS = [
      {
        label: 'Title bar openGraph click',
        binding: '(click)="openGraph()"',
        requirement: '3.1',
      },
      {
        label: 'Title bar disabled guard',
        binding: '[disabled]="!personId()"',
        requirement: '3.4',
      },
      {
        label: 'Relation item openDrawer click',
        binding: '(click)="openDrawer(item)"',
        requirement: '3.2',
      },
      {
        label: 'Search input onRelSearch binding',
        binding: '(input)="onRelSearch($event)"',
        requirement: '3.2',
      },
      {
        label: 'Search input relSearch value binding',
        binding: '[value]="relSearch()"',
        requirement: '3.2',
      },
      {
        label: 'Drawer close button',
        binding: '(click)="closeDrawer()"',
        requirement: '3.3',
      },
      {
        label: 'Filter chip all',
        binding: '(click)="setRelFilter(\'all\')"',
        requirement: '3.2',
      },
      {
        label: 'Filter chip faction',
        binding: '(click)="setRelFilter(\'faction\')"',
        requirement: '3.2',
      },
      {
        label: 'Filter chip familiar',
        binding: '(click)="setRelFilter(\'familiar\')"',
        requirement: '3.2',
      },
      {
        label: 'Filter chip advogado',
        binding: '(click)="setRelFilter(\'advogado\')"',
        requirement: '3.2',
      },
      {
        label: 'Filter chip empresa',
        binding: '(click)="setRelFilter(\'empresa\')"',
        requirement: '3.2',
      },
    ] as const;

    it('for all preserved interactions, the template contains the correct binding', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...PRESERVED_INTERACTIONS),
          (interaction: (typeof PRESERVED_INTERACTIONS)[number]) => {
            expect(templateContains(interaction.binding)).toBe(true);
          },
        ),
        { numRuns: 50 },
      );
    });

    /**
     * Property: For all filter keys, both the click binding and the ngClass
     * active-state binding exist in the template.
     */
    it('for all filter keys, both click and active-state bindings exist', () => {
      fc.assert(
        fc.property(fc.constantFrom(...FILTER_KEYS), (filterKey: RelFilterKey) => {
          const clickBinding = `(click)="setRelFilter('${filterKey}')"`;
          const activeBinding = `relFilter() === '${filterKey}'`;
          expect(templateContains(clickBinding)).toBe(true);
          expect(templateContains(activeBinding)).toBe(true);
        }),
        { numRuns: 20 },
      );
    });

    /**
     * Property: The title bar graph button's @if gate is present and correctly formed.
     * This ensures the fix doesn't accidentally remove or alter the existing gate.
     */
    it('title bar @if gate pattern is correctly formed in template', () => {
      // The pattern: @if (isProduction && hasGraphPermission()) followed by a button with openGraph()
      const gatePattern = '@if (isProduction && hasGraphPermission())';
      const titleBarIndex = templateContent.indexOf('pr-title-bar__actions');

      // Find the first occurrence of the gate after the title bar actions div
      const gateIndex = templateContent.indexOf(gatePattern, titleBarIndex);
      expect(gateIndex).toBeGreaterThan(titleBarIndex);

      // The openGraph() binding should follow this gate
      const openGraphIndex = templateContent.indexOf('(click)="openGraph()"', gateIndex);
      expect(openGraphIndex).toBeGreaterThan(gateIndex);

      // And it should be relatively close (within the same block, ~300 chars)
      expect(openGraphIndex - gateIndex).toBeLessThan(300);
    });

    /**
     * Property: The drawer structure is preserved — backdrop, close button,
     * and actions section all exist with correct bindings.
     */
    it('drawer structural elements are all present with correct bindings', () => {
      const drawerElements = [
        { selector: '.pr-drawer-backdrop', binding: '(click)="closeDrawer()"' },
        { selector: '.pr-drawer__close', binding: '(click)="closeDrawer()"' },
        { selector: '.pr-drawer__actions', binding: null },
      ] as const;

      fc.assert(
        fc.property(
          fc.constantFrom(...drawerElements),
          (element: (typeof drawerElements)[number]) => {
            const el = document.querySelector(element.selector);
            expect(el).not.toBeNull();
            if (element.binding) {
              expect(hasBinding(el!, element.binding)).toBe(true);
            }
          },
        ),
        { numRuns: 15 },
      );
    });
  });
});
