"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
  _count?: {
    trecholders: number;
  };
}

type AdminUsersTableProps = {
  users: AdminUser[];
};

const ROLE_VARIANTS: Record<string, "destructive" | "secondary" | "default" | "outline"> = {
  ADMIN: "destructive",
  IT: "default",
  ACCOUNTING: "outline",
  TRECHOLDER: "secondary",
  MARKETING: "secondary",
};

export default function AdminUsersTable({ users }: AdminUsersTableProps) {
  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>View all registered users and manage their security settings.</CardDescription>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Security</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name || "—"}</TableCell>
                  <TableCell>{user.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANTS[user.role] ?? "secondary"}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.emailVerified ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      id={`user-security-btn-${user.id}`}
                    >
                      <Link href={`/admin/security/users/${user.id}`}>
                        <ShieldCheck className="mr-1.5 h-4 w-4 text-primary" />
                        Manage
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
