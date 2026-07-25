"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export interface AdminSubscription {
  id: string;
  status: string;
  paymentStatus: string;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
  student?: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  plan?: {
    id: string;
    name?: string | null;
    interval?: string | null;
    price?: number;
    currency?: string;
  };
}

type AdminSubscriptionsTableProps = {
  subscriptions: AdminSubscription[];
};

const statusVariant = (status: string) => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "PENDING":
      return "secondary";
    case "CANCELLED":
    case "EXPIRED":
    case "PAST_DUE":
      return "destructive";
    default:
      return "outline";
  }
};

export default function AdminSubscriptionsTable({ subscriptions: initialSubscriptions }: AdminSubscriptionsTableProps) {
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>(initialSubscriptions);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmingSubscriptionId, setConfirmingSubscriptionId] = useState<string | null>(null);

  const sortedSubscriptions = useMemo(
    () => [...subscriptions].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")),
    [subscriptions]
  );


  return (
    <Card className="rounded-3xl">
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>Manage existing subscriptions and cancel pending or active subscriptions.</CardDescription>
      </CardHeader>
      <CardContent>
        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subscriptions found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubscriptions.map((subscription) => {
                const canCancel = subscription.status === "ACTIVE" || subscription.status === "PENDING";
                const isProcessing = actionId === subscription.id;
                return (
                  <TableRow key={subscription.id}>
                    <TableCell>{subscription.student?.name ?? subscription.student?.email ?? "Unknown"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{subscription.plan?.name ?? "Unknown plan"}</span>
                        <span className="text-xs text-muted-foreground">
                          {subscription.plan?.interval} · {subscription.plan?.price ?? "-"} {subscription.plan?.currency ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(subscription.status)}>
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={subscription.paymentStatus === "PAID" ? "default" : "secondary"}>
                        {subscription.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{subscription.startDate ? new Date(subscription.startDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>{subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : "—"}</TableCell>
                    <TableCell>
                      {canCancel ? (
                        <AlertDialog open={confirmingSubscriptionId === subscription.id} onOpenChange={(open) => setConfirmingSubscriptionId(open ? subscription.id : null)}>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isProcessing}>
                              {isProcessing ? "Cancelling..." : "Cancel"}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel subscription?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will cancel the subscription immediately. Students will lose access if the plan is active.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Go back</AlertDialogCancel>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <span className="text-sm text-muted-foreground">No action</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
