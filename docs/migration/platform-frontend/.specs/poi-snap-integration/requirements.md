# Requirements Document

## Introduction

This specification defines the POI SNAP integration for platform-frontend. The feature spans five areas: (1) an application shell with sidebar, header, breadcrumb, and main content area, ported from the ApolloUI prototype and adapted to the existing Keycloak authentication system; (2) a SNAP search screen that allows searching for person reports by CPF via `POST /api/v1/poi/generate-person` from poi-service; (3) adaptation of the existing audit feature to work within the new shell; (4) PrimeNG preset customization with an OKLCH color palette (ApoloPreset); (5) multi-origin authentication support in the Auth_Interceptor, per #[[file:PROPOSAL_MULTI_ORIGIN_AUTH.md]], enabling the Bearer token to be securely sent to multiple microservices via a trusted origins whitelist. The real poi-service API returns `GeneratePersonResponse` (`file_path`, `bucket`, `report_name`) — the UI displays a report generation confirmation, not the rich person data from the ApolloUI prototype.

## Design Constraints

- **Trusted Origins (Multi-Origin Auth)**: The Auth_Interceptor uses a trusted origins whitelist (`environment.trustedOrigins`) to determine which requests receive the Bearer token. Requests to origins outside the whitelist do NOT receive the `Authorization` header, preventing credential leakage to external services. See #[[file:PROPOSAL_MULTI_ORIGIN_AUTH.md]].
- **Real poi-service Contract**: The endpoint `POST /api/v1/poi/generate-person` accepts `GeneratePersonRequest { cpf: string }` (11 numeric digits) and returns `GeneratePersonResponse { file_path: string, bucket: string, report_name: string }`. The UI does NOT display rich person data (addresses, phones, etc.) — only report generation confirmation.
- **Keycloak Authentication**: The shell uses the OIDC/Keycloak authentication system already implemented in platform-frontend (AuthService, AuthGuard, AuthInterceptor). It does not use localStorage-based authentication as in the ApolloUI prototype.
- **PrimeNG Components**: All UI elements use PrimeNG 21 components with a customized Aura preset (ApoloPreset). No custom implementations for patterns already covered by PrimeNG.
- **Standalone Components with Signals**: Angular 21 standalone components with `ChangeDetectionStrategy.OnPush` and signals for reactive state.
- **i18n via @ngx-translate/core**: All user-facing strings use translation keys with en/pt locales.
- **ApolloUI Visual Assets**: Static assets from the ApolloUI prototype (`public/`) must be ported to platform-frontend's `public/`: `logo_seap_rio.png` (header logo), `snap-black.svg` and `snap-white.svg` (sidebar logo for light/dark themes), and `favicon.ico`. These are the reference assets for the organization's visual identity.
- **No New Dependencies**: No dependencies outside the approved stack (Angular 21, PrimeNG 21, @ngx-translate/core, Vitest).
- **Lazy Loading**: Features loaded via `loadChildren` in route configuration.

## Glossary

- **Shell**: Main application layout composed of Sidebar, Header, Breadcrumb, and main content area (`<router-outlet />`).
- **Sidebar**: Side navigation bar with collapsed (64px), auto (expands on hover), and pinned (280px) modes. Contains navigation sections and logged-in user info in the footer.
- **Sidebar_Service**: Angular injectable service that manages Sidebar state (mode, hover, open sections).
- **Header**: Top bar with organization logo, brand name, subtitle, and light/dark theme toggle.
- **Theme_Service**: Angular injectable service that manages light/dark theme with localStorage persistence and `p-dark` CSS class.
- **Breadcrumb**: Hierarchical navigation component based on active URL segments.
- **Breadcrumb_Service**: Angular injectable service that allows overriding URL segment labels (e.g., UUIDs).
- **User_Menu**: Component in the Sidebar footer that displays avatar, name, and role of the logged-in user, with a popup menu (logout).
- **SNAP_Search_Page**: SNAP search page with CPF input field and report generation result display.
- **POI_Service_Client**: Angular injectable service that communicates with the `POST /api/v1/poi/generate-person` endpoint via API Gateway.
- **GeneratePersonRequest**: Request payload to poi-service: `{ cpf: string }` (11 numeric digits).
- **GeneratePersonResponse**: Response payload from poi-service: `{ file_path: string, bucket: string, report_name: string }`.
- **ApoloPreset**: Custom PrimeNG preset based on Aura, with OKLCH color palette (steel primary, crimson danger, blue info, green success, orange warn, gray-brand surface).
- **Audit_Feature**: Audit feature already implemented in platform-frontend (listing, detail, filters, pagination).
- **Trusted_Origins**: List of trusted HTTP origins configured in `environment.trustedOrigins`. The Auth_Interceptor only attaches the Bearer token to requests whose origin is in this list, preventing credential leakage to external services. See #[[file:PROPOSAL_MULTI_ORIGIN_AUTH.md]].

