import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import {
  CreateUserRequest,
  ResetPasswordRequest,
  UpdateUserRequest,
  UserQueryParams,
  UserResponse,
} from '../models/identity.model';
import { PaginatedResponse } from '../models/pagination.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(RuntimeConfigService).config.identityServiceUrl}/users`;

  listUsers(
    params: UserQueryParams,
    options?: { orgId?: string },
  ): Observable<PaginatedResponse<UserResponse>> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value == null) continue;
      httpParams = httpParams.set(key, String(value));
    }

    const httpOptions: { params: HttpParams; headers?: Record<string, string> } = {
      params: httpParams,
    };

    // Allow callers to override the org context header (e.g. recovery dialog
    // searching users in a different org than the platform-admin's active org)
    if (options?.orgId) {
      httpOptions.headers = { 'X-Organization-Id': options.orgId };
    }

    return this.http.get<PaginatedResponse<UserResponse>>(this.apiUrl, httpOptions);
  }

  getUser(userId: string): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/${userId}`);
  }

  createUser(body: CreateUserRequest): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/provision`, body);
  }

  updateUser(userId: string, body: UpdateUserRequest): Observable<UserResponse> {
    return this.http.patch<UserResponse>(`${this.apiUrl}/${userId}`, body);
  }

  deactivateUser(userId: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/${userId}/deactivate`, {});
  }

  reactivateUser(userId: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/${userId}/reactivate`, {});
  }

  lockUser(userId: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/${userId}/lock`, {});
  }

  unlockUser(userId: string): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/${userId}/unlock`, {});
  }

  deleteUser(userId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${userId}`);
  }

  resetPassword(userId: string, body: ResetPasswordRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${userId}/reset-password`, body);
  }
}
