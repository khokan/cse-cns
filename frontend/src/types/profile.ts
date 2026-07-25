export type StudentProfile = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  status: "ACTIVE" | "BANNED";
  phone?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

export type UpdateStudentProfileInput = {
  name?: string;
  phone?: string | null;
  avatarUrl?: string | null;
};
