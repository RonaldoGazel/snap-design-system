import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import {
  CreateInvitationRequest,
  InvitationQueryParams,
  InvitationResponse,
} from '../models/identity.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(RuntimeConfigService).config.identityServiceUrl}`;

  listInvitations(
    orgId: string,
    params: InvitationQueryParams,
  ): Observable<PaginatedResponse<InvitationResponse>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<PaginatedResponse<InvitationResponse>>(
      `${this.baseUrl}/organizations/${orgId}/invitations`,
      { params: httpParams },
    );
  }

  createInvitation(orgId: string, body: CreateInvitationRequest): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(
      `${this.baseUrl}/organizations/${orgId}/invitations`,
      body,
    );
  }

  revokeInvitation(invitationId: string): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(
      `${this.baseUrl}/invitations/${invitationId}/revoke`,
      {},
    );
  }
}
