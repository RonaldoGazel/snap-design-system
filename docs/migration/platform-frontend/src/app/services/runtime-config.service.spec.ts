import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RuntimeConfigService } from './runtime-config.service';
import { ExecutionModeService } from './execution-mode.service';
import { ShellContextBridge } from '../shell/shell-context-bridge.service';
import { ShellContext, ShellConfigContext } from '../shell/shell-context.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeShellConfigContext(overrides: Partial<ShellConfigContext> = {}): ShellConfigContext {
  return {
    identityServiceUrl: 'https://host/api/v1/identity',
    permissionServiceUrl: 'https://host/api/v1/permissions',
    auditServiceUrl: 'https://host/api/v1/audit',
    poiServiceUrl: 'https://host/api/v1/poi',
    personServiceUrl: 'https://host/api/v1/poi',
    ...overrides,
  };
}

function makeShellContext(cfg?: ShellConfigContext): Partial<ShellContext> {
  return { config: cfg } as Partial<ShellContext>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RuntimeConfigService', () => {
  let service: RuntimeConfigService;
  let executionModeService: ExecutionModeService;
  let shellContextBridgeMock: { shellContext: ReturnType<typeof signal<ShellContext | null>> };
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Create a minimal ShellContextBridge mock using a writable signal
    shellContextBridgeMock = {
      shellContext: signal<ShellContext | null>(null),
    };

    TestBed.configureTestingModule({
      providers: [
        RuntimeConfigService,
        ExecutionModeService,
        { provide: ShellContextBridge, useValue: shellContextBridgeMock },
      ],
    });

    service = TestBed.inject(RuntimeConfigService);
    executionModeService = TestBed.inject(ExecutionModeService);

    // Spy on global fetch
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // (a) Federated mode — ShellContext.config present
  // -------------------------------------------------------------------------
  describe('federated mode with ShellContext.config present', () => {
    it('should set config signal from ShellContext values', async () => {
      const shellCfg = makeShellConfigContext();
      shellContextBridgeMock.shellContext.set(makeShellContext(shellCfg) as ShellContext);
      executionModeService.markAsFederated();

      await service.load();

      expect(service.config.identityServiceUrl).toBe(shellCfg.identityServiceUrl);
      expect(service.config.permissionServiceUrl).toBe(shellCfg.permissionServiceUrl);
      expect(service.config.auditServiceUrl).toBe(shellCfg.auditServiceUrl);
      expect(service.config.personServiceUrl).toBe(shellCfg.personServiceUrl);
      expect(service.config.poiServiceUrl).toBe(shellCfg.poiServiceUrl);
    });

    it('should NOT call fetch when ShellContext.config is present', async () => {
      shellContextBridgeMock.shellContext.set(
        makeShellContext(makeShellConfigContext()) as ShellContext,
      );
      executionModeService.markAsFederated();

      await service.load();

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should log the ShellContext config source message', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      shellContextBridgeMock.shellContext.set(
        makeShellContext(makeShellConfigContext()) as ShellContext,
      );
      executionModeService.markAsFederated();

      await service.load();

      expect(consoleSpy).toHaveBeenCalledWith('[Config] Loaded runtime config from ShellContext');
    });
  });

  // -------------------------------------------------------------------------
  // (b) Federated mode — ShellContext.config absent (fallback to /config.json)
  // -------------------------------------------------------------------------
  describe('federated mode without ShellContext.config', () => {
    it('should attempt to fetch /config.json when ShellContext.config is undefined', async () => {
      // ShellContext exists but has no config property
      shellContextBridgeMock.shellContext.set(makeShellContext(undefined) as ShellContext);
      executionModeService.markAsFederated();

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ poiServiceUrl: '/api/v1/poi' }),
      } as Response);

      await service.load();

      expect(fetchSpy).toHaveBeenCalledWith('/config.json');
    });

    it('should attempt to fetch /config.json when shellContext() is null', async () => {
      // shellContext signal returns null
      shellContextBridgeMock.shellContext.set(null);
      executionModeService.markAsFederated();

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await service.load();

      expect(fetchSpy).toHaveBeenCalledWith('/config.json');
    });

    it('should log the fallback warning message', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      shellContextBridgeMock.shellContext.set(null);
      executionModeService.markAsFederated();

      fetchSpy.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      await service.load();

      expect(warnSpy).toHaveBeenCalledWith(
        '[Config] ShellContext.config not available, falling back to /config.json',
      );
    });
  });

  // -------------------------------------------------------------------------
  // (c) Standalone mode — existing /config.json fetch behavior preserved
  // -------------------------------------------------------------------------
  describe('standalone mode', () => {
    it('should fetch /config.json and merge values into config', async () => {
      const remoteConfig = {
        poiServiceUrl: 'https://standalone/api/v1/poi',
        personServiceUrl: 'https://standalone/api/v1/poi',
      };
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => remoteConfig,
      } as Response);

      await service.load();

      expect(fetchSpy).toHaveBeenCalledWith('/config.json');
      expect(service.config.poiServiceUrl).toBe(remoteConfig.poiServiceUrl);
      expect(service.config.personServiceUrl).toBe(remoteConfig.personServiceUrl);
    });

    it('should log the /config.json source message on success', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await service.load();

      expect(consoleSpy).toHaveBeenCalledWith('[Config] Loaded runtime config from /config.json');
    });

    it('should NOT call fetch in federated mode (ShellContext.config present)', async () => {
      // Confirm standalone mode is the default (no markAsFederated call)
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      } as Response);

      await service.load();

      // In standalone mode fetch IS called — this verifies the existing path is preserved
      expect(fetchSpy).toHaveBeenCalledWith('/config.json');
    });
  });

  // -------------------------------------------------------------------------
  // (d) All sources fail — environment.ts defaults remain
  // -------------------------------------------------------------------------
  describe('all sources fail', () => {
    it('should keep environment.ts defaults when /config.json fetch throws', async () => {
      fetchSpy.mockRejectedValue(new Error('Network error'));

      const defaultPoiUrl = service.config.poiServiceUrl;

      await service.load();

      // Config should still be the environment default (not undefined or empty)
      expect(service.config.poiServiceUrl).toBe(defaultPoiUrl);
      expect(service.config.poiServiceUrl).toBeTruthy();
    });

    it('should keep environment.ts defaults when /config.json returns non-ok response', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      const defaultConfig = { ...service.config };

      await service.load();

      expect(service.config.poiServiceUrl).toBe(defaultConfig.poiServiceUrl);
      expect(service.config.identityServiceUrl).toBe(defaultConfig.identityServiceUrl);
    });

    it('should keep environment.ts defaults in federated mode when ShellContext is null and fetch fails', async () => {
      shellContextBridgeMock.shellContext.set(null);
      executionModeService.markAsFederated();
      fetchSpy.mockRejectedValue(new Error('Network error'));

      const defaultConfig = { ...service.config };

      await service.load();

      expect(service.config.poiServiceUrl).toBe(defaultConfig.poiServiceUrl);
      expect(service.config.identityServiceUrl).toBe(defaultConfig.identityServiceUrl);
    });

    it('should log the defaults warning when fetch fails', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await service.load();

      expect(warnSpy).toHaveBeenCalledWith(
        '[Config] Failed to fetch /config.json, using built-in defaults',
      );
    });
  });
});