## Requirements

### Requirement 1: Shell — Main Layout

**User Story:** As a platform user, I want an interface with a sidebar, header, and breadcrumb, so that I can navigate between features in an organized way.

#### Acceptance Criteria

1. THE Shell SHALL render the Sidebar on the left, the Header at the top of the content area, the Breadcrumb below the Header, and `<router-outlet />` as the main content area.
2. THE Shell SHALL apply dynamic `margin-left` to the main content area based on the current Sidebar width (280px when pinned, 64px in other modes).
3. THE Shell SHALL occupy 100% of the viewport height (`100vh`) with a flex layout and no scroll on the outer structure (scroll only in the content area).
4. WHEN the user navigates to any route protected by Auth_Guard, THE Shell SHALL wrap the route content with the sidebar + header + breadcrumb layout.
5. THE Shell SHALL include PrimeNG `p-toast` (top-right position) and `p-confirmdialog` components for global messages.

### Requirement 2: Shell — Sidebar Display Modes

**User Story:** As a platform user, I want a sidebar that can be pinned, collapsed, or auto-expanded on hover, so that I can optimize screen space according to my preference.

#### Acceptance Criteria

1. THE Sidebar_Service SHALL manage three display modes: `pinned` (fixed, 280px, always visible), `auto` (expands on hover, collapses on leave), and `collapsed` (64px, icons only).
2. WHILE the Sidebar mode is `pinned`, THE Sidebar SHALL remain expanded (280px) regardless of hover state.
3. WHILE the Sidebar mode is `auto`, THE Sidebar SHALL expand to 280px when the cursor is over the Sidebar and collapse to 64px when the cursor leaves.
4. WHILE the Sidebar mode is `auto` and the Sidebar is expanded by hover, THE Sidebar SHALL apply a floating style (box-shadow) without displacing the main content.
5. WHILE the Sidebar mode is `collapsed`, THE Sidebar SHALL display only section icons (64px) without expanding on hover.
6. WHEN the user clicks the pin button (thumbtack icon), THE Sidebar_Service SHALL toggle between `pinned` and `auto` modes.
7. WHEN the user clicks the collapse button (chevron-double-left icon), THE Sidebar_Service SHALL set the mode to `collapsed`.
8. WHEN the user clicks the hamburger button (collapsed mode), THE Sidebar_Service SHALL cycle to the next mode in the sequence `pinned` → `auto` → `collapsed`.

### Requirement 3: Shell — Sidebar Navigation

**User Story:** As a platform user, I want to navigate between available features through the sidebar, so that I can quickly access audit and SNAP search.

#### Acceptance Criteria

1. THE Sidebar SHALL display the following sections and navigation items:
   - Section "Intelligence" (icon `pi pi-shield`): item "SNAP Search" (icon `pi pi-database`, route `/snap`).
   - Section "Administration" (icon `pi pi-lock`): item "Audit" (icon `pi pi-shield`, route `/audit-logs`).
2. WHEN the Sidebar is expanded, THE Sidebar SHALL display section labels, item labels, and chevron icons to expand/collapse sections.
3. WHEN the Sidebar is collapsed, THE Sidebar SHALL display only section icons with a tooltip containing the section label.
4. WHEN the user clicks a section header with the Sidebar expanded, THE Sidebar SHALL toggle the visibility of items in that section (expand/collapse).
5. WHEN the user clicks a navigation item, THE Sidebar SHALL navigate to the corresponding route and apply an `active` style (visual highlight with primary color) to the active item.
6. THE Sidebar SHALL visually highlight the navigation item corresponding to the active route using `routerLinkActive`.

