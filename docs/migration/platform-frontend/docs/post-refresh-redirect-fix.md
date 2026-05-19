# Post-Refresh Redirect Fix

**Problem**: Pressing F5 (or accessing a URL directly) always redirected the user to `/intelligence/person/dashboard`, regardless of which page they were on.

**Affected files**:
- `src/app/auth/services/auth.service.ts`
- `src/app/features/iam/services/active-org.service.ts`
- `src/app/features/iam/guards/org-context.guard.ts`
- `src/app/features/iam/guards/iam-init.resolver.ts`
- `src/app/shell/shell.ts`

---

## Root Causes

Three independent bugs combined to produce the symptom.

### 1. `returnUrl` lost across the Keycloak redirect

The app uses **in-memory-only token storage**. On every page refresh, all tokens are gone and the full OIDC flow restarts:

```
F5 at /intelligence/documents
  → app boots, no tokens → unauthenticated
  → AuthGuard calls login('/intelligence/documents')
  → login() stores returnUrl in-memory: this.returnUrl = '/intelligence/documents'
  → window.location.href = <keycloak auth URL>   ← full page navigation
  → Keycloak redirects back to /auth/callback
  → app boots fresh → this.returnUrl is back to default '/'
  → handleCallback() navigates to '/'
  → '/' redirects to 'intelligence/person' → 'intelligence/person/dashboard'
```

`this.returnUrl` is an in-memory property. The Keycloak redirect is a full browser navigation that destroys all JS state. By the time the callback page loads, the intended URL is gone.

### 2. `OrgContextGuard` ran before `ActiveOrgService` was initialized

Angular's routing pipeline runs guards **before** resolvers. The `workflows` and `admin` routes use both:

```typescript
// workflows.routes.ts
{
  path: '',
  resolve: { init: iamInitResolver },   // runs SECOND
  canActivate: [OrgContextGuard],        // runs FIRST
  children: [...]
}
```

`OrgContextGuard` was synchronous and read `activeOrganizationId()` and `isPlatformAdmin()` directly from signals. On a fresh page load those signals hold their default values (`null` and `false`). The guard saw `activeOrganizationId === null` and `isPlatformAdmin === false` and redirected to `/`, which cascades to `/intelligence/person/dashboard`.

### 3. Initialization logic duplicated across three callers

`ShellComponent`, `iamInitResolver`, and (implicitly) `OrgContextGuard` each had their own copy of the identity-context fetch logic. This made the race condition harder to reason about and fix consistently.

---

## Solution

### Fix 1 — Persist `returnUrl` to `sessionStorage` before the Keycloak redirect

`sessionStorage` survives same-tab navigation (including the Keycloak round-trip) but is isolated per tab and cleared when the tab closes, making it safe for this purpose.

```typescript
// auth.service.ts
private static readonly RETURN_URL_KEY = 'auth_return_url';

login(returnUrl?: string): void {
  const validated = this.validateReturnUrl(returnUrl);
  this.returnUrl = validated;
  // Persist across the Keycloak redirect — full page navigation clears in-memory state
  sessionStorage.setItem(AuthService.RETURN_URL_KEY, validated);
  // ... PKCE + redirect to Keycloak
}

// Inside handleCallback(), after successful token exchange:
const persistedUrl = sessionStorage.getItem(AuthService.RETURN_URL_KEY);
if (persistedUrl) {
  this.returnUrl = persistedUrl;
  sessionStorage.removeItem(AuthService.RETURN_URL_KEY);
}
this.router.navigateByUrl(this.returnUrl);
```

`validateReturnUrl()` already rejects absolute URLs and `//`-prefixed paths, so open-redirect attacks are not possible.

### Fix 2 — Make `OrgContextGuard` wait for initialization

The guard now calls `ensureInitialized()` (see Fix 3) before reading any signals:

```typescript
// org-context.guard.ts
export const OrgContextGuard: CanActivateFn = async () => {
  const activeOrg = inject(ActiveOrgService);
  const router = inject(Router);

  // Ensure ActiveOrgService is initialized before evaluating org context.
  // The guard runs before the iamInitResolver, so on a fresh page load (e.g. F5)
  // the service may not be initialized yet — calling ensureInitialized() here
  // prevents a premature redirect based on uninitialized signal defaults.
  await activeOrg.ensureInitialized();

  if (activeOrg.activeOrganizationId() !== null) return true;
  // ... rest of guard logic
};
```

