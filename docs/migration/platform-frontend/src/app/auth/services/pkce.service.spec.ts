import { TestBed } from '@angular/core/testing';
import { PkceService } from './pkce.service';
import { AuthError } from '../models/auth-errors.model';

describe('PkceService', () => {
  let service: PkceService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PkceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateCodeVerifier()', () => {
    it('should produce a string of valid length (43-128 chars)', () => {
      const verifier = service.generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });

    it('should store the verifier internally', () => {
      const verifier = service.generateCodeVerifier();
      expect(service.storedCodeVerifier).toBe(verifier);
    });
  });

  describe('deriveCodeChallenge()', () => {
    it('should produce a base64url-encoded S256 hash', async () => {
      const verifier = service.generateCodeVerifier();
      const challenge = await service.deriveCodeChallenge(verifier);
      expect(challenge).toBeTruthy();
      // base64url: no +, /, or = characters
      expect(challenge).not.toMatch(/[+/=]/);
    });

    it('should produce different challenges for different verifiers', async () => {
      const v1 = service.generateCodeVerifier();
      const c1 = await service.deriveCodeChallenge(v1);
      const v2 = service.generateCodeVerifier();
      const c2 = await service.deriveCodeChallenge(v2);
      expect(c1).not.toBe(c2);
    });
  });

  describe('generateState()', () => {
    it('should return a UUID and store it', () => {
      const state = service.generateState();
      expect(state).toMatch(/^[0-9a-f-]{36}$/);
      expect(service.storedState).toBe(state);
    });
  });

  describe('generateNonce()', () => {
    it('should return a UUID and store it', () => {
      const nonce = service.generateNonce();
      expect(nonce).toMatch(/^[0-9a-f-]{36}$/);
      expect(service.storedNonce).toBe(nonce);
    });
  });

  describe('clearPkceState()', () => {
    it('should wipe all stored PKCE material', () => {
      service.generateCodeVerifier();
      service.generateState();
      service.generateNonce();
      service.clearPkceState();
      expect(service.storedCodeVerifier).toBeNull();
      expect(service.storedState).toBeNull();
      expect(service.storedNonce).toBeNull();
    });
  });

  describe('decodeTokenPayload()', () => {
    function createJwt(payload: Record<string, unknown>): string {
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const sig = 'fake-signature';
      return `${header}.${body}.${sig}`;
    }

    it('should correctly parse JWT payload', () => {
      const jwt = createJwt({ sub: '123', name: 'Test User' });
      const payload = service.decodeTokenPayload(jwt);
      expect(payload['sub']).toBe('123');
      expect(payload['name']).toBe('Test User');
    });

    it('should throw AuthError for malformed JWT', () => {
      expect(() => service.decodeTokenPayload('not.a.valid.jwt.token'))
        .toThrow();
      expect(() => service.decodeTokenPayload('only-one-segment'))
        .toThrow();
    });
  });

  describe('validateNonce()', () => {
    function createIdToken(claims: Record<string, unknown>): string {
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(claims))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return `${header}.${body}.fake-sig`;
    }

    it('should not throw when nonce matches', () => {
      const token = createIdToken({ nonce: 'abc-123' });
      expect(() => service.validateNonce(token, 'abc-123')).not.toThrow();
    });

    it('should throw AuthError with invalid_token when nonce mismatches', () => {
      const token = createIdToken({ nonce: 'abc-123' });
      expect(() => service.validateNonce(token, 'wrong-nonce')).toThrowError();
      try {
        service.validateNonce(token, 'wrong-nonce');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).code).toBe('invalid_token');
      }
    });
  });

  describe('validateIssuerAndAudience()', () => {
    function createIdToken(claims: Record<string, unknown>): string {
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const body = btoa(JSON.stringify(claims))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      return `${header}.${body}.fake-sig`;
    }

    it('should not throw when issuer and audience match', () => {
      const token = createIdToken({ iss: 'https://kc.example.com/realms/test', aud: 'my-client' });
      expect(() => service.validateIssuerAndAudience(token, 'https://kc.example.com/realms/test', 'my-client'))
        .not.toThrow();
    });

    it('should throw AuthError when issuer mismatches', () => {
      const token = createIdToken({ iss: 'https://evil.com', aud: 'my-client' });
      expect(() => service.validateIssuerAndAudience(token, 'https://kc.example.com/realms/test', 'my-client')).toThrowError();
      try {
        service.validateIssuerAndAudience(token, 'https://kc.example.com/realms/test', 'my-client');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).code).toBe('invalid_token');
      }
    });

    it('should throw AuthError when audience mismatches', () => {
      const token = createIdToken({ iss: 'https://kc.example.com/realms/test', aud: 'other-client' });
      expect(() => service.validateIssuerAndAudience(token, 'https://kc.example.com/realms/test', 'my-client')).toThrowError();
      try {
        service.validateIssuerAndAudience(token, 'https://kc.example.com/realms/test', 'my-client');
      } catch (err) {
        expect(err).toBeInstanceOf(AuthError);
        expect((err as AuthError).code).toBe('invalid_token');
      }
    });

    it('should handle audience as array', () => {
      const token = createIdToken({ iss: 'https://kc.example.com/realms/test', aud: ['my-client', 'other'] });
      expect(() => service.validateIssuerAndAudience(token, 'https://kc.example.com/realms/test', 'my-client'))
        .not.toThrow();
    });
  });

  describe('buildAuthorizationUrl()', () => {
    it('should construct a valid authorization URL with all required params', () => {
      const url = service.buildAuthorizationUrl({
        authorizationEndpoint: 'https://kc.example.com/auth',
        clientId: 'my-client',
        redirectUri: 'http://localhost:4200/auth/callback',
        codeChallenge: 'challenge-abc',
        state: 'state-123',
        nonce: 'nonce-456',
      });

      const parsed = new URL(url);
      expect(parsed.origin + parsed.pathname).toBe('https://kc.example.com/auth');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('client_id')).toBe('my-client');
      expect(parsed.searchParams.get('redirect_uri')).toBe('http://localhost:4200/auth/callback');
      expect(parsed.searchParams.get('scope')).toBe('openid');
      expect(parsed.searchParams.get('code_challenge')).toBe('challenge-abc');
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('state')).toBe('state-123');
      expect(parsed.searchParams.get('nonce')).toBe('nonce-456');
    });
  });
});