### Requirement 4: Shell — Header

**User Story:** As a platform user, I want a header with the organization's visual identity and theme control, so that I can identify the system and switch between light and dark modes.

#### Acceptance Criteria

1. THE Header SHALL display the organization logo, brand name, and a descriptive subtitle on the left side.
2. THE Header SHALL display a theme toggle (light/dark) on the right side using the PrimeNG `p-toggleswitch` component.
3. THE Header SHALL have a fixed height of 64px with a bottom border separating it from the content.
4. WHEN the user toggles the theme switch, THE Theme_Service SHALL toggle between light and dark modes.

### Requirement 5: Shell — Theme Service

**User Story:** As a platform user, I want my theme preference (light/dark) to be persisted, so that the system maintains my choice across sessions.

#### Acceptance Criteria

1. THE Theme_Service SHALL manage theme state via a signal `isDark` (boolean).
2. WHEN the theme is toggled, THE Theme_Service SHALL add or remove the CSS class `p-dark` on the document's `<html>` element.
3. WHEN the theme is toggled, THE Theme_Service SHALL persist the preference in localStorage with the key `apolo-theme` (values: `dark` or `light`).
4. WHEN the Theme_Service is initialized and a saved preference exists in localStorage, THE Theme_Service SHALL apply the saved preference.
5. WHEN the Theme_Service is initialized and no saved preference exists, THE Theme_Service SHALL use the operating system preference via `prefers-color-scheme`.

### Requirement 6: Shell — Breadcrumb

**User Story:** As a platform user, I want to see my current location in the navigation hierarchy, so that I know where I am and can navigate to higher levels.

#### Acceptance Criteria

1. THE Breadcrumb SHALL automatically generate navigation items from the active URL segments.
2. THE Breadcrumb SHALL map known URL segments to readable labels (e.g., `snap` → "SNAP Search", `audit-logs` → "Audit").
3. THE Breadcrumb SHALL render each item as a clickable link, except the last item (current route) which is displayed as plain text.
4. THE Breadcrumb SHALL use the `›` separator between items.
5. THE Breadcrumb_Service SHALL allow dynamically overriding URL segment labels (e.g., replacing a UUID with a readable name).

### Requirement 7: Shell — User Menu in Sidebar

**User Story:** As a logged-in user, I want to see my information (name, role) in the sidebar and have quick access to logout, so that I can identify my session and sign out of the system.

#### Acceptance Criteria

1. WHILE the Sidebar is expanded, THE User_Menu SHALL display the avatar (name initials), full name, and role of the logged-in user in the Sidebar footer, with a popup menu triggered by click.
2. WHILE the Sidebar is collapsed, THE User_Menu SHALL display only the avatar (initials) with a tooltip containing the user's name.
3. THE User_Menu SHALL obtain logged-in user information from the existing AuthService/AuthStateService in platform-frontend (Keycloak token data), without using localStorage-based authentication.
4. THE User_Menu SHALL include a "Sign Out" option in the popup menu that triggers the existing AuthService logout flow.
5. THE User_Menu SHALL compute user initials from the first two words of the name (e.g., "Victor Salles" → "VS").

### Requirement 8: ApolloUI Visual Assets Porting

**User Story:** As a platform developer, I want the ApolloUI prototype's visual assets to be ported to platform-frontend, so that the organization's visual identity is preserved.

#### Acceptance Criteria

1. THE following files from `ApolloUI/public/` SHALL be copied to `platform-frontend/public/`:
   - `logo_seap_rio.png` — organization logo displayed in the Header.
   - `snap-black.svg` — application logo for light theme, displayed in the Sidebar header.
   - `snap-white.svg` — application logo for dark theme, displayed in the Sidebar header.
   - `favicon.ico` — browser tab icon (replacing the default Angular favicon).
2. THE Sidebar SHALL display `snap-black.svg` when the active theme is light and `snap-white.svg` when the active theme is dark, switching dynamically via Theme_Service.
3. THE Header SHALL display `logo_seap_rio.png` as the organization logo on the left side.
4. THE `index.html` SHALL reference the ported `favicon.ico`.
5. THE ported assets SHALL be served as static files from the `public/` directory, without processing by the Angular build pipeline.

