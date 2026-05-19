import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import {
  RoleResponse,
  RoleCreate,
  RoleUpdate,
  RoleAssignmentResponse,
  RoleAssignmentCreate,
} from '../models/permission.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private readonly apiUrl = `${this.cfg.config.permissionServiceUrl}/roles`;

  listRoles(params: PaginationParams): Observable<PaginatedResponse<RoleResponse>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<PaginatedResponse<RoleResponse>>(this.apiUrl, { params: httpParams });
  }

  getRole(roleId: string): Observable<RoleResponse> {
    return this.http.get<RoleResponse>(`${this.apiUrl}/${roleId}`);
  }

  createRole(body: RoleCreate): Observable<RoleResponse> {
    return this.http.post<RoleResponse>(this.apiUrl, body);
  }

  updateRole(roleId: string, body: RoleUpdate): Observable<RoleResponse> {
    return this.http.put<RoleResponse>(`${this.apiUrl}/${roleId}`, body);
  }

  deleteRole(roleId: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', String(version));
    return this.http.delete<void>(`${this.apiUrl}/${roleId}`, { params });
  }

  listAssignments(
    roleId: string,
    params: PaginationParams,
  ): Observable<PaginatedResponse<RoleAssignmentResponse>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<PaginatedResponse<RoleAssignmentResponse>>(
      `${this.apiUrl}/${roleId}/assignments`,
      { params: httpParams },
    );
  }

  assignRole(roleId: string, body: RoleAssignmentCreate): Observable<RoleAssignmentResponse> {
    return this.http.post<RoleAssignmentResponse>(
      `${this.apiUrl}/${roleId}/assignments`,
      body,
    );
  }

  revokeAssignment(roleId: string, subjectId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${roleId}/assignments/${subjectId}`);
  }

  getSubjectCounts(subjectId: string): Observable<{ role_count: number; group_count: number }> {
    return this.http.get<{ role_count: number; group_count: number }>(
      `${this.cfg.config.permissionServiceUrl}/subjects/${subjectId}/counts`,
    );
  }
}
