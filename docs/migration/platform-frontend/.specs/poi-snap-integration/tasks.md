# Implementation Plan: POI SNAP Integration

## Overview

Incremental implementation of the POI SNAP feature into platform-frontend, covering: ApoloPreset theme, ThemeService, Shell layout (sidebar, header, breadcrumb, user menu), SNAP search page with PoiServiceClient, multi-origin AuthInterceptor, audit adaptation, i18n, route configuration, and visual asset porting. Each task builds on the previous, with property-based tests validating correctness properties from the design document.

## Tasks

- [ ] 1. Create ApoloPreset and ThemeService (foundation layer)
  - [x] 1.1 Create ApoloPreset custom PrimeNG theme preset
    - Create `src/app/themes/apolo-preset.ts` using `definePreset()` with Aura base
    - Define primary (steel/blue-gray), surface (gray-brand), danger, info, success, warn palettes in OKLCH format
    - Update `app.config.ts` to use `ApoloPreset` instead of `Aura` in `providePrimeNG`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [ ] 1.2 (optional) Write property test: ApoloPreset OKLCH format (Property 13)
    - **Property 13: ApoloPreset color tokens use OKLCH format**
    - Iterate all primary and surface palette entries, assert each value matches `oklch(...)` pattern
    - **Validates: Requirements 9.2, 9.4**

  - [x] 1.3 Implement ThemeService
    - Create `src/app/shell/theme.service.ts` with `isDark` WritableSignal
    - Implement `toggle()` method: flip `isDark`, add/remove `p-dark` class on `<html>`, persist to localStorage key `apolo-theme`
    - Implement initialization: read localStorage, OS preference fallback via `prefers-color-scheme`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 1.4 (optional) Write property tests for ThemeService (Properties 6, 7)
    - **Property 6: Theme toggle flips isDark and updates p-dark class**
    - **Property 7: Theme persistence round-trip**
    - **Validates: Requirements 4.4, 5.2, 5.3, 5.4**

