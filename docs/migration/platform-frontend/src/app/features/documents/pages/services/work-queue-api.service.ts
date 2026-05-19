import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { WorkflowApiBaseService } from '../../../workflows/services/workflow-api-base.service';

/**
 * Work queue item from the backend.
 */
export interface WorkQueueItem {
  assignmentId: string;
  instanceId: string;
  documentId: string;
  stepName: string;
  expectedAction: string | null;
  priority: string;
  deadlineAt: string | null;
  deadlineStatus: string | null;
  documentType: string;
  originatingSection: string | null;
  createdAt: string;
}

export interface WorkQueueResponse {
  items: WorkQueueItem[];
  totalCount: number;
  limit: number;
  offset: number;
}

export interface WorkQueueFilters {
  actionType?: string;
  priority?: string;
  deadlineStatus?: string;
  documentType?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

/**
 * Service for querying the work queue from workflow-service.
 *
 * Replaces the old BpmsInstanceStateService and BpmsApiService.getPendingTasks().
 * The backend filters by the user's section+role automatically (server-side).
 */
@Injectable({ providedIn: 'root' })
export class WorkQueueApiService {
  private readonly api = inject(WorkflowApiBaseService);

  /**
   * Get the current user's work queue with optional filters.
   */
  getWorkQueue(filters: WorkQueueFilters = {}): Observable<WorkQueueResponse> {
    let params = new HttpParams();
    if (filters.actionType) params = params.set('action_type', filters.actionType);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.deadlineStatus) params = params.set('deadline_status', filters.deadlineStatus);
    if (filters.documentType) params = params.set('document_type', filters.documentType);
    if (filters.sortBy) params = params.set('sort_by', filters.sortBy);
    if (filters.page) params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));

    return this.api
      .workflowGet<any>('/work-queue', { params })
      .pipe(
        map((res) => {
          const data = res.data as any;
          return {
            items: (data?.items ?? []).map((item: any) => ({
              assignmentId: item.assignment_id,
              instanceId: item.instance_id,
              documentId: item.document_id,
              stepName: item.step_name,
              expectedAction: item.expected_action,
              priority: item.priority,
              deadlineAt: item.deadline_at,
              deadlineStatus: item.deadline_status,
              documentType: item.document_type,
              originatingSection: item.originating_section,
              createdAt: item.created_at,
            })),
            totalCount: data?.total_count ?? 0,
            limit: data?.limit ?? 50,
            offset: data?.offset ?? 0,
          };
        }),
      );
  }
}
