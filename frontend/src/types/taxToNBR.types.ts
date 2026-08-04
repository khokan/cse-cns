export interface TaxToNBRItem {
  id: string;
  fromDate?: string | null;
  toDate?: string | null;
  contractNumber?: string | null;
  paymentDate?: string | null;
  deducteeTIN?: string | null;
  trecHolderName?: string | null;
  mobileNumber?: string | null;
  emailAddress?: string | null;
  sectionNumber?: string | null;
  tradeVolume?: number;  // Accept string from serialized API
  cseCommission?: number;  // Accept string from serialized API
  paymentAmount?: number;  // Accept string from serialized API
  memberId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaxToNBRPayload {
  fromDate?: Date | string;
  toDate?: Date | string;
  contractNumber?: string;
  paymentDate?: Date | string;
  deducteeTIN?: string;
  trecHolderName?: string;
  mobileNumber?: string;
  emailAddress?: string;
  sectionNumber?: string;
  tradeVolume?: number;
  cseCommission?: number;
  paymentAmount?: number;
  memberId: string;
}

export interface UpdateTaxToNBRPayload {
  fromDate?: Date | string;
  toDate?: Date | string;
  contractNumber?: string;
  paymentDate?: Date | string;
  deducteeTIN?: string;
  trecHolderName?: string;
  mobileNumber?: string;
  emailAddress?: string;
  sectionNumber?: string;
  tradeVolume?: number;
  cseCommission?: number;
  paymentAmount?: number;
  memberId?: string;
}

export interface PaginatedTaxToNBRs {
  data: TaxToNBRItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TaxToNBRQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
