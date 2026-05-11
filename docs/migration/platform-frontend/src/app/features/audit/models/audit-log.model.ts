export interface AuditLogResponse {
  id: string;
  event_id: string;
  event_type: string;
  event_version: string;
  occurred_at: string;
  correlation_id: string;
  request_id: string | null;
  trace_id: string | null;
  producer: string;
  actor_id: string;
  actor_type: string;
  action: string;
  resource_type: string;
  resource_id: string;
  outcome: 'success' | 'failure';
  metadata: Record<string, unknown> | null;
  failure_reason: string | null;
  received_at: string;
}

export interface PaginatedAuditLogResponse {
  items: AuditLogResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface AuditLogFilterParams {
  event_type: string | null;
  resource_type: string | null;
  outcome: 'success' | 'failure' | null;
  producer: string | null;
  actor_id: string | null;
  correlation_id: string | null;
  resource_id: string | null;
  occurred_after: string | null;
  occurred_before: string | null;
}

export interface AuditLogQueryParams extends Partial<AuditLogFilterParams> {
  limit: number;
  offset: number;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  request_id: string;
}
