export type NotificationType =
  | "trecholder"
  | "schedule"
  | "system"
  | "user";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}
