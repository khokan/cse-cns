import { useEffect, useState } from "react";
import { userServiceClient } from "@/services/user.client.service";

interface User {
  id: string;
  email: string;
  role: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface Session {
  user: User;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface UseUserReturn {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch user session in client components
 * Cannot be used in server components (use userService directly instead)
 */
export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        setIsLoading(true);
        const result = await userServiceClient.getSession();

        if (result.error) {
          setError(result.error.message);
          setUser(null);
          setSession(null);
        } else if (result.data?.user) {
          setSession(result.data);
          setUser(result.data.user);
          setError(null);
        } else {
          setError("session is missing");
          setUser(null);
          setSession(null);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch user session");
        setUser(null);
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  return { user, session, isLoading, error };
}
