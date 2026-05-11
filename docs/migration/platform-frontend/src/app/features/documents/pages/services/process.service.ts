import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { Process } from '../models/document.models';
import { CreateProcessPayload, UpdateProcessPayload } from '../models/document.payloads';
import { ApiService } from '../../../../shared/services/api.service';

export interface GetProcessesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  security_level?: string;
  priority?: string;
  sectorId?: string;
}

@Injectable({ providedIn: 'root' })
export class ProcessService {
  private readonly api = inject(ApiService);

  getProcesses(
    params: GetProcessesParams = {},
  ): Observable<ApiResponse<{ items: Process[]; total: number; page: number; limit: number }>> {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.limit !== undefined) q.set('limit', String(params.limit));
    if (params.search) q.set('search', params.search);
    if (params.status) q.set('status', params.status);
    if (params.security_level)
      q.set('security_level', params.security_level);
    if (params.priority) q.set('priority', params.priority);
    if (params.sectorId) q.set('sectorId', params.sectorId);
    return this.api.get<{ items: Process[]; total: number; page: number; limit: number }>(
      `/processes?${q}`,
    );
  }

  getProcess(id: string): Observable<ApiResponse<Process>> {
    return this.api.get<Process>(`/processes/${id}`);
  }

  createProcess(payload: CreateProcessPayload): Observable<ApiResponse<Process>> {
    return this.api.post<Process>('/processes', payload);
  }

  updateProcess(id: string, payload: UpdateProcessPayload): Observable<ApiResponse<Process>> {
    return this.api.put<Process>(`/processes/${id}`, payload);
  }

  deleteProcess(id: string): Observable<ApiResponse<void>> {
    return this.api.delete<void>(`/processes/${id}`);
  }
}
