import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import {
  BootstrapOrganizationRequest,
  CreateOrganizationRequest,
  OrgQueryParams,
  OrgRecoveryRequest,
  OrganizationResponse,
  OwnershipTransferRequest,
  UpdateOrganizationRequest,
} from '../models/identity.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(RuntimeConfigService).config.identityServiceUrl}/organizations`;

  listOrganizations(params: OrgQueryParams): Observable<PaginatedResponse<OrganizationResponse>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<PaginatedResponse<OrganizationResponse>>(this.apiUrl, {
      params: httpParams,
    });
  }

  getOrganization(orgId: string): Observable<OrganizationResponse> {
    return this.http.get<OrganizationResponse>(`${this.apiUrl}/${orgId}`);
  }

  createOrganization(body: CreateOrganizationRequest): Observable<OrganizationResponse> {
    return this.http.post<OrganizationResponse>(this.apiUrl, body);
  }

  updateOrganization(
    orgId: string,
    body: UpdateOrganizationRequest,
  ): Observable<OrganizationResponse> {
    return this.http.patch<OrganizationResponse>(`${this.apiUrl}/${orgId}`, body);
  }

  deleteOrganization(orgId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${orgId}`);
  }

  bootstrapOrganization(
    body: BootstrapOrganizationRequest,
    idempotencyKey: string,
  ): Observable<OrganizationResponse> {
    return this.http.post<OrganizationResponse>(`${this.apiUrl}/bootstrap`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  recoverOrganization(orgId: string, body: OrgRecoveryRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${orgId}/recover`, body);
  }

  transferOwnership(orgId: string, body: OwnershipTransferRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${orgId}/transfer-ownership`, body);
  }
}
