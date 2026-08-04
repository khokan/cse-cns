export interface ChallanQuery {
    page?: string;
    limit?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface CreateChallanDto {
    challanNumber: string;
    challanDate?: Date;
    challanPeriodStartDate?: Date;
    challanPeriodEndDate?: Date;
    totalTaxAmount?: number;
}

export interface UpdateChallanDto {
    challanNumber?: string;
    challanDate?: Date;
    challanPeriodStartDate?: Date;
    challanPeriodEndDate?: Date;
    totalTaxAmount?: number;
}
