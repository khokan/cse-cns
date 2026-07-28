import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export const trecholderService = {

  getProfile: async function () {
    try {
      const cookieStore = await cookies();
      const res = await fetch(`${API_URL}/auth/me`, {
       headers: {
          "Content-Type": "application/json",
          Cookie: cookieStore.toString(),
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { message: data?.message ?? "Failed" } };
      return { data, error: null };
    } catch {
      return { data: null, error: { message: "Something Went Wrong" } };
    }
  },

  updateProfile: async function (payload: { name?: string; phone?: string | null; image?: string | null }) {
    try {
      const cookieStore = await cookies();
      const res = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieStore.toString(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: { message: data?.message ?? "Failed" } };
      return { data, error: null };
    } catch {
      return { data: null, error: { message: "Something Went Wrong" } };
    }
  },

  changePassword: async function (payload: {
    currentPassword: string;
    newPassword: string;
  }) {
    try {
      const cookieStore = await cookies();

      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      // 👇 IMPORTANT: set correct frontend origin
      const origin =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
          origin,
          referer: origin,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return {
          data: null,
          error: { message: data?.message ?? "Failed to change password" },
        };
      }

      return { data, error: null };
    } catch (err: unknown) {
      return { data: null, error: { message: "Something Went Wrong" } };
    }
  },

  listUsers: async function () {
      try {
        const cookieStore = await cookies();
        const res = await fetch(`${API_URL}/auth`, {
          headers: { Cookie: cookieStore.toString() },
          cache: "no-store",
        });

        const data = await res.json();
        if (!res.ok) {
          return { data: null, error: { message: data?.message ?? "Failed to load users" } };
        }

        return { data, error: null };
      } catch {
        return { data: null, error: { message: "Something Went Wrong" } };
      }
    },
};
