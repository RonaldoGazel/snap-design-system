/**
 * Integration tests against a live Keycloak instance.
 *
 * Prerequisites:
 *   - Keycloak running at http://localhost:8180
 *   - Realm "platform" imported with platform-frontend client
 *
 * These tests verify real HTTP interactions with Keycloak endpoints.
 * They do NOT require a test user — they test infrastructure-level
 * concerns (discovery, PKCE, error handling, JWKS, revocation).
 *
 * Token exchange and refresh tests require a valid authorization code
 * which needs a browser login flow (Patchright/Playwright E2E).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { environment } from '../../../environments/environment';

const KEYCLOAK_BASE = environment.keycloak.baseUrl;
const REALM = environment.keycloak.realm;
const CLIENT_ID = environment.keycloak.clientId;
const ISSUER = `${KEYCLOAK_BASE}/realms/${REALM}`;
const DISCOVERY_URL = `${ISSUER}/.well-known/openid-configuration`;

// Helper: base64url encode
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = '';
  for (const byte of buffer) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper: generate PKCE code verifier
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

// Helper: derive S256 code challenge
async function deriveCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

describe('Keycloak Integration Tests', () => {
  let discoveryDoc: Record<string, unknown>;

  beforeAll(async () => {
    // Verify Keycloak is reachable before running tests
    const response = await fetch(DISCOVERY_URL);
    if (!response.ok) {
      throw new Error(`Keycloak not reachable at ${DISCOVERY_URL}: ${response.status}`);
    }
    discoveryDoc = await response.json();
  });

  // ─── OIDC Discovery ───────────────────────────────────────────────

  describe('OIDC Discovery', () => {
    it('should return a valid discovery document', () => {
      expect(discoveryDoc).toBeDefined();
      expect(discoveryDoc['issuer']).toBe(ISSUER);
    });

    it('should contain all required endpoints', () => {
      expect(discoveryDoc['authorization_endpoint']).toContain('/protocol/openid-connect/auth');
      expect(discoveryDoc['token_endpoint']).toContain('/protocol/openid-connect/token');
      expect(discoveryDoc['end_session_endpoint']).toContain('/protocol/openid-connect/logout');
      expect(discoveryDoc['jwks_uri']).toContain('/protocol/openid-connect/certs');
    });

    it('should expose a revocation endpoint', () => {
      expect(discoveryDoc['revocation_endpoint']).toContain('/protocol/openid-connect/revoke');
    });

    it('should have all endpoint origins matching the issuer origin', () => {
      const issuerOrigin = new URL(ISSUER).origin;
      const endpointKeys = [
        'authorization_endpoint',
        'token_endpoint',
        'end_session_endpoint',
        'jwks_uri',
        'revocation_endpoint',
      ];
      for (const key of endpointKeys) {
        const value = discoveryDoc[key] as string;
        if (value) {
          expect(new URL(value).origin).toBe(issuerOrigin);
        }
      }
    });

    it('should advertise S256 as a supported PKCE code challenge method', () => {
      const methods = discoveryDoc['code_challenge_methods_supported'] as string[];
      expect(methods).toContain('S256');
    });

    it('should advertise authorization_code as a supported grant type', () => {
      const grantTypes = discoveryDoc['grant_types_supported'] as string[];
      expect(grantTypes).toContain('authorization_code');
    });

    it('should advertise openid as a supported scope', () => {
      const scopes = discoveryDoc['scopes_supported'] as string[];
      expect(scopes).toContain('openid');
    });

    it('should return consistent results on repeated calls (caching)', async () => {
      const response = await fetch(DISCOVERY_URL);
      const secondDoc = await response.json();
      expect(secondDoc['issuer']).toBe(discoveryDoc['issuer']);
      expect(secondDoc['token_endpoint']).toBe(discoveryDoc['token_endpoint']);
    });

    it('should reject fetch with redirect: error if server redirects', async () => {
      // Keycloak should NOT redirect the discovery endpoint, so this should succeed
      const response = await fetch(DISCOVERY_URL, { redirect: 'error' });
      expect(response.ok).toBe(true);
    });
  });

  // ─── JWKS Endpoint ────────────────────────────────────────────────

  describe('JWKS Endpoint', () => {
    it('should return a valid JWKS with at least one RSA key', async () => {
      const jwksUri = discoveryDoc['jwks_uri'] as string;
      const response = await fetch(jwksUri);
      expect(response.ok).toBe(true);

      const jwks = await response.json();
      expect(jwks.keys).toBeDefined();
      expect(jwks.keys.length).toBeGreaterThan(0);

      const rsaKey = jwks.keys.find((k: Record<string, unknown>) => k['kty'] === 'RSA' && k['use'] === 'sig');
      expect(rsaKey).toBeDefined();
      expect(rsaKey['n']).toBeDefined();
      expect(rsaKey['e']).toBeDefined();
    });

    it('should include a kid (key ID) for key rotation support', async () => {
      const jwksUri = discoveryDoc['jwks_uri'] as string;
      const response = await fetch(jwksUri);
      const jwks = await response.json();

      for (const key of jwks.keys) {
        expect(key['kid']).toBeDefined();
        expect(typeof key['kid']).toBe('string');
      }
    });
  });

  // ─── PKCE Flow Mechanics ──────────────────────────────────────────

  describe('PKCE Flow Mechanics', () => {
    it('should generate a valid code verifier (43-128 chars, URL-safe)', () => {
      const verifier = generateCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
      expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should derive a deterministic S256 code challenge', async () => {
      const verifier = 'test-verifier-for-deterministic-check-1234567890abc';
      const challenge1 = await deriveCodeChallenge(verifier);
      const challenge2 = await deriveCodeChallenge(verifier);
      expect(challenge1).toBe(challenge2);
      expect(challenge1).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should build a valid authorization URL with all required params', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await deriveCodeChallenge(verifier);
      const state = crypto.randomUUID();
      const nonce = crypto.randomUUID();

      const authEndpoint = discoveryDoc['authorization_endpoint'] as string;
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: environment.keycloak.redirectUri,
        scope: 'openid',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state,
        nonce,
      });

      const authUrl = `${authEndpoint}?${params.toString()}`;
      const parsed = new URL(authUrl);

      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('client_id')).toBe(CLIENT_ID);
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
      expect(parsed.searchParams.get('state')).toBe(state);
      expect(parsed.searchParams.get('nonce')).toBe(nonce);
      expect(parsed.searchParams.get('scope')).toBe('openid');
    });
  });

  // ─── Token Endpoint Error Handling ────────────────────────────────

  describe('Token Endpoint Error Handling', () => {
    it('should reject an invalid authorization code with 400', async () => {
      const tokenEndpoint = discoveryDoc['token_endpoint'] as string;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'invalid-code-that-does-not-exist',
        code_verifier: generateCodeVerifier(),
        redirect_uri: environment.keycloak.redirectUri,
        client_id: CLIENT_ID,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      expect(response.status).toBe(400);
      const errorBody = await response.json();
      expect(errorBody.error).toBeDefined();
    });

    it('should reject a refresh with an invalid refresh token', async () => {
      const tokenEndpoint = discoveryDoc['token_endpoint'] as string;
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: 'invalid-refresh-token',
        client_id: CLIENT_ID,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      expect(response.status).toBe(400);
      const errorBody = await response.json();
      expect(errorBody.error).toBe('invalid_grant');
    });

    it('should reject an unknown client_id', async () => {
      const tokenEndpoint = discoveryDoc['token_endpoint'] as string;
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code: 'any-code',
        code_verifier: generateCodeVerifier(),
        redirect_uri: 'http://localhost:4200/auth/callback',
        client_id: 'nonexistent-client-id',
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      // Keycloak returns 401 for unknown clients (unauthorized)
      expect([400, 401]).toContain(response.status);
    });

    it('should reject direct grant (password flow) — disabled by design', async () => {
      const tokenEndpoint = discoveryDoc['token_endpoint'] as string;
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        username: 'anyuser',
        password: 'anypassword',
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      // Direct grant is disabled in the realm — should fail
      expect(response.ok).toBe(false);
    });
  });

  // ─── Revocation Endpoint ──────────────────────────────────────────

  describe('Revocation Endpoint', () => {
    it('should accept a revocation request for an invalid token without error', async () => {
      const revocationEndpoint = discoveryDoc['revocation_endpoint'] as string;
      const body = new URLSearchParams({
        token: 'invalid-token-to-revoke',
        token_type_hint: 'refresh_token',
        client_id: CLIENT_ID,
      });

      const response = await fetch(revocationEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      // RFC 7009: revocation of an invalid token should return 200
      expect(response.status).toBe(200);
    });
  });

  // ─── Client Configuration Verification ────────────────────────────

  describe('Client Configuration', () => {
    it('should allow authorization request for platform-frontend client', async () => {
      const authEndpoint = discoveryDoc['authorization_endpoint'] as string;
      const verifier = generateCodeVerifier();
      const challenge = await deriveCodeChallenge(verifier);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: environment.keycloak.redirectUri,
        scope: 'openid',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: crypto.randomUUID(),
        nonce: crypto.randomUUID(),
      });

      // Follow the auth URL — Keycloak should return a login page (302 or 200),
      // NOT a client-not-found error
      const response = await fetch(`${authEndpoint}?${params.toString()}`, {
        redirect: 'manual',
      });

      // Keycloak returns 200 (login page) or 302 (redirect to login)
      // A 400 would mean the client or redirect_uri is invalid
      expect([200, 302]).toContain(response.status);
    });

    it('should reject an invalid redirect_uri for platform-frontend', async () => {
      const authEndpoint = discoveryDoc['authorization_endpoint'] as string;
      const verifier = generateCodeVerifier();
      const challenge = await deriveCodeChallenge(verifier);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: 'http://evil.example.com/callback',
        scope: 'openid',
        code_challenge: challenge,
        code_challenge_method: 'S256',
        state: crypto.randomUUID(),
        nonce: crypto.randomUUID(),
      });

      const response = await fetch(`${authEndpoint}?${params.toString()}`, {
        redirect: 'manual',
      });

      // Keycloak should reject with an error page (not redirect to the evil URI)
      // It typically returns 400 for invalid redirect_uri
      // Some versions return 200 with an error page body
      const body = await response.text();
      // Either a 400 status or the body contains "Invalid parameter: redirect_uri"
      const isRejected = response.status === 400 ||
        body.includes('Invalid parameter') ||
        body.includes('invalid_redirect_uri') ||
        body.includes('Invalid redirect uri');
      expect(isRejected).toBe(true);
    });
  });

  // ─── Security Headers ─────────────────────────────────────────────

  describe('Security Headers', () => {
    it('should return security headers on discovery endpoint', async () => {
      const response = await fetch(DISCOVERY_URL);
      // Keycloak should set X-Content-Type-Options
      const xContentType = response.headers.get('x-content-type-options');
      if (xContentType) {
        expect(xContentType).toBe('nosniff');
      }
    });

    it('should set X-Frame-Options or CSP frame-ancestors on auth endpoint', async () => {
      const authEndpoint = discoveryDoc['authorization_endpoint'] as string;
      const response = await fetch(authEndpoint, { redirect: 'manual' });

      const xFrameOptions = response.headers.get('x-frame-options');
      const csp = response.headers.get('content-security-policy');

      // At least one framing protection should be present
      const hasFrameProtection =
        (xFrameOptions !== null) ||
        (csp !== null && csp.includes('frame-ancestors'));

      expect(hasFrameProtection).toBe(true);
    });
  });
});
