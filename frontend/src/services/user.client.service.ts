/**
 * Client-side user service
 * Uses API route to fetch session since client components cannot use next/headers
 */

export const userServiceClient = {
  getSession: async function () {
    try {
      const res = await fetch("/api/auth/session", {
        cache: "no-store",
      });

      if (!res.ok) {
        return { data: null, error: { message: "session is missing" } };
      }

      const payload = await res.json();
      return payload;
    } catch (error) {
      console.error(error);
      return { data: null, error: { message: "something went wrong" } };
    }
  },
};
