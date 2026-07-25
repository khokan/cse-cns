"use server";

import { revalidatePath } from "next/cache";
import { studentService } from "@/services/student.service";

export const getProfile = async () => studentService.getProfile();

export const updateProfile = async (payload: { name?: string; phone?: string | null; image?: string | null }) => {
  const result = await studentService.updateProfile(payload);
  revalidatePath("/dashboard/profile");
  revalidatePath("/my-profile");
  return result;
};

export const changePassword = async (payload: { currentPassword: string; newPassword: string }) => {
  const result = await studentService.changePassword(payload);
  revalidatePath("/change-password");
  return result;
};
