import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RuntimeConfigService } from '../../../services/runtime-config.service';
import { PaginatedTaskResponse, TaskQueryParams, TaskResponse } from '../models/task.model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(RuntimeConfigService).config.poiServiceUrl}/tasks`;

  getTasks(params: TaskQueryParams): Observable<PaginatedTaskResponse> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value != null) {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<PaginatedTaskResponse>(this.apiUrl, { params: httpParams });
  }

  getTaskById(taskId: string): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(`${this.apiUrl}/${taskId}`);
  }
}
