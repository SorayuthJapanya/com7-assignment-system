export interface AxiosErrorResponse {
  message: string;
  statusCode: number;
}

export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
