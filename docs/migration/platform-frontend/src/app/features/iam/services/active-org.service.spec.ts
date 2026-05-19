import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ActiveOrgService } from './active-org.service';
import { IdentityContextResponse } from '../models/identity-context.model';
import { environment } from '../../../../environments/environment';

const SESSION_STORAGE_KEY = 'iam_active_org';

function makeIdentityContext(overrides: {
  organizationId?: string | null;
  orgName?: string;
  orgStatus?: 'active' | 'inactive';
  isPlatformAdmin?: boolean;
}): IdentityContextResponse {
  const orgId = overrides.organizationId ?? 'org-1';
  const orgName = overrides.orgName ?? 'Test Org';
  const orgStatus = overrides.orgStatus ?? 'active';

  const roles = overrides.isPlatformAdmin
    ? [
        {
          id: 'r1',
          key: 'PLATFORM_ADMIN',
          name: 'platform-admin',
          type: 'platform' as const,
          scope_type: 'GLOBAL' as const,
          scope_id: null,
        },
      ]
    : [
        {
          id: 'r2',
          key: 'ORG_ADMIN',
          name: 'org-admin',
          type: 'service' as const,
          scope_type: 'ORGANIZATION' as const,
          scope_id: orgId,
        },
      ];

  return {
    user: {
      id: 'user-1',
      external_auth_id: 'ext-1',
      email: 'test@example.com',
      display_name: 'Test User',
      status: 'active',
      organization_id: orgId,
      clearance_level: 5,
      identity_version: 1,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    organization: orgId ? { id: orgId, name: orgName, status: orgStatus } : null,
    roles,
  };
}

describe('ActiveOrgService', () => {
  let service: ActiveOrgService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ActiveOrgService],
    });

    service = TestBed.inject(ActiveOrgService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    sessionStorage.clear();
  });

  describe('initial state', () => {
    it('should have null defaults before initialization', () => {
      expect(service.userOrganizationId()).toBeNull();
      expect(service.userOrganizationName()).toBeNull();
      expect(service.isPlatformAdmin()).toBe(false);
      expect(service.activeOrganizationId()).toBeNull();
      expect(service.activeOrganizationName()).toBeNull();
    });
  });

  describe('initialize — Org Admin', () => {
    it('should set activeOrganizationId to own org', async () => {
      const ctx = makeIdentityContext({
        organizationId: 'org-1',
        orgName: 'My Org',
        isPlatformAdmin: false,
      });
      await service.initialize(ctx);

      expect(service.userOrganizationId()).toBe('org-1');
      expect(service.userOrganizationName()).toBe('My Org');
      expect(service.isPlatformAdmin()).toBe(false);
      expect(service.activeOrganizationId()).toBe('org-1');
      expect(service.activeOrganizationName()).toBe('My Org');
    });

    it('should ignore sessionStorage for Org Admin', async () => {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ orgId: 'other-org', orgName: 'Other' }),
      );
      const ctx = makeIdentityContext({ organizationId: 'org-1', isPlatformAdmin: false });
      await service.initialize(ctx);

      expect(service.activeOrganizationId()).toBe('org-1');
    });
  });

  describe('initialize — Platform Admin', () => {
    it('should default to null (platform view) when no sessionStorage', async () => {
      const ctx = makeIdentityContext({
        organizationId: 'snap-org',
        orgName: 'SNAP',
        isPlatformAdmin: true,
      });
      await service.initialize(ctx);

      expect(service.isPlatformAdmin()).toBe(true);
      expect(service.activeOrganizationId()).toBeNull();
      expect(service.activeOrganizationName()).toBeNull();
    });

    it('should restore valid stored org from sessionStorage', async () => {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ orgId: 'stored-org', orgName: 'Stored' }),
      );
      const ctx = makeIdentityContext({
        organizationId: 'snap-org',
        orgName: 'SNAP',
        isPlatformAdmin: true,
      });

      const initPromise = service.initialize(ctx);

      const req = httpTesting.expectOne(
        `${environment.identityServiceUrl}/api/v1/organizations/stored-org`,
      );
      req.flush({
        id: 'stored-org',
        name: 'Stored Org',
        status: 'active',
        created_at: '',
        updated_at: '',
      });

      await initPromise;

      expect(service.activeOrganizationId()).toBe('stored-org');
      expect(service.activeOrganizationName()).toBe('Stored Org');
    });

    it('should clear storage and default to null when stored org is inactive', async () => {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ orgId: 'dead-org', orgName: 'Dead' }),
      );
      const ctx = makeIdentityContext({
        organizationId: 'snap-org',
        orgName: 'SNAP',
        isPlatformAdmin: true,
      });

      const initPromise = service.initialize(ctx);

      const req = httpTesting.expectOne(
        `${environment.identityServiceUrl}/api/v1/organizations/dead-org`,
      );
      req.flush({
        id: 'dead-org',
        name: 'Dead Org',
        status: 'inactive',
        created_at: '',
        updated_at: '',
      });

      await initPromise;

      expect(service.activeOrganizationId()).toBeNull();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });

    it('should clear storage and default to null when stored org returns 404', async () => {
      sessionStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ orgId: 'gone-org', orgName: 'Gone' }),
      );
      const ctx = makeIdentityContext({
        organizationId: 'snap-org',
        orgName: 'SNAP',
        isPlatformAdmin: true,
      });

      const initPromise = service.initialize(ctx);

      const req = httpTesting.expectOne(
        `${environment.identityServiceUrl}/api/v1/organizations/gone-org`,
      );
      req.flush(null, { status: 404, statusText: 'Not Found' });

      await initPromise;

      expect(service.activeOrganizationId()).toBeNull();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });
  });

  describe('derived signals', () => {
    it('isOwnOrg should be true when active org matches user org', async () => {
      const ctx = makeIdentityContext({ organizationId: 'org-1', isPlatformAdmin: true });
      await service.initialize(ctx);
      service.switchOrg('org-1', 'My Org');

      expect(service.isOwnOrg()).toBe(true);
    });

    it('isOwnOrg should be false when active org differs from user org', async () => {
      const ctx = makeIdentityContext({ organizationId: 'org-1', isPlatformAdmin: true });
      await service.initialize(ctx);
      service.switchOrg('org-2', 'Other Org');

      expect(service.isOwnOrg()).toBe(false);
    });

    it('isOwnOrg should be false when activeOrganizationId is null', async () => {
      const ctx = makeIdentityContext({ organizationId: 'org-1', isPlatformAdmin: true });
      await service.initialize(ctx);

      expect(service.isOwnOrg()).toBe(false);
    });

    it('isPlatformView should be true for Platform Admin with null active org', async () => {
      const ctx = makeIdentityContext({ organizationId: 'snap', isPlatformAdmin: true });
      await service.initialize(ctx);

      expect(service.isPlatformView()).toBe(true);
    });

    it('isPlatformView should be false for Org Admin', async () => {
      const ctx = makeIdentityContext({ organizationId: 'org-1', isPlatformAdmin: false });
      await service.initialize(ctx);

      expect(service.isPlatformView()).toBe(false);
    });

    it('isOrgView should be true when activeOrganizationId is set', async () => {
      const ctx = makeIdentityContext({ organizationId: 'org-1', isPlatformAdmin: false });
      await service.initialize(ctx);

      expect(service.isOrgView()).toBe(true);
    });

    it('isOrgView should be false when activeOrganizationId is null', async () => {
      const ctx = makeIdentityContext({ organizationId: 'snap', isPlatformAdmin: true });
      await service.initialize(ctx);

      expect(service.isOrgView()).toBe(false);
    });
  });

  describe('canMutate', () => {
    it('should be true for Org Admin (always in own org)', async () => {
      const ctx = makeIdentityContext({ organizationId: 'org-1', isPlatformAdmin: false });
      await service.initialize(ctx);

      expect(service.canMutate()).toBe(true);
    });

    it('should be false for Platform Admin in platform view', async () => {
      const ctx = makeIdentityContext({ organizationId: 'snap', isPlatformAdmin: true });
      await service.initialize(ctx);

      expect(service.canMutate()).toBe(false);
    });

    it('should be true for Platform Admin in own org (SNAP)', async () => {
      const ctx = makeIdentityContext({ organizationId: 'snap', isPlatformAdmin: true });
      await service.initialize(ctx);
      service.switchOrg('snap', 'SNAP');

      expect(service.canMutate()).toBe(true);
    });

    it('should be false for Platform Admin viewing foreign org', async () => {
      const ctx = makeIdentityContext({ organizationId: 'snap', isPlatformAdmin: true });
      await service.initialize(ctx);
      service.switchOrg('foreign-org', 'Foreign');

      expect(service.canMutate()).toBe(false);
    });
  });

  describe('switchOrg', () => {
    it('should update active org and persist to sessionStorage for Platform Admin', async () => {
      const ctx = makeIdentityContext({ organizationId: 'snap', isPlatformAdmin: true });
      await service.initialize(ctx);

      service.switchOrg('target-org', 'Target Org');

      expect(service.activeOrganizationId()).toBe('target-org');
      expect(service.activeOrganizationName()).toBe('Target Org');

      const stored = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)!);
      expect(stored).toEqual({ orgId: 'target-org', orgName: 'Target Org' });
    });

    it('should be a no-op for Org Admin', async () => {
      const ctx = makeIdentityContext({
        organizationId: 'org-1',
        orgName: 'My Org',
        isPlatformAdmin: false,
      });
      await service.initialize(ctx);

      service.switchOrg('other-org', 'Other');

      expect(service.activeOrganizationId()).toBe('org-1');
      expect(service.activeOrganizationName()).toBe('My Org');
    });
  });

  describe('switchToPlatformView', () => {
    it('should set active org to null and clear sessionStorage for Platform Admin', async () => {
      const ctx = makeIdentityContext({ organizationId: 'snap', isPlatformAdmin: true });
      await service.initialize(ctx);
      service.switchOrg('some-org', 'Some Org');

      service.switchToPlatformView();

      expect(service.activeOrganizationId()).toBeNull();
      expect(service.activeOrganizationName()).toBeNull();
      expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
    });

    it('should be a no-op for Org Admin', async () => {
      const ctx = makeIdentityContext({
        organizationId: 'org-1',
        orgName: 'My Org',
        isPlatformAdmin: false,
      });
      await service.initialize(ctx);

      service.switchToPlatformView();

      expect(service.activeOrganizationId()).toBe('org-1');
    });
  });

  describe('resetToOwnOrg', () => {
    it('should set active org to user own org for Platform Admin', async () => {
      const ctx = makeIdentityContext({
        organizationId: 'snap',
        orgName: 'SNAP',
        isPlatformAdmin: true,
      });
      await service.initialize(ctx);
      service.switchOrg('foreign', 'Foreign');

      service.resetToOwnOrg();

      expect(service.activeOrganizationId()).toBe('snap');
      expect(service.activeOrganizationName()).toBe('SNAP');

      const stored = JSON.parse(sessionStorage.getItem(SESSION_STORAGE_KEY)!);
      expect(stored).toEqual({ orgId: 'snap', orgName: 'SNAP' });
    });

    it('should set active org to user own org for Org Admin', async () => {
      const ctx = makeIdentityContext({
        organizationId: 'org-1',
        orgName: 'My Org',
        isPlatformAdmin: false,
      });
      await service.initialize(ctx);

      service.resetToOwnOrg();

      expect(service.activeOrganizationId()).toBe('org-1');
      expect(service.activeOrganizationName()).toBe('My Org');
    });
  });
});
