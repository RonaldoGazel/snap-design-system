import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { FinalArtifact, IntegrityVerification } from '../models/document.models';
import { ApiService } from '../../../../shared/services/api.service';

@Injectable({ providedIn: 'root' })
export class FormalizationService {
  private readonly api = inject(ApiService);

  formalizeDocument(docId: string): Observable<ApiResponse<FinalArtifact>> {
    return this.api.post<FinalArtifact>(`/documents/${docId}/formalize`, {});
  }

  verifyIntegrity(docId: string): Observable<ApiResponse<IntegrityVerification>> {
    return this.api.get<IntegrityVerification>(`/documents/${docId}/verify-integrity`);
  }
}
