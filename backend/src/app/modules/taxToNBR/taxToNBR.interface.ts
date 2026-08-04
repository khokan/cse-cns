export interface TaxToNBRQuery {
    page?: string;
    limit?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface CreateTaxToNBRDto {
    fromDate?: Date;
    toDate?: Date;
    contractNumber?: string;
    paymentDate?: Date;
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

export interface UpdateTaxToNBRDto {
    fromDate?: Date;
    toDate?: Date;
    contractNumber?: string;
    paymentDate?: Date;
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
