export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  requestId: string;
  statusCode: number;
}

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiError };
