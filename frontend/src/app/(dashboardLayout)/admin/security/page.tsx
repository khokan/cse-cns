import { userService } from "@/services/user.service";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Shield, Users, KeyRound, FileText, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Security Management | CSE-CNS",
  description: "Manage roles, permissions, and user policies.",
};

export const dynamic = "force-dynamic";

const securitySections = [
  {
    href: "/admin/security/roles",
    icon: Shield,
    title: "Roles",
    description: "Create and manage roles. Assign permissions to each role.",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-900",
  },
  {
    href: "/admin/security/permissions",
    icon: KeyRound,
    title: "Permissions",
    description: "View all permission definitions grouped by module.",
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-900",
  },
  {
    href: "/admin/dashboard/users",
    icon: Users,
    title: "Users",
    description: "Assign roles and configure per-user policy overrides for fine-grained access.",
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-900",
  },
  {
    href: "/admin/dashboard",
    icon: FileText,
    title: "Audit Log",
    description: "Review all permission changes and admin actions.",
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-900",
  },
];

export default async function SecurityPage() {
  const session = await userService.getSession();
  if (!session?.data) redirect("/login");
  if (session.data.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Security Management</h1>
        </div>
        <p className="text-muted-foreground">
          Manage roles, permissions, and per-user access policies. Changes take effect
          immediately — no code deployments required.
        </p>
      </div>

      {/* Permission model explainer */}
      <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">How permissions resolve (in order):</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>User authenticates → session validated</li>
          <li>User&apos;s <strong className="text-foreground">Roles</strong> are loaded → permissions determined</li>
          <li><strong className="text-foreground">Policy overrides</strong> applied — DENY always wins</li>
        </ol>
      </div>


      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {securitySections.map(({ href, icon: Icon, title, description, color, bg, border }) => (
          <Link
            key={href}
            href={href}
            className={`group flex flex-col gap-3 rounded-xl border p-5 transition-all hover:shadow-md hover:-translate-y-0.5 ${bg} ${border}`}
            id={`security-nav-${title.toLowerCase()}`}
          >
            <div className="flex items-center justify-between">
              <Icon className={`h-6 w-6 ${color}`} />
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
            </div>
            <div>
              <p className={`font-semibold ${color}`}>{title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
