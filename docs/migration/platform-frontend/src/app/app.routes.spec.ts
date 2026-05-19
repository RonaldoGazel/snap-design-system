/**
 * @vitest-environment jsdom
 * Feature: mfe-removal
 * Property 1: Route resolution completeness
 * Validates: Requirements 3.3, 10.2
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { routes } from './app.routes';

describe('app.routes — route resolution completeness', () => {
  it('should resolve all known application routes to a non-null route config', () => {
    const knownRoutes = [
      '/snap',
      '/audit-logs',
      '/intelligence/person',
      '/intelligence/documents',
      '/intelligence/workflows',
      '/admin',
      '/admin/tasks',
    ];

    fc.assert(
      fc.property(fc.constantFrom(...knownRoutes), (path) => {
        // The route tree must contain a matching route for every known path
        const segments = path.split('/').filter(Boolean);
        const topLevel = segments[0];

        // Find the shell route (the one with a component and children)
        const shellRoute = routes.find((r) => r.component !== undefined && r.children);
        expect(shellRoute).toBeDefined();

        const childRoutes = shellRoute!.children ?? [];

        // Match either a top-level child path or a two-segment path
        const matchingChild = childRoutes.find(
          (r) => r.path === topLevel || r.path === segments.slice(0, 2).join('/'),
        );

        expect(matchingChild).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});
