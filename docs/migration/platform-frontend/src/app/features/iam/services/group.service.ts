import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import {
  GroupResponse,
  GroupCreate,
  GroupUpdate,
  GroupMemberResponse,
  GroupMemberCreate,
  GroupTreeNode,
} from '../models/permission.model';
import { PaginatedResponse, PaginationParams } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class GroupService {
  private readonly http = inject(HttpClient);
  private readonly cfg = inject(RuntimeConfigService);
  private readonly apiUrl = `${this.cfg.config.permissionServiceUrl}/groups`;

  listGroups(params: PaginationParams): Observable<PaginatedResponse<GroupResponse>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<PaginatedResponse<GroupResponse>>(this.apiUrl, { params: httpParams });
  }

  getGroup(groupId: string): Observable<GroupResponse> {
    return this.http.get<GroupResponse>(`${this.apiUrl}/${groupId}`);
  }

  createGroup(body: GroupCreate): Observable<GroupResponse> {
    return this.http.post<GroupResponse>(this.apiUrl, body);
  }

  updateGroup(groupId: string, body: GroupUpdate): Observable<GroupResponse> {
    return this.http.patch<GroupResponse>(`${this.apiUrl}/${groupId}`, body);
  }

  deleteGroup(groupId: string, version: number): Observable<void> {
    const params = new HttpParams().set('version', String(version));
    return this.http.delete<void>(`${this.apiUrl}/${groupId}`, { params });
  }

  listMembers(
    groupId: string,
    params: PaginationParams,
  ): Observable<PaginatedResponse<GroupMemberResponse>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    return this.http.get<PaginatedResponse<GroupMemberResponse>>(
      `${this.apiUrl}/${groupId}/members`,
      { params: httpParams },
    );
  }

  addMember(groupId: string, body: GroupMemberCreate): Observable<GroupMemberResponse> {
    return this.http.post<GroupMemberResponse>(`${this.apiUrl}/${groupId}/members`, body);
  }

  removeMember(groupId: string, subjectId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${groupId}/members/${subjectId}`);
  }

  getGroupTree(): Observable<GroupTreeNode[]> {
    return this.http.get<GroupTreeNode[]>(`${this.apiUrl}/tree`);
  }

  getGroupsForSubject(subjectId: string): Observable<{ items: GroupResponse[]; total: number }> {
    return this.http.get<{ items: GroupResponse[]; total: number }>(
      `${this.cfg.config.permissionServiceUrl}/subjects/${subjectId}/groups`,
    );
  }
}
