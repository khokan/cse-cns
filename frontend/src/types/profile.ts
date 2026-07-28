export type trecholderProfile = {
  id: string;
  name: string;
  email: string;
  role: "TRECHOLDER" | "ADMIN";
  status: "ACTIVE" | "BANNED";
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type UpdatetrecholderProfileInput = {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
};
