import { Plan } from "./plan";

export type PaymentStatus = "UNPAID" | "PAID" | "FAILED";
export type SubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "CANCELLED"
  | "EXPIRED"
  | "PAST_DUE"
  | "TRIAL";

export interface Subscription {
  id: string;
  studentId: string;
  planId: string;
  status: SubscriptionStatus;
  paymentStatus: PaymentStatus;
  startDate?: string | null;
  endDate?: string | null;
  plan?: Plan;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubscriptionResponse {
  subscription: Subscription;
  paymentUrl?: string;
}

export interface CreateTrialSubscriptionResponse {
  subscription: Subscription;
  trialEndsAt: string;
  trialDurationMinutes: number;
  message: string;
}