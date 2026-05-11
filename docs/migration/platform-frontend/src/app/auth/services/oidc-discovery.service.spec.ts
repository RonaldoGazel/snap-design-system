import { TestBed } from '@angular/core/testing';
import { OidcDiscoveryService } from './oidc-discovery.service';
import { AuthError } from '../models/auth-errors.model';

const MOCK_DISCOVERY = {
  issuer: 'http://localhost:8180/realms/platform',
  authorization_endpoint: 'http://localhost:8180/realms/platform/protocol/openid-connect/auth',
  token_endpoint: 'http://localhost:8180/realms/platform/protocol/openid-connect/token',
  end_session_endpoint: 'http://localhost:8180/realms/platform/protocol/openid-connect/logout',
  revocation_endpoint: 'http://localhost:8180/realms/platform/protocol/openid-connect/revoke',
  jwks_uri: 'http://localhost:8180/realms/platform/protocol/openid-connect/certs',
};

describe('OidcDiscoveryService', () => {
  let service: OidcDiscoveryService;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OidcDiscoveryService);
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
    // Reset cached config
    (service as any).config = null;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch and cache discovery config on success', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(MOCK_DISCOVERY), { status: 200 }));

    const config = await service.discover();
    expect(config.issuer).toBe(MOCK_DISCOVERY.issuer);
    expect(service.authorizationEndpoint).toBe(MOCK_DISCOVERY.authorization_endpoint);
    expect(service.tokenEndpoint).toBe(MOCK_DISCOVERY.token_endpoint);
    expect(service.endSessionEndpoint).toBe(MOCK_DISCOVERY.end_session_endpoint);
    expect(service.revocationEndpoint).toBe(MOCK_DISCOVERY.revocation_endpoint);
    expect(service.jwksUri).toBe(MOCK_DISCOVERY.jwks_uri);

    // Second call should use cache
    await service.discover();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('should reject mismatched issuer', async () => {
    const badConfig = { ...MOCK_DISCOVERY, issuer: 'https://evil.com/realms/platform' };
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(badConfig), { status: 200 }));

    try {
      await service.discover();
      expect.unreachable('Expected AuthError');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('discovery_failed');
    }
  });

  it('should reject cross-origin endpoints', async () => {
    const badConfig = {
      ...MOCK_DISCOVERY,
      token_endpoint: 'https://evil.com/token',
    };
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(badConfig), { status: 200 }));

    try {
      await service.discover();
      expect.unreachable('Expected AuthError');
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      expect((err as AuthError).code).toBe('discovery_failed');
    }
  });

  it('should retry with exponential backoff on fetch failure', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(new Response(JSON.stringify(MOCK_DISCOVERY), { status: 200 }));

    // Mock delay to avoid real waits
    const delaySpy = vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);

    const config = await service.discover();
    expect(config.issuer).toBe(MOCK_DISCOVERY.issuer);
    expect(fetchSpy).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    expect(delaySpy).toHaveBeenCalledWith(2000);
    expect(delaySpy).toHaveBeenCalledWith(4000);
    expect(delaySpy).toHaveBeenCalledWith(8000);

    delaySpy.mockRestore();
  });

  it('should throw discovery_failed after all retries exhausted', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'));
    const delaySpy = vi.spyOn(service as any, 'delay').mockResolvedValue(undefined);

    await expect(service.discover()).rejects.toThrow(AuthError);

    expect(fetchSpy).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
    delaySpy.mockRestore();
  });

  it('should use redirect: error to reject redirected responses', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(MOCK_DISCOVERY), { status: 200 }));
    await service.discover();

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ redirect: 'error' }),
    );
  });

  it('should throw when accessing endpoints before discovery', () => {
    expect(() => service.authorizationEndpoint).toThrow();
    expect(() => service.tokenEndpoint).toThrow();
    expect(() => service.endSessionEndpoint).toThrow();
    expect(() => service.jwksUri).toThrow();
  });
});
