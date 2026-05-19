import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RuntimeConfigService } from '../../../services/runtime-config.service';

/**
 * Response wrapper for the prototype's mock backend.
 * The real services return data directly or wrapped in { data, success }.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface RequestOptions {
  params?: HttpParams | { [key: string]: string | string[] };
}

/**
 * Backend service base URLs.
 *
 * The BPMS prototype used a single mock backend. The real platform splits
 * responsibilities across multiple services:
 *
 * - workflow-service  → definitions, instances, assignments, work queue, comments, dissemination
 * - document-service  → documents, processes, templates, tramitations
 * - identity-service  → org units, profiles, users, sections
 *
 * Endpoints that exist ONLY in the prototype mock (visual-flows, step-catalog,
 * role-catalog, document-types CRUD) are routed to the workflow-service for now.
 * These will need corresponding backend endpoints to be implemented.
 */
const BACKENDS = {
  document: '/api/v1/documents',
  documentType: '/api/v1/documents/types',
  process: '/api/v1/processes',
  template: '/api/v1/documents/templates',
  tramitation: '/api/v1/tramitations',
  identity: '/api/v1/identity',
} as const;

@Injectable({ providedIn: 'root' })
export class WorkflowApiBaseService {
  private readonly http = inject(HttpClient);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  private get workflowBase(): string {
    return this.runtimeConfig.config.workflowServiceUrl ?? '/api/v1/workflows';
  }

  // --- Workflow-service calls ---

  workflowGet<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<T>(`${this.workflowBase}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  workflowPost<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .post<T>(`${this.workflowBase}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  workflowPut<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .put<T>(`${this.workflowBase}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  workflowDelete<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .delete<T>(`${this.workflowBase}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  // --- Document-service calls ---

  documentGet<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<T>(`${BACKENDS.document}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  documentPost<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .post<T>(`${BACKENDS.document}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  documentPut<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .put<T>(`${BACKENDS.document}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  // --- Document-type calls (document-service /api/v1/document-types) ---

  documentTypeGet<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<T>(`${BACKENDS.documentType}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  documentTypePost<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .post<T>(`${BACKENDS.documentType}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  documentTypePut<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .put<T>(`${BACKENDS.documentType}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  // --- Process calls (document-service) ---

  processGet<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<T>(`${BACKENDS.process}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  processPost<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .post<T>(`${BACKENDS.process}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  processPut<T>(path: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .put<T>(`${BACKENDS.process}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  processDelete<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .delete<T>(`${BACKENDS.process}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  // --- Template calls (document-service) ---

  templateGet<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<T>(`${BACKENDS.template}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  templatePost<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .post<T>(`${BACKENDS.template}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  templatePut<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .put<T>(`${BACKENDS.template}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  // --- Tramitation calls (document-service) ---

  tramitationGet<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<T>(`${BACKENDS.tramitation}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  tramitationPost<T>(
    path: string,
    body: unknown,
    options?: RequestOptions,
  ): Observable<ApiResponse<T>> {
    return this.http
      .post<T>(`${BACKENDS.tramitation}${path}`, body, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  // --- Identity-service calls ---

  identityGet<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<T>(`${BACKENDS.identity}${path}`, options)
      .pipe(map((res) => this.wrap<T>(res)));
  }

  // --- Legacy compatibility (for visual-bpms-api.service.ts) ---
  // These route to workflow-service since visual-flow endpoints will be added there.

  get<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.workflowGet<T>(path, options);
  }

  post<T>(path: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.workflowPost<T>(path, body, options);
  }

  put<T>(path: string, body: unknown, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.workflowPut<T>(path, body, options);
  }

  delete<T>(path: string, options?: RequestOptions): Observable<ApiResponse<T>> {
    return this.workflowDelete<T>(path, options);
  }

  /**
   * Wrap raw backend response into ApiResponse shape.
   *
   * document-service wraps responses in { data, message } (SuccessResponse).
   * workflow-service returns data directly or wrapped in { items, total_count }.
   * This method normalizes both into { success, data }.
   */
  private wrap<T>(res: T): ApiResponse<T> {
    if (res && typeof res === 'object') {
      // document-service SuccessResponse: { data: T, message?: string }
      if ('data' in res && !('success' in res)) {
        return { success: true, data: (res as any).data };
      }
      // Already in ApiResponse shape: { success, data }
      if ('success' in res && 'data' in res) {
        return res as unknown as ApiResponse<T>;
      }
    }
    // Raw response (workflow-service returns data directly)
    return { success: true, data: res };
  }
}
