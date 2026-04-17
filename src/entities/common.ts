export type ApiResult<T> =
  | { code: 0; message: "success"; data: T }
  | { code: number; message: string; data?: undefined };

export type PagedResult<T> = {
  total: number;
  page: number;
  pageSize: number;
  list: T[];
};

