import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { Attachment, Document, DocumentVersion } from '../models/document.models';
import { CreateDocumentPayload, UpdateDocumentPayload } from '../models/document.payloads';
import { ApiService } from '../../../../shared/services/api.service';

export interface GetDocumentsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  type?: string;
  security_level?: string;
}

export interface UploadAttachmentMetadata {
  documentId: string;
  origin?: string;
  ocrProcessed?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  // -- Documents CRUD -----------------------------------------------------

  getDocuments(
    processId: string,
    params: GetDocumentsParams = {},
  ): Observable<ApiResponse<{ items: Document[]; total: number; page: number; limit: number }>> {
    const q = new URLSearchParams();
    q.set('processId', processId);
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.limit !== undefined) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.status) q.set('status', params.status);
    if (params.type) q.set('type', params.type);
    if (params.security_level)
      q.set('security_level', params.security_level);
    return this.api.get<{ items: Document[]; total: number; page: number; limit: number }>(
      `/documents?${q}`,
    );
  }

  getDocument(docId: string): Observable<ApiResponse<Document>> {
    return this.api.get<Document>(`/documents/${docId}`);
  }

  createDocument(
    payload: CreateDocumentPayload & { processId: string },
  ): Observable<ApiResponse<Document>> {
    return this.api.post<Document>('/documents', payload);
  }

  updateDocument(docId: string, payload: UpdateDocumentPayload): Observable<ApiResponse<Document>> {
    return this.api.put<Document>(`/documents/${docId}`, payload);
  }

  deleteDocument(docId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/documents/${docId}`);
  }

  // -- Versions -----------------------------------------------------------

  getVersions(docId: string): Observable<ApiResponse<DocumentVersion[]>> {
    return this.api.get<DocumentVersion[]>(`/documents/${docId}/versions`);
  }

  getVersion(docId: string, versionId: string): Observable<ApiResponse<DocumentVersion>> {
    return this.api.get<DocumentVersion>(`/documents/${docId}/versions/${versionId}`);
  }

  // -- Attachments --------------------------------------------------------

  getAttachments(docId: string): Observable<ApiResponse<Attachment[]>> {
    return this.api.get<Attachment[]>(`/attachments?documentId=${docId}`);
  }

  uploadAttachment(
    file: File,
    metadata: UploadAttachmentMetadata,
  ): Observable<ApiResponse<Attachment>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', metadata.documentId);
    if (metadata.origin) formData.append('origin', metadata.origin);
    if (metadata.ocrProcessed !== undefined)
      formData.append('ocrProcessed', String(metadata.ocrProcessed));
    return this.api.post<Attachment>('/attachments/upload', formData);
  }

  deleteAttachment(attachmentId: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/attachments/${attachmentId}`);
  }

  // -- DOCX / Collabora editing -------------------------------------------

  /**
   * Upload a DOCX file to a document for Collabora-based editing.
   */
  uploadDocx(docId: string, file: File): Observable<ApiResponse<Document>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.api.post<Document>(`/documents/${docId}/upload`, formData);
  }

  /**
   * Download the DOCX file associated with a document.
   */
  downloadDocx(docId: string): Observable<Blob> {
    return this.http.get(`/api/v1/documents/${docId}/download`, { responseType: 'blob' });
  }
}