- [ ] 2. Implement SidebarService and navigation models
  - [x] 2.1 Create sidebar navigation models
    - Create `src/app/shell/sidebar/sidebar.model.ts` with `NavItem` and `NavSection` interfaces
    - _Requirements: 3.1_

  - [x] 2.2 Implement SidebarService
    - Create `src/app/shell/sidebar/sidebar.service.ts` with signals: `mode`, `isHovered`, `openSections`, `isExpanded`, `isPinned`, `effectiveWidth`
    - Implement methods: `togglePin()`, `collapse()`, `cycleMode()`, `setHovered()`, `toggleSection()`
    - Define static `sections` signal with Intelligence (SNAP Search) and Administration (Audit) navigation data
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 3.1_

  - [ ] 2.3 (optional) Write property tests for SidebarService (Properties 1-5)
    - **Property 1: Sidebar effective width follows mode and hover state**
    - **Property 2: togglePin is a round-trip between pinned and auto**
    - **Property 3: collapse always sets mode to collapsed**
    - **Property 4: cycleMode follows the defined sequence**
    - **Property 5: Section toggle is a round-trip**
    - **Validates: Requirements 1.2, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 3.4**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement Shell layout components
  - [x] 4.1 Implement SidebarComponent
    - Create `src/app/shell/sidebar/sidebar.ts`, `sidebar.html`, `sidebar.scss`
    - Render navigation sections from `SidebarService.sections`, with expand/collapse per section
    - Implement three display modes: pinned (280px static), auto (expand on hover with floating style), collapsed (64px icons only)
    - Add pin button (thumbtack), collapse button (chevron-double-left), hamburger button (collapsed mode)
    - Display `snap-black.svg` / `snap-white.svg` based on `ThemeService.isDark()`
    - Apply `routerLinkActive` for active item highlighting
    - Show section icons with tooltips when collapsed, labels and chevrons when expanded
    - _Requirements: 2.1-2.8, 3.1-3.6, 8.2_

  - [ ] 4.2 (optional) Write property test: Sidebar logo matches theme (Property 12)
    - **Property 12: Sidebar logo matches theme**
    - **Validates: Requirements 8.2**

  - [x] 4.3 Implement BreadcrumbService and BreadcrumbComponent
    - Create `src/app/shell/breadcrumb/breadcrumb.service.ts` with `overrides` signal, `setOverride()`, `clearOverride()`, `getLabel()` methods
    - Create `src/app/shell/breadcrumb/breadcrumb.ts`, `breadcrumb.html` - generate items from URL segments, map known segments to labels, use separator, last item as plain text
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 4.4 (optional) Write property tests for Breadcrumb (Properties 8, 9, 10)
    - **Property 8: Breadcrumb generates correct items from URL segments**
    - **Property 9: Breadcrumb last item is non-navigable**
    - **Property 10: Breadcrumb label override round-trip**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.5**

  - [x] 4.5 Implement HeaderComponent
    - Create `src/app/shell/header/header.ts`, `header.html`, `header.scss`
    - Display `logo_seap_rio.png`, brand name, subtitle on left; `p-toggleswitch` for theme on right
    - Fixed height 64px, bottom border, flex row layout
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 8.3_

  - [x] 4.6 Implement UserMenuComponent
    - Create `src/app/shell/user-menu/user-menu.ts`, `user-menu.html`
    - Read user from `AuthService` session state, compute initials from name
    - Expanded: show avatar (initials), full name, role, popup menu with "Sign Out"
    - Collapsed: show avatar only with tooltip
    - "Sign Out" calls `AuthService.logout()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ] 4.7 (optional) Write property test: User initials computation (Property 11)
    - **Property 11: User initials computation**
    - Extract initials function as a pure function for testability
    - **Validates: Requirements 7.5**

  - [x] 4.8 Implement ShellComponent
    - Create `src/app/shell/shell.ts`, `shell.html`, `shell.scss`
    - Compose Sidebar, Header, Breadcrumb, `<router-outlet />`, `p-toast`, `p-confirmdialog`
    - Dynamic `margin-left` via `computed(() => sidebarService.isPinned() ? 280 : 64)`
    - Flex row layout, `height: 100vh`, scroll only on `.shell__content`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 4.9 (optional) Write unit tests for Shell layout
    - Test Shell renders Sidebar, Header, Breadcrumb, router-outlet
    - Test Shell includes p-toast and p-confirmdialog
    - Test Sidebar displays correct navigation sections
    - Test Header displays logo, brand name, subtitle and contains p-toggleswitch
    - _Requirements: 1.1, 1.5, 3.1, 4.1, 4.2_

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement SNAP Search feature
  - [x] 6.1 Create POI data models
    - Create `src/app/features/snap/models/poi.model.ts` with `GeneratePersonRequest`, `GeneratePersonResponse`, `SnapSearchErrorCode`, `SnapSearchError` types
    - _Requirements: 12.2_

  - [x] 6.2 Implement PoiServiceClient
    - Create `src/app/features/snap/services/poi-service-client.ts`
    - Implement `generatePerson(cpf: string): Observable<GeneratePersonResponse>` - strip non-numeric chars, POST to `{apiGatewayUrl}/api/v1/poi/generate-person`
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 6.3 (optional) Write property test: POI client strips non-numeric (Property 16)
    - **Property 16: POI service client strips non-numeric characters**
    - **Validates: Requirements 10.4, 12.3**

  - [x] 6.4 Implement CPF formatting utility
    - Create a pure CPF formatting function (mask `000.000.000-00`) for use in SnapSearchPage
    - _Requirements: 10.2_

  - [ ] 6.5 (optional) Write property test: CPF formatting mask (Property 14)
    - **Property 14: CPF formatting mask**
    - **Validates: Requirements 10.2**

  - [x] 6.6 Implement SnapSearchPage
    - Create `src/app/features/snap/pages/snap-search/snap-search.ts`, `snap-search.html`, `snap-search.scss`
    - Signals: `cpfInput`, `cpfDigits` (computed), `isValid` (computed, 11 digits), `loading`, `result`, `error`
    - CPF input with auto-formatting mask, search button disabled until valid
    - Search flow: validate, call PoiServiceClient, display `GeneratePersonResponse` or map HTTP error to `SnapSearchError`
    - Error mapping: 400=badRequest, 403=forbidden, 404=notFound, 503=serviceUnavailable (retryable), network=networkError (retryable)
    - Display errors via `p-message`, success result with report_name, file_path, bucket
    - Loading spinner and disabled button during request
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 6.7 Create SNAP lazy-loaded routes
    - Create `src/app/features/snap/snap.routes.ts` with default route loading `SnapSearchPage`
    - _Requirements: 14.2_

  - [ ] 6.8 (optional) Write property tests for SNAP Search (Properties 15, 17, 18)
    - **Property 15: CPF validation gates search**
    - **Property 17: Successful response displays all fields**
    - **Property 18: Error messages do not expose technical details**
    - **Validates: Requirements 10.3, 10.6, 10.7, 11.6**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Multi-origin AuthInterceptor and environment configuration
  - [x] 8.1 Add `trustedOrigins` to environment configuration
    - Add `trustedOrigins: ['http://localhost:8080']` to `src/environments/environment.ts`
    - Keep `apiGatewayUrl` for backward compatibility (used by AuditLogService, PoiServiceClient)
    - Add `trustedOrigins` to `environment.prod.ts` if it exists
    - _Requirements: 16.1, 16.4, 16.6_

  - [x] 8.2 Refactor AuthInterceptor to use trustedOrigins whitelist
    - Replace single-origin check (`apiGatewayUrl`) with whitelist-based check using `environment.trustedOrigins`
    - Extract request origin, check against `trustedOrigins.some(...)`, skip credential attachment if not trusted
    - Preserve all existing logic: token refresh, 401 retry, replay backpressure, credential redaction
    - Update existing `auth.interceptor.spec.ts` to reflect the new origin check logic
    - **Security note:** This change modifies authentication logic and requires security review before merge per [SEC-001]
    - _Requirements: 16.2, 16.3, 16.5_

  - [ ] 8.3 (optional) Write property test: Trusted origins credential attachment (Property 20)
    - **Property 20: Trusted origins credential attachment**
    - Generate random URLs x random trustedOrigins arrays, verify token attached iff origin is trusted
    - Include adversarial origins: substrings of trusted origins, different ports/protocols
    - **Validates: Requirements 16.2, 16.3**

- [ ] 9. Route configuration and audit adaptation
  - [x] 9.1 Restructure app routes with Shell as parent layout
    - Update `src/app/app.routes.ts`: Shell as layout for protected routes, `/snap` and `/audit-logs` as Shell children
    - Default route (`/`) redirects to `/snap`
    - Auth routes (`/auth/`) remain outside Shell
    - Wildcard redirects to `/`
    - Remove `WelcomeComponent` route (replaced by Shell + SNAP redirect)
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 13.1, 13.2_

  - [ ] 9.2 (optional) Write unit tests for route configuration
    - Test `/audit-logs` is child route of Shell
    - Test `/audit-logs` breadcrumb shows "Audit"
    - Test `/audit-logs/:eventId` breadcrumb shows "Audit > Event Detail"
    - Test default route redirects to `/snap`
    - Test auth routes are outside Shell
    - _Requirements: 13.2, 13.3, 13.4, 14.4, 14.5_

- [ ] 10. Internationalization and visual assets
  - [x] 10.1 Add i18n keys for Shell and SNAP namespaces
    - Add `shell` namespace keys to `src/locales/en.json` and `src/locales/pt.json` (nav labels, breadcrumb labels, user menu, brand)
    - Add `snap` namespace keys to `src/locales/en.json` and `src/locales/pt.json` (title, subtitle, CPF labels, error messages, result labels)
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

  - [ ] 10.2 (optional) Write property test: Translation key parity (Property 19)
    - **Property 19: Translation key parity between locales**
    - Load both locale files, compare key sets for `snap` and `shell` namespaces
    - **Validates: Requirements 15.2, 15.3, 15.4, 15.5**

  - [x] 10.3 Port visual assets from ApolloUI
    - Copy `logo_seap_rio.png`, `snap-black.svg`, `snap-white.svg`, `favicon.ico` from `ApolloUI/public/` to `platform-frontend/public/`
    - Update `src/index.html` to reference the ported `favicon.ico` if needed
    - _Requirements: 8.1, 8.4, 8.5_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `(optional)` are test-related sub-tasks that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate the 20 correctness properties defined in the design document
- `fast-check` is required for property-based tests but is not currently in project dependencies - adding it requires explicit approval per tech stack restrictions
- The AuthInterceptor change (task 8.2) modifies authentication logic and requires security review before merge per [SEC-001]
