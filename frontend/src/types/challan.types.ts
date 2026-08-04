export interface ChallanItem {
  ID: number;
  ChallanNumber?: string | null;
  ChallanDate?: string | null;
  ChallanPeriodStartDate?: string | null;
  ChallanPeriodEndDate?: string | null;
  TotalTaxAmount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateChallanPayload {
  challanNumber: string;
  challanDate?: Date | string;
  challanPeriodStartDate?: Date | string;
  challanPeriodEndDate?: Date | string;
  totalTaxAmount?: number;
}

export interface UpdateChallanPayload {
  challanNumber?: string;
  challanDate?: Date | string;
  challanPeriodStartDate?: Date | string;
  challanPeriodEndDate?: Date | string;
  totalTaxAmount?: number;
}

export interface PaginatedChallans {
  data: ChallanItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ChallanQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
