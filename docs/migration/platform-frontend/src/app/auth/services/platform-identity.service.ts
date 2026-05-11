import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RuntimeConfigService } from '../../services/runtime-config.service';

/**
 * Calls identity-service `/api/v1/identity/me` to trigger JIT user provisioning
 * and retrieve the full platform identity context (roles, sections, clearance).
 *
 * The frontend currently extracts user profile from the JWT id_token.
 * This service ensures the identity-service has a local user record
 * (JIT provisioning) and provides the enriched platform context.
 */
@Injectable({ providedIn: 'root' })
export class PlatformIdentityService {
  private readonly http = inject(HttpClient);
  private readonly configService = inject(RuntimeConfigService);

  /**
   * Fetch the authenticated user's platform identity context.
   * Triggers JIT provisioning on the backend if no local record exists.
   *
   * This is fire-and-forget from the login flow perspective — login
   * succeeds regardless of whether this call completes. The call ensures
   * the backend user record is created for subsequent API interactions.
   */
  async fetchMyIdentity(): Promise<unknown> {
    const url = `${this.configService.config.identityServiceUrl}/me`;
    return firstValueFrom(this.http.get(url));
  }
}
