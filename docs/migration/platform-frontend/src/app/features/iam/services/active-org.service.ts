import { Injectable, Signal, WritableSignal, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import { IdentityContextResponse } from '../models/identity-context.model';
import { OrganizationResponse } from '../models/identity.model';

const SESSION_STORAGE_KEY = 'iam_active_org';

interface StoredOrgContext {
  orgId: string;
  orgName: string;
}

@Injectable({ providedIn: 'root' })
export class ActiveOrgService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);

  // Current user ID from Identity Context (immutable after initialize)
  private readonly _currentUserId: WritableSignal<string | null> = signal(null);
  readonly currentUserId: Signal<string | null> = this._currentUserId.asReadonly();

  // User's own org from Identity Context (immutable after initialize)
  private readonly _userOrganizationId: WritableSignal<string | null> = signal(null);
  private readonly _userOrganizationName: WritableSignal<string | null> = signal(null);
  private readonly _isPlatformAdmin: WritableSignal<boolean> = signal(false);
  private readonly _isAdmin: WritableSignal<boolean> = signal(false);
  private readonly _initialized: WritableSignal<boolean> = signal(false);

  readonly userOrganizationId: Signal<string | null> = this._userOrganizationId.asReadonly();
  readonly userOrganizationName: Signal<string | null> = this._userOrganizationName.asReadonly();
  readonly isPlatformAdmin: Signal<boolean> = this._isPlatformAdmin.asReadonly();
  readonly isAdmin: Signal<boolean> = this._isAdmin.asReadonly();
  readonly initialized: Signal<boolean> = this._initialized.asReadonly();

  // Active org context (writable for Platform Admin, immutable for Org Admin)
  private readonly _activeOrganizationId: WritableSignal<string | null> = signal(null);
  private readonly _activeOrganizationName: WritableSignal<string | null> = signal(null);

  readonly activeOrganizationId: Signal<string | null> = this._activeOrganizationId.asReadonly();
  readonly activeOrganizationName: Signal<string | null> =
    this._activeOrganizationName.asReadonly();

  // Derived signals
  readonly isOwnOrg: Signal<boolean> = computed(
    () =>
      this._activeOrganizationId() !== null &&
      this._activeOrganizationId() === this._userOrganizationId(),
  );

  readonly isPlatformView: Signal<boolean> = computed(
    () => this._isPlatformAdmin() && this._activeOrganizationId() === null,
  );

  readonly isOrgView: Signal<boolean> = computed(() => this._activeOrganizationId() !== null);

  readonly canMutate: Signal<boolean> = computed(() => {
    if (!this.isOrgView()) return false;
    return this.isOwnOrg() || !this._isPlatformAdmin();
  });

  /** Switch active org (Platform Admin only). No-op for Org Admin. */
  switchOrg(orgId: string, orgName: string): void {
    if (!this._isPlatformAdmin()) return;

    this._activeOrganizationId.set(orgId);
    this._activeOrganizationName.set(orgName);
    this.persistToSessionStorage(orgId, orgName);
  }

  /** Switch to platform view (Platform Admin only). No-op for Org Admin. */
  switchToPlatformView(): void {
    if (!this._isPlatformAdmin()) return;

    this._activeOrganizationId.set(null);
    this._activeOrganizationName.set(null);
    this.clearSessionStorage();
  }

  /** Reset to user's own org. */
  resetToOwnOrg(): void {
    const orgId = this._userOrganizationId();
    const orgName = this._userOrganizationName();
    this._activeOrganizationId.set(orgId);
    this._activeOrganizationName.set(orgName);

    if (this._isPlatformAdmin() && orgId !== null && orgName !== null) {
      this.persistToSessionStorage(orgId, orgName);
    }
  }

  /**
   * Ensures the service is initialized, fetching identity context if needed.
   * Safe to call multiple times — no-ops if already initialized or in-flight.
   * Used by OrgContextGuard so it can self-initialize on direct URL access / F5
   * without depending on the iamInitResolver running first.
   */
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

  private _initPromise: Promise<void> | null = null;

  /**
   * Initialize from Identity Context. Called once on IAM panel load.
   *
   * 1. Sets user org/role info from identity context
   * 2. For Org Admin: always set activeOrganizationId to own org (immutable)
   * 3. For Platform Admin: check sessionStorage for persisted context
   *    - If stored org exists: validate via GET /api/v1/organizations/{orgId}
   *    - If valid (200, active): restore context
   *    - If invalid (404, inactive): clear storage, default to null (platform view)
   *    - If no stored context: default to null (platform view)
   */
  async initialize(identityContext: IdentityContextResponse): Promise<void> {
    const userOrgId = identityContext.user.organization_id;
    const userOrgName = identityContext.organization?.name ?? null;
    const isPlatformAdmin = this.detectPlatformAdmin(identityContext);
    const isAdmin = this.detectAdmin(identityContext);

    this._currentUserId.set(identityContext.user.id);
    this._userOrganizationId.set(userOrgId);
    this._userOrganizationName.set(userOrgName);
    this._isPlatformAdmin.set(isPlatformAdmin);
    this._isAdmin.set(isAdmin);

    if (!isPlatformAdmin) {
      // Org Admin: always set to own org (immutable)
      this._activeOrganizationId.set(userOrgId);
      this._activeOrganizationName.set(userOrgName);
      this._initialized.set(true);
      return;
    }

    // Platform Admin: check sessionStorage for persisted context
    const stored = this.readFromSessionStorage();
    if (stored !== null) {
      const validOrg = await this.validateStoredOrg(stored.orgId);
      if (validOrg !== null) {
        this._activeOrganizationId.set(validOrg.id);
        this._activeOrganizationName.set(validOrg.name);
        this._initialized.set(true);
        return;
      }
      // Invalid stored org — clear and fall through to platform view
      this.clearSessionStorage();
    }

    // Default: platform view (null)
    this._activeOrganizationId.set(null);
    this._activeOrganizationName.set(null);
    this._initialized.set(true);
  }

  private detectPlatformAdmin(ctx: IdentityContextResponse): boolean {
    if (!ctx.roles) return false;
    return ctx.roles.some((role) => role.key === 'PLATFORM_ADMIN' && role.scope_type === 'GLOBAL');
  }

  private detectAdmin(ctx: IdentityContextResponse): boolean {
    if (!ctx.roles) return false;
    const adminKeys = new Set(['PLATFORM_ADMIN', 'ORG_ADMIN']);
    return ctx.roles.some((role) => role.key !== null && adminKeys.has(role.key));
  }

  private persistToSessionStorage(orgId: string, orgName: string): void {
    try {
      const data: StoredOrgContext = { orgId, orgName };
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // sessionStorage may be unavailable (e.g., private browsing quota exceeded)
    }
  }

  private clearSessionStorage(): void {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  private readFromSessionStorage(): StoredOrgContext | null {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw === null) return null;
      const parsed = JSON.parse(raw) as StoredOrgContext;
      if (typeof parsed.orgId === 'string' && typeof parsed.orgName === 'string') {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Validate a stored org by calling GET /api/v1/organizations/{orgId}.
   * Returns the org if valid (200, active status), null otherwise.
   */
  private async validateStoredOrg(orgId: string): Promise<OrganizationResponse | null> {
    try {
      const url = `${this.cfg.config.identityServiceUrl}/organizations/${orgId}`;
      const org = await firstValueFrom(this.http.get<OrganizationResponse>(url));
      if (org.status === 'active') {
        return org;
      }
      return null;
    } catch {
      return null;
    }
  }
}
