"use client";

import { KeySquare, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import AppSkeletonView from "@/components/AppSkeletonView";
import { useList } from "@/lib/data";

interface EntitlementItem {
  id: string;
  tenantId?: string;
  moduleCode?: string;
  tier?: string;
  status?: string;
  seatsAllocated?: number;
  signedAt?: string;
}

export default function EntitlementAuthorityPage() {
  const entitlements = useList<EntitlementItem>({
    path: "/platform/v1/entitlements",
  });

  const kpis = [
    { label: "Active Grants", value: entitlements.data.length || 0, icon: <KeySquare size={18} /> },
    { label: "License Pools", value: "8 Pools", icon: <CheckCircle2 size={18} /> },
    { label: "Cryptographic Health", value: "100%", icon: <ShieldCheck size={18} /> },
    { label: "Reconciliation Gaps", value: "0", icon: <AlertTriangle size={18} /> },
  ];

  return (
    <DomainShell domainId="entitlement-authority" title="PCC-05 · Entitlement & License Authority">
      <AppSkeletonView<EntitlementItem>
        domainId="entitlement-authority"
        appId="PCC-05"
        title="Entitlement & License Authority"
        description="Module provisioning flags, tenant capability grants, offline cryptographic licenses, and seat pools."
        kpis={kpis}
        columns={[
          { key: "id", header: "Grant ID", isMono: true },
          { key: "tenantId", header: "Tenant Scope", isMono: true },
          { key: "moduleCode", header: "Capability / Module" },
          { key: "tier", header: "Entitlement Tier" },
          { key: "status", header: "Status" },
        ]}
        items={entitlements.data}
        loading={entitlements.loading}
        onRefresh={entitlements.reload}
        primaryActionLabel="Issue Cryptographic License"
        privilegedActionName="Sign Offline Enterprise License"
        emptyTitle="No Entitlement Grants"
        emptyDescription="No module capability grants currently provisioned in this cell."
      />
    </DomainShell>
  );
}
