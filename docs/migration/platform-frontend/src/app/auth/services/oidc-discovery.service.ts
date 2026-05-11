import { Injectable, inject } from '@angular/core';
import { AuthError } from '../models/auth-errors.model';
import { RuntimeConfigService } from '../../services/runtime-config.service';

export interface OidcConfiguration {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  revocation_endpoint?: string;
  jwks_uri: string;
}

@Injectable({ providedIn: 'root' })
export class OidcDiscoveryService {
  private readonly runtimeConfig = inject(RuntimeConfigService);
  private config: OidcConfiguration | null = null;

  async discover(): Promise<OidcConfiguration> {
    if (this.config) {
      return this.config;
    }

    const { baseUrl, realm } = this.runtimeConfig.config.keycloak;
    if (!baseUrl || !realm) {
      throw new AuthError(
        'config_error',
        'Missing keycloak baseUrl or realm in environment config',
      );
    }

    const expectedIssuer = `${baseUrl}/realms/${realm}`;
    const discoveryUrl = `${expectedIssuer}/.well-known/openid-configuration`;
    const backoffDelays = [2000, 4000, 8000];

    let lastError: unknown;

    for (let attempt = 0; attempt <= backoffDelays.length; attempt++) {
      try {
        const response = await fetch(discoveryUrl, { redirect: 'error' });

        if (!response.ok) {
          throw new Error(`Discovery endpoint returned ${response.status}`);
        }

        const data = await response.json();
        this.validateDiscoveryResponse(data, expectedIssuer);
        this.config = data as OidcConfiguration;
        return this.config;
      } catch (err) {
        lastError = err;
        if (err instanceof AuthError) {
          throw err;
        }
        if (attempt < backoffDelays.length) {
          await this.delay(backoffDelays[attempt]);
        }
      }
    }

    throw new AuthError('discovery_failed', 'OIDC discovery failed after 3 retries', lastError);
  }

  get authorizationEndpoint(): string {
    return this.requireConfig().authorization_endpoint;
  }

  get tokenEndpoint(): string {
    return this.requireConfig().token_endpoint;
  }

  get endSessionEndpoint(): string {
    return this.requireConfig().end_session_endpoint;
  }

  get revocationEndpoint(): string | null {
    return this.config?.revocation_endpoint ?? null;
  }

  get jwksUri(): string {
    return this.requireConfig().jwks_uri;
  }

  private requireConfig(): OidcConfiguration {
    if (!this.config) {
      throw new AuthError('discovery_failed', 'OIDC discovery has not been performed yet');
    }
    return this.config;
  }

  private validateDiscoveryResponse(data: Record<string, unknown>, expectedIssuer: string): void {
    if (data['issuer'] !== expectedIssuer) {
      throw new AuthError(
        'discovery_failed',
        `Issuer mismatch: expected ${expectedIssuer}, got ${data['issuer']}`,
      );
    }

    const issuerOrigin = new URL(expectedIssuer).origin;
    const endpointKeys = [
      'authorization_endpoint',
      'token_endpoint',
      'end_session_endpoint',
      'revocation_endpoint',
      'jwks_uri',
    ];

    for (const key of endpointKeys) {
      const value = data[key];
      if (typeof value !== 'string') continue; // revocation_endpoint may be absent
      const endpointOrigin = new URL(value).origin;
      if (endpointOrigin !== issuerOrigin) {
        throw new AuthError(
          'discovery_failed',
          `Endpoint origin mismatch for ${key}: expected ${issuerOrigin}, got ${endpointOrigin}`,
        );
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
