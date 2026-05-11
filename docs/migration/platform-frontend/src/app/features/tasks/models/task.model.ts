export interface TaskResponse {
  id: string;
  status: string;
  source_type: string;
  organization_id: string;
  correlation_id: string;
  target_graph_id: string | null;
  error_details: Record<string, unknown> | null;
  requested_by: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedTaskResponse {
  items: TaskResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface TaskQueryParams {
  limit: number;
  offset: number;
  status?: string | null;
  source_type?: string | null;
  created_after?: string | null;
  created_before?: string | null;
}
