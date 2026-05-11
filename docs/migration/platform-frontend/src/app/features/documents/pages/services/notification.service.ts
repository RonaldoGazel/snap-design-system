import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../shared/models/api-response.model';
import { Notification } from '../models/document.models';
import { ApiService } from '../../../../shared/services/api.service';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  getNotifications(
    params: GetNotificationsParams = {},
  ): Observable<
    ApiResponse<{ items: Notification[]; total: number; page: number; limit: number }>
  > {
    const q = new URLSearchParams();
    if (params.page !== undefined) q.set('page', String(params.page));
    if (params.limit !== undefined) q.set('limit', String(params.limit));
    return this.api.get<{ items: Notification[]; total: number; page: number; limit: number }>(
      `/notifications?${q}`,
    );
  }

  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.api.get<{ count: number }>('/notifications/unread-count');
  }

  markAsRead(id: string): Observable<ApiResponse<Notification>> {
    return this.api.put<Notification>(`/notifications/${id}/read`, {});
  }
}
