export interface ApiError {
  message: string;
  status?: number;
}

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}