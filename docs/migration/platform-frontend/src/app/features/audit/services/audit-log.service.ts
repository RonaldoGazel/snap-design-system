import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../../environments/environment';
import { RuntimeConfigService } from '../../../services/runtime-config.service';
import {
  AuditLogFilterParams,
  AuditLogQueryParams,
  AuditLogResponse,
  PaginatedAuditLogResponse,
} from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${inject(RuntimeConfigService).config.auditServiceUrl}/audit-logs`;

  /**
   * Fetches a paginated list of audit logs with optional filters.
   * Null/undefined parameters are omitted from the query string.
   * Date fields are converted to ISO 8601 if necessary.
   */
  getAuditLogs(params: AuditLogQueryParams): Observable<PaginatedAuditLogResponse> {
    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value == null) {
        continue;
      }

      if (key === 'occurred_after' || key === 'occurred_before') {
        httpParams = httpParams.set(key, this.toIsoString(value));
      } else {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http.get<PaginatedAuditLogResponse>(`${this.apiUrl}/`, { params: httpParams });
  }

  /**
   * Fetches a single audit log record by event_id.
   */
  getAuditLogByEventId(eventId: string): Observable<AuditLogResponse> {
    return this.http.get<AuditLogResponse>(`${this.apiUrl}/${eventId}`);
  }

  /**
   * Exports audit logs matching the provided filters as a downloadable file.
   * Returns an Observable with the blob and extracted filename.
   */
  exportAuditLogs(
    filters: Partial<AuditLogFilterParams>,
    format: 'csv' | 'json' = 'csv'
  ): Observable<{ blob: Blob; filename: string }> {
    let httpParams = new HttpParams().set('format', format);

    for (const [key, value] of Object.entries(filters)) {
      if (value == null) {
        continue;
      }

      if (key === 'occurred_after' || key === 'occurred_before') {
        httpParams = httpParams.set(key, this.toIsoString(value));
      } else {
        httpParams = httpParams.set(key, String(value));
      }
    }

    return this.http
      .get(`${this.apiUrl}/export`, {
        params: httpParams,
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((response) => {
          const disposition = response.headers.get('Content-Disposition');
          const filename = this.extractFilename(disposition) ?? `audit_logs_export.${format}`;
          return { blob: response.body!, filename };
        })
      );
  }

  /**
   * Extracts filename from Content-Disposition header.
   * Supports both filename="..." and filename*=UTF-8''... formats.
   */
  private extractFilename(disposition: string | null): string | null {
    if (!disposition) {
      return null;
    }

    // Try filename*=UTF-8''... format first (RFC 5987)
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;\s]+)/i);
    if (utf8Match) {
      return decodeURIComponent(utf8Match[1]);
    }

    // Fall back to filename="..." format
    const basicMatch = disposition.match(/filename="?([^";\s]+)"?/i);
    if (basicMatch) {
      return basicMatch[1];
    }

    return null;
  }

  /**
   * Converts a date value to an ISO 8601 string.
   * If already an ISO 8601 string, returns it as-is.
   */
  private toIsoString(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return value;
  }
}
