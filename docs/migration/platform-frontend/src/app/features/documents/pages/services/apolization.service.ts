import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { DocumentMention } from '../models/document.models';
import { ApolloizePayload, ReviewMentionPayload } from '../models/document.payloads';
import { ApiService } from '../../../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class ApolizationService {
  private readonly api = inject(ApiService);

  apolloize(docId: string, payload: ApolloizePayload): Observable<ApiResponse<DocumentMention[]>> {
    return this.api.post<DocumentMention[]>(`/documents/${docId}/apolloize`, payload);
  }

  getMentions(docId: string): Observable<ApiResponse<DocumentMention[]>> {
    return this.api.get<DocumentMention[]>(`/documents/${docId}/mentions`);
  }

  reviewMention(
    docId: string,
    mentionId: string,
    payload: ReviewMentionPayload,
  ): Observable<ApiResponse<DocumentMention>> {
    return this.api.put<DocumentMention>(`/documents/${docId}/mentions/${mentionId}`, payload);
  }
}
