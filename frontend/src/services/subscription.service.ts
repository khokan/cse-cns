import "server-only";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export const subscriptionService = {
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