export type BillingInterval = "DAILY" | "MONTHLY" | "YEARLY" | "LIFETIME";

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  isActive?: boolean;
}