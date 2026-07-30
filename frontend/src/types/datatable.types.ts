export interface TableConfigItem {
  key: string;
  db: "cnsWeb" | "cns";
  model: string;
  canWrite: boolean;
  primaryKey: string;
}

export interface PaginatedDatatableResult<T = Record<string, any>> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    primaryKey: string;
    canWrite: boolean;
  };
}

export interface DatatableQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  [key: string]: any;
}
