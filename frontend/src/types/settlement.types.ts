export type SettlementProcessStatus = "PENDING" | "PROCESSING" | "SETTLED" | "FAILED" | "CANCELLED";

export interface SettlementRecord {
  TradeDate?: string;
  ContractNumber: string;
  ScripID?: string;
  BuyBrokerCode?: string;
  BuyTraderCode?: string;
  BuyOrdType?: string;
  SellBrokerCode?: string;
  SellTraderCode?: string;
  SellOrdType?: string;
  Quantity?: number;
  Price?: number;
  ProcessType?: string;
  TradeTime?: string;
}

export interface CreateSettlementPayload {
  contractNumber: string;
  tradeDate?: string;
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

export interface PaginatedSettlements {
  data: SettlementRecord[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
