/** Shared typed contracts for the console ↔ API boundary. */

export interface ApiListResponse<T> {
  data?: T[];
  items?: T[];
  results?: T[];
  total?: number;
  meta?: { total?: number };
}

export interface ApiResponse<T> {
  status: number;
  data: T;
}

export interface ApiError extends Error {
  status: number;
  statusText?: string;
  code?: string;
}

export interface ApiClient {
  get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<ApiResponse<T>>;
  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>>;
  put<T>(path: string, body?: unknown): Promise<ApiResponse<T>>;
  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>>;
  del<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<ApiResponse<T>>;
}

export interface ApiRequestOptions {
  params?: Record<string, string | number | boolean | undefined>;
}