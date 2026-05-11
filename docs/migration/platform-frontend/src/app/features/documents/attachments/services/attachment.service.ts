import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { Attachment } from '../../../../shared/models/attachment.model';
import { ApiService } from '../../../../shared/services/api.service';
import { AuthStateService } from '../../../../shared/services/auth-state.service';
import { STORAGE_KEY_TOKEN } from '../../../../shared/utils/constants';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly authState = inject(AuthStateService);

  getAttachments(documentId: string): Observable<ApiResponse<Attachment[]>> {
    return this.api.get<Attachment[]>(`/attachments?documentId=${documentId}`);
  }

  upload(
    documentId: string,
    file: File,
    meta?: Partial<Attachment>,
  ): Observable<ApiResponse<Attachment>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', documentId);
    if (meta?.origin) formData.append('origin', meta.origin);
    if (meta?.summary) formData.append('summary', meta.summary);
    if (meta?.author) formData.append('author', meta.author);

    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
    return this.http.post<ApiResponse<Attachment>>('/api/attachments/upload', formData, {
      headers,
    });
  }

  deleteAttachment(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/attachments/${id}`);
  }

  getDownloadUrl(id: string): string {
    const token = this.authState.getToken();
    return token
      ? `/api/attachments/${id}/download?token=${token}`
      : `/api/attachments/${id}/download`;
  }

  getPreviewUrl(id: string): string {
    const token = this.authState.getToken();
    return token
      ? `/api/attachments/${id}/preview?token=${token}`
      : `/api/attachments/${id}/preview`;
  }
}
