"use client";

import { Button } from "@/components/ui/button";
import { signOutUser } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onLogout = async () => {
    setLoading(true);
    try {
      await signOutUser();
      router.replace("/login");
      router.refresh();
    } catch {
      toast.error("Failed to log out. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" onClick={onLogout} disabled={loading}>
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
