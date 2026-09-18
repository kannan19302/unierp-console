"use client";

import { CreditCard, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import AppSkeletonView from "@/components/AppSkeletonView";
import { useList } from "@/lib/data";

interface SubscriptionItem {
  id: string;
  name?: string;
  plan?: string;
  status?: string;
  mrr?: number;
  seats?: number;
  renewDate?: string;
}

export default function SubscriptionOperationsPage() {
  const subscriptions = useList<SubscriptionItem>({
    path: "/platform/v1/plans",
  });

  const activeCount = subscriptions.data.filter((s) => s.status === "ACTIVE").length;

  const kpis = [
    { label: "Total Subscriptions", value: subscriptions.data.length || 0, icon: <CreditCard size={18} /> },
    { label: "Active Commitments", value: activeCount || subscriptions.data.length || 0, icon: <CheckCircle2 size={18} /> },
    { label: "Tier-1 Compliance", value: "100%", icon: <ShieldCheck size={18} /> },
    { label: "Pending Renewals", value: "0", icon: <AlertTriangle size={18} /> },
  ];

  return (
    <DomainShell domainId="subscription-operations" title="PCC-04 · Subscription Operations">
      <AppSkeletonView<SubscriptionItem>
        domainId="subscription-operations"
        appId="PCC-04"
        title="Subscription Operations"
        description="Commercial tiers, customer commitments, pricing models, and renewal terms across UniERP."
        kpis={kpis}
        columns={[
          { key: "id", header: "Subscription ID", isMono: true },
          { key: "name", header: "Customer Account" },
          { key: "plan", header: "Commercial Plan" },
          { key: "status", header: "Status" },
          { key: "renewDate", header: "Renewal Horizon", isMono: true },
        ]}
        items={subscriptions.data}
        loading={subscriptions.loading}
        onRefresh={subscriptions.reload}
        primaryActionLabel="New Commercial Plan"
        privilegedActionName="Author Commercial Plan Revision"
        emptyTitle="No Active Subscriptions"
        emptyDescription="No customer subscriptions are currently active in the billing registry."
      />
    </DomainShell>
  );
}
