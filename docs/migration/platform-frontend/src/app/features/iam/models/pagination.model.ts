export interface PaginatedResponse<T> {
  items: T[];
  total_count: number;
  limit: number;
  offset: number;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}
