import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

export interface RuntimeConfig {
  keycloak: {
    baseUrl: string;
    realm: string;
    clientId: string;
    redirectUri: string;
    postLogoutRedirectUri: string;
  };
  identityServiceUrl: string;
  permissionServiceUrl: string;
  auditServiceUrl: string;
  personServiceUrl: string;
  poiServiceUrl: string;
  workflowServiceUrl: string;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private _config = signal<RuntimeConfig>({
    keycloak: environment.keycloak,
    identityServiceUrl: environment.identityServiceUrl,
    permissionServiceUrl: environment.permissionServiceUrl,
    auditServiceUrl: environment.auditServiceUrl,
    personServiceUrl: environment.personServiceUrl,
    poiServiceUrl: environment.poiServiceUrl,
    workflowServiceUrl: (environment as any).workflowServiceUrl ?? '/api/v1/workflows',
  });

  get config(): RuntimeConfig {
    return this._config();
  }

  async load(): Promise<void> {
    await this.loadFromConfigJson();
  }

  private async loadFromConfigJson(): Promise<void> {
    try {
      const response = await fetch('/config.json');
      if (response.ok) {
        const remote = await response.json();
        this._config.set({ ...this._config(), ...remote });
        console.log('[Config] Loaded runtime config from /config.json');
      } else {
        console.warn('[Config] /config.json not found, using built-in defaults');
      }
    } catch {
      console.warn('[Config] Failed to fetch /config.json, using built-in defaults');
    }
  }
}
