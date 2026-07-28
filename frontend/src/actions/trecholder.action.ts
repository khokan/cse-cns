"use server";

import { revalidatePath } from "next/cache";
import { trecholderService } from "@/services/trecholder.service";

export const getProfile = async () => trecholderService.getProfile();

export const updateProfile = async (payload: { name?: string; phone?: string | null; image?: string | null }) => {
  const result = await trecholderService.updateProfile(payload);
  revalidatePath("/dashboard/profile");
  revalidatePath("/my-profile");
  return result;
};

export const changePassword = async (payload: { currentPassword: string; newPassword: string }) => {
  const result = await trecholderService.changePassword(payload);
  revalidatePath("/change-password");
  return result;
};
