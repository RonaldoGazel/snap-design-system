import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { InternalDissemination, ExternalDissemination } from '../models/document.models';
import {
  CreateInternalDisseminationPayload,
  CreateExternalDisseminationPayload,
} from '../models/document.payloads';
import { ApiService } from '../../../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class DisseminationService {
  private readonly api = inject(ApiService);

  disseminateInternal(
    docId: string,
    payload: CreateInternalDisseminationPayload,
  ): Observable<ApiResponse<InternalDissemination>> {
    return this.api.post<InternalDissemination>(
      `/documents/${docId}/disseminate/internal`,
      payload,
    );
  }

  disseminateExternal(
    docId: string,
    payload: CreateExternalDisseminationPayload,
  ): Observable<ApiResponse<ExternalDissemination>> {
    return this.api.post<ExternalDissemination>(
      `/documents/${docId}/disseminate/external`,
      payload,
    );
  }

  getInternalDisseminations(docId: string): Observable<ApiResponse<InternalDissemination[]>> {
    return this.api.get<InternalDissemination[]>(`/documents/${docId}/disseminations/internal`);
  }

  getExternalDisseminations(docId: string): Observable<ApiResponse<ExternalDissemination[]>> {
    return this.api.get<ExternalDissemination[]>(`/documents/${docId}/disseminations/external`);
  }
}
