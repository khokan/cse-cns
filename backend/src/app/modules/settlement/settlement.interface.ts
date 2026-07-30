export type SettlementProcessStatus = "PENDING" | "PROCESSING" | "SETTLED" | "FAILED" | "CANCELLED";

export interface CreateSettlementDto {
  tradeDate?: string;
  contractNumber: string;
  scripId?: string;
  buyBrokerCode?: string;
  buyTraderCode?: string;
  buyOrdType?: string;
  sellBrokerCode?: string;
  sellTraderCode?: string;
  sellOrdType?: string;
  quantity?: number;
  price?: number;
  processType?: string;
  tradeTime?: string;
}

export interface SettlementJobPayload {
  contractNumber: string;
  initiatedBy: string;
  data: CreateSettlementDto;
}

export interface SettlementQuery {
  page?: string;
  limit?: string;
  buyBrokerCode?: string;
  sellBrokerCode?: string;
  processType?: string;
  contractNumber?: string;
  scripId?: string;
}
