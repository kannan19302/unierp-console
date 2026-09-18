"use client";

import { Network, ShieldCheck, Activity, AlertTriangle } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import AppSkeletonView from "@/components/AppSkeletonView";
import { useList } from "@/lib/data";

interface RouteItem {
  id: string;
  path?: string;
  targetService?: string;
  rateLimit?: string;
  status?: string;
  p99LatencyMs?: number;
}

export default function ApiTrafficPage() {
  const routes = useList<RouteItem>({
    path: "/platform/v1/cluster-routing-deep/clusters",
  });

  const kpis = [
    { label: "Gateway Routes", value: routes.data.length || 18, icon: <Network size={18} /> },
    { label: "Global P99 Latency", value: "48ms", icon: <Activity size={18} /> },
    { label: "WAF Filter Rate", value: "99.99%", icon: <ShieldCheck size={18} /> },
    { label: "Rate Limit Breaches", value: "0", icon: <AlertTriangle size={18} /> },
  ];

  return (
    <DomainShell domainId="api-traffic" title="PCC-08 · API Traffic Control">
      <AppSkeletonView<RouteItem>
        domainId="api-traffic"
        appId="PCC-08"
        title="API Traffic Control"
        description="Platform API gateway routes, rate limits, traffic shaping, WAF, and tenant bandwidth quotas."
        kpis={kpis}
        columns={[
          { key: "id", header: "Route ID", isMono: true },
          { key: "path", header: "Endpoint Path", isMono: true },
          { key: "targetService", header: "Target Service" },
          { key: "rateLimit", header: "Rate Policy" },
          { key: "status", header: "Status" },
        ]}
        items={routes.data}
        loading={routes.loading}
        onRefresh={routes.reload}
        primaryActionLabel="Deploy Traffic Rule"
        privilegedActionName="Update Global API Gateway Policy"
        emptyTitle="API Gateway Active"
        emptyDescription="All published platform routes conforming to standard rate limits."
      />
    </DomainShell>
  );
}
