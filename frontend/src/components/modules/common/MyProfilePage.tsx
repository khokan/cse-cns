"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getProfile, updateProfile } from "@/actions/student.action";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  image?: string | null;
  role: string;
};

export default function MyProfilePage() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    image: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await getProfile();
      if (error) throw error;

      const me = data?.data ?? data;
      setProfile(me as Profile);
      setForm({
        name: me?.name ?? "",
        phone: me?.phone ?? "",
        image: me?.image ?? "",
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onSave = async () => {
    try {
      setLoading(true);
      const { error } = await updateProfile({
        name: form.name || undefined,
        phone: form.phone ? form.phone : null,
        image: form.image ? form.image : null,
      });
      if (error) throw error;

      toast.success("Profile updated successfully");
      await loadProfile();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your account information.
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="space-y-4 p-6">
          <div className="text-sm">
            <div className="font-medium">{profile?.email ?? ""}</div>
            <div className="capitalize text-muted-foreground">Role: {profile?.role?.toLowerCase() ?? ""}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={loading}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={loading}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Image URL</label>
            <Input
              value={form.image}
              onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              disabled={loading}
              placeholder="Optional"
            />
          </div>

          <Button onClick={onSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
