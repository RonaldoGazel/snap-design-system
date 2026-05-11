import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { DocumentTemplate, DocumentType } from '../models/document.models';
import { ApiService } from '../../../../shared/services/api.service';

export interface GetTemplatesParams {
  documentType?: DocumentType;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private readonly api = inject(ApiService);

  getTemplates(
    params: GetTemplatesParams = {},
  ): Observable<
    ApiResponse<{ items: DocumentTemplate[]; total: number; page: number; limit: number }>
  > {
    const q = new URLSearchParams();
    if (params.documentType) q.set('documentType', params.documentType);
    if (params.isActive !== undefined) q.set('isActive', String(params.isActive));
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.limit !== undefined) q.set('limit', String(params.limit));
    return this.api.get<{ items: DocumentTemplate[]; total: number; page: number; limit: number }>(
      `/document-templates?${q}`,
    );
  }

  getTemplate(id: string): Observable<ApiResponse<DocumentTemplate>> {
    return this.api.get<DocumentTemplate>(`/document-templates/${id}`);
  }
}