### Requirement 9: Custom Theme Preset (ApoloPreset)

**User Story:** As a platform developer, I want a custom PrimeNG preset with the organization's color palette, so that the interface has a consistent visual identity.

#### Acceptance Criteria

1. THE ApoloPreset SHALL be based on the PrimeNG Aura preset, overriding only color tokens.
2. THE ApoloPreset SHALL define the primary palette using steel (blue-gray) tones in OKLCH format.
3. THE ApoloPreset SHALL define semantic palettes: danger (crimson), info (blue), success (green), warn (orange).
4. THE ApoloPreset SHALL define the surface palette using gray-brand tones in OKLCH format.
5. THE ApoloPreset SHALL be configured in `providePrimeNG` within `app.config.ts`, replacing the default Aura preset.
6. THE ApoloPreset SHALL support light and dark modes without separate presets (PrimeNG applies automatically via the `p-dark` class).

### Requirement 10: SNAP Search — CPF Lookup

**User Story:** As an intelligence analyst, I want to search for a SNAP report by CPF, so that I can generate person reports from the SNAP database.

#### Acceptance Criteria

1. WHEN the user navigates to the `/snap` route, THE SNAP_Search_Page SHALL display a title, descriptive subtitle, and a CPF input field with a search button.
2. THE SNAP_Search_Page SHALL automatically format the CPF input value in the `000.000.000-00` pattern as the user types, limiting input to 14 characters (11 digits + formatting).
3. THE SNAP_Search_Page SHALL disable the search button while the CPF does not contain exactly 11 numeric digits.
4. WHEN the user clicks the search button or presses Enter with a valid CPF, THE POI_Service_Client SHALL send a `POST {apiGatewayUrl}/api/v1/poi/generate-person` request with the payload `{ cpf: "<11 digits>" }` (digits only, no formatting).
5. WHILE the request to poi-service is in progress, THE SNAP_Search_Page SHALL display a loading indicator (spinner) and disable the search button.
6. WHEN the request returns successfully (`GeneratePersonResponse`), THE SNAP_Search_Page SHALL display a report generation confirmation containing: report name (`report_name`), file path (`file_path`), and storage bucket (`bucket`).
7. THE SNAP_Search_Page SHALL validate that the CPF contains exactly 11 numeric digits before sending the request, displaying an error message otherwise.

### Requirement 11: SNAP Search — Error Handling

**User Story:** As an intelligence analyst, I want clear feedback when errors occur during SNAP searches, so that I know what happened and how to proceed.

#### Acceptance Criteria

1. IF the API returns HTTP 400 (bad request), THEN THE SNAP_Search_Page SHALL display an error message indicating the CPF is invalid or parameters are incorrect.
2. IF the API returns HTTP 403 (forbidden), THEN THE SNAP_Search_Page SHALL display a message indicating the user does not have permission to perform SNAP searches.
3. IF the API returns HTTP 404 (not found), THEN THE SNAP_Search_Page SHALL display a message indicating no results were found for the given CPF.
4. IF the API returns HTTP 503 (service unavailable), THEN THE SNAP_Search_Page SHALL display a message indicating the SNAP service is temporarily unavailable, with a retry option.
5. IF a network error occurs (timeout or connection refused), THEN THE SNAP_Search_Page SHALL display a connectivity error message, with a retry option.
6. THE SNAP_Search_Page SHALL display error messages using the PrimeNG `p-message` component, without exposing technical details of the error response to the user.

### Requirement 12: SNAP Search — HTTP Service (POI_Service_Client)

**User Story:** As a platform developer, I want a dedicated Angular service for communication with poi-service, so that HTTP call logic is encapsulated and reusable.

#### Acceptance Criteria

1. THE POI_Service_Client SHALL be an injectable service (`providedIn: 'root'`) that uses `HttpClient` for communication with poi-service via API Gateway.
2. THE POI_Service_Client SHALL expose the method `generatePerson(cpf: string): Observable<GeneratePersonResponse>` that sends `POST {apiGatewayUrl}/api/v1/poi/generate-person` with payload `{ cpf: string }`.
3. THE POI_Service_Client SHALL strip non-numeric characters from the CPF before sending the request (input sanitization).
4. THE POI_Service_Client SHALL depend exclusively on Angular's `HttpClient` — the existing Auth_Interceptor automatically injects the Bearer token for origins present in the `trustedOrigins` whitelist (per Requirement 16).