### Fix 3 — Consolidate initialization into `ActiveOrgService.ensureInitialized()`

A single-flight async method was added to `ActiveOrgService`. It fetches `/me?include=roles`, calls `initialize()`, and deduplicates concurrent calls (guard + shell both calling at the same time):

```typescript
// active-org.service.ts
async ensureInitialized(): Promise<void> {
  if (this._initialized()) return;

  // Deduplicate concurrent calls (e.g. guard + shell both calling at once)
  if (this._initPromise) return this._initPromise;

  this._initPromise = (async () => {
    try {
      const url = `${this.cfg.config.identityServiceUrl}/me?include=roles`;
      const ctx = await firstValueFrom(this.http.get<IdentityContextResponse>(url));
      await this.initialize(ctx);
    } catch (err) {
      console.error('[ActiveOrgService] Failed to fetch identity context:', err);
      // Mark initialized so guards don't hang forever on error
      this._initialized.set(true);
    } finally {
      this._initPromise = null;
    }
  })();

  return this._initPromise;
}
```

`iamInitResolver` and `ShellComponent` were simplified to delegate to `ensureInitialized()` instead of each owning a copy of the fetch logic.

---

## Call Flow After the Fix

```
F5 at /intelligence/documents
  → app boots, no tokens → unauthenticated
  → AuthGuard calls login('/intelligence/documents')
  → login() writes sessionStorage['auth_return_url'] = '/intelligence/documents'
  → redirect to Keycloak (full page navigation)
  → Keycloak SSO session active → immediate redirect to /auth/callback
  → app boots at /auth/callback
  → handleCallback() reads sessionStorage['auth_return_url'] = '/intelligence/documents'
  → removes the key, navigates to '/intelligence/documents'
  → AuthGuard passes (authenticated)
  → OrgContextGuard calls ensureInitialized() → fetches /me?include=roles → initialized
  → guard reads real signal values → passes
  → page renders at /intelligence/documents  ✓
```

---

## Security Notes

| Concern | Mitigation |
|---|---|
| Open redirect via `returnUrl` | `validateReturnUrl()` rejects any URL that is not a relative path starting with `/`, blocking `https://evil.com` and `//evil.com` |
| `sessionStorage` XSS exposure | `auth_return_url` contains only a path string — no tokens, no credentials. Worst-case XSS impact is a redirect to an attacker-controlled path within the same origin |
| `sessionStorage` tab isolation | Each tab has its own `sessionStorage`, so concurrent logins in multiple tabs do not interfere |
| Key cleared after use | `sessionStorage.removeItem(RETURN_URL_KEY)` is called immediately after reading, so the value does not linger |

---

## Coding Agent Tips

> These notes are for AI coding agents working in this codebase.

**Do not store tokens in `sessionStorage` or `localStorage`.** The app intentionally uses in-memory-only token storage. `sessionStorage` is used here only for the transient `returnUrl` string, which contains no sensitive data. Do not extend this pattern to tokens, refresh tokens, or user identity data.

**`OrgContextGuard` must always `await ensureInitialized()` first.** The guard runs before resolvers in Angular's pipeline. Any guard that reads `ActiveOrgService` signals must call `ensureInitialized()` before doing so, or it will read uninitialized defaults and produce incorrect redirects.

**`ensureInitialized()` is idempotent and single-flight.** It is safe to call from multiple places (guard, shell, resolver). The internal `_initPromise` deduplicates concurrent calls. Do not add additional `if (initialized()) return` checks before calling it — the method already handles that.

**`iamInitResolver` is now a thin wrapper.** It exists to attach initialization to specific route trees declaratively. Its only job is `await activeOrg.ensureInitialized()`. Do not add fetch logic back into it.

**`ShellComponent` no longer owns initialization.** The shell calls `ensureInitialized()` as a best-effort fallback for routes that do not have `OrgContextGuard` or `iamInitResolver`. Do not add JWT fallback role extraction back into the shell — if the identity API fails, `ensureInitialized()` marks the service as initialized with a safe default state and logs the error.

**The `initialized` signal is the source of truth.** Components and guards that need to know whether `ActiveOrgService` is ready should read `activeOrg.initialized()`. Do not invent a separate loading flag.
