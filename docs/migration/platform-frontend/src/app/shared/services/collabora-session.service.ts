import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WopiSession {
  editor_url: string;
  access_token: string;
  access_token_ttl: number;
  resource_id: string;
  filename: string;
}

/**
 * Service for creating Collabora Online WOPI editing sessions.
 *
 * Supports document, template, and blank-document resources:
 *   - POST /api/v1/documents/{id}/edit-session        → existing document
 *   - POST /api/v1/documents/templates/{id}/edit-session → template
 *   - POST /api/v1/documents/edit-session/blank        → new blank DOCX
 */
@Injectable({ providedIn: 'root' })
export class CollaboraSessionService {
  private readonly http = inject(HttpClient);

  private readonly endpoints: Record<string, string> = {
    document: '/api/v1/documents',
    template: '/api/v1/documents/templates',
  };

  /**
   * Create a WOPI editing session for the given resource.
   *
   * @param resourceType - 'document', 'template', or 'blank'
   * @param resourceId   - UUID of the resource (ignored for 'blank')
   */
  createEditSession(
    resourceType: 'document' | 'template' | 'blank',
    resourceId: string,
  ): Observable<WopiSession> {
    if (resourceType === 'blank') {
      return this.http.post<WopiSession>('/api/v1/documents/templates/blank/edit-session', {});
    }
    const base = this.endpoints[resourceType];
    return this.http.post<WopiSession>(`${base}/${resourceId}/edit-session`, {});
  }
}