### Requirement 13: Audit Feature Adaptation to Shell

**User Story:** As a platform administrator, I want the existing audit feature to work within the new shell, so that I have a consistent navigation experience.

#### Acceptance Criteria

1. THE Audit_Feature SHALL work within the Shell without changes to existing business logic, HTTP service, or data models.
2. THE `/audit-logs` route SHALL be loaded as a child route of the Shell, maintaining lazy loading via `loadChildren` and Auth_Guard protection.
3. WHEN the user navigates to `/audit-logs`, THE Breadcrumb SHALL display "Audit" as a navigation item.
4. WHEN the user navigates to `/audit-logs/:eventId`, THE Breadcrumb SHALL display "Audit > Event Detail" as navigation items.

### Requirement 14: Route Configuration

**User Story:** As a platform developer, I want routes organized with the Shell as the parent layout, so that all protected features share the same visual structure.

#### Acceptance Criteria

1. THE protected root route SHALL use the Shell as the layout component, with feature routes as Shell children.
2. THE `/snap` route SHALL be lazy-loaded via `loadChildren`, protected by Auth_Guard, and rendered within the Shell.
3. THE `/audit-logs` route SHALL continue to be lazy-loaded via `loadChildren`, protected by Auth_Guard, and rendered within the Shell.
4. THE default route (`/`) SHALL redirect to `/snap` (main application page).
5. THE authentication routes (`/auth/*`) SHALL remain outside the Shell, without sidebar or header.

### Requirement 15: Internationalization (i18n)

**User Story:** As a platform user, I want the entire interface to be available in English and Portuguese, so that I can use it in my preferred language.

#### Acceptance Criteria

1. THE Shell, Sidebar, Header, Breadcrumb, and SNAP_Search_Page SHALL use @ngx-translate/core translation keys for all user-facing strings.
2. THE SNAP_Search_Page SHALL provide complete translations in `src/locales/en.json` and `src/locales/pt.json` for all labels, error messages, loading states, and confirmation texts, using the `snap` namespace.
3. THE Shell SHALL provide translations for sidebar section labels, navigation item labels, and user menu texts, using the `shell` namespace.
4. FOR ALL translation keys in the `snap` namespace present in `en.json`, a corresponding key SHALL exist in `pt.json` (and vice-versa).
5. FOR ALL translation keys in the `shell` namespace present in `en.json`, a corresponding key SHALL exist in `pt.json` (and vice-versa).

### Requirement 16: Multi-Origin Authentication Support (Multi-Origin Auth)

**User Story:** As a platform developer, I want the Auth_Interceptor to send the Bearer token only to configured trusted origins, so that the frontend can communicate with multiple microservices without leaking credentials to external services.

**Reference:** #[[file:PROPOSAL_MULTI_ORIGIN_AUTH.md]]

#### Acceptance Criteria

1. THE `environment` configuration SHALL replace the `apiGatewayUrl` field (single origin) with a `trustedOrigins` array containing the trusted HTTP origins to which the Bearer token may be sent.
2. THE Auth_Interceptor SHALL extract the origin from each HTTP request and verify it is present in the `trustedOrigins` list before attaching the `Authorization: Bearer <token>` header.
3. IF the request origin is NOT in the `trustedOrigins` list, THEN THE Auth_Interceptor SHALL forward the request without the `Authorization` header, preventing credential leakage to external services.
4. THE `trustedOrigins` SHALL include, at minimum, the API Gateway origin (`http://localhost:8080` in development).
5. THE Auth_Interceptor SHALL maintain all existing token refresh logic, automatic 401 retry, and cross-tab synchronization — only the origin check is changed from single-origin to whitelist.
6. THE `trustedOrigins` SHALL be configurable per environment (development, staging, production) in the `environment.ts` and `environment.prod.ts` files.

**Security Note:** This change modifies authentication logic and requires security review before merge, per [SEC-001].
