import { createAuthClient } from "better-auth/react"
// export const authClient = createAuthClient({
//     /** The base URL of the server (optional if you're using the same domain) */
//     baseURL: process.env.NEXT_PUBLIC_BASE_URL,
//     fetchOptions: {
//      credentials: "include",
//    },
// })

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  fetchOptions: {
    credentials: "include",
  },
});

export async function signOutUser() {
  try {
    await authClient.signOut();
  } finally {
    // Fallback to the app route so server-side cookies are cleared reliably.
    await fetch("/api/ui/logout", {
      method: "POST",
      credentials: "include",
    });
  }
}



// export const signInWithGoogle = async () => {
//   return await authClient.signIn.social({
//     provider: "google",
//     callbackURL: googleCallbackURL,
//   });
// };
