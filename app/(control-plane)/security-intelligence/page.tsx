"use client";

import { Radar, ShieldAlert, Activity, CheckCircle2 } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import AppSkeletonView from "@/components/AppSkeletonView";
import { useList } from "@/lib/data";

interface ThreatEventItem {
  id: string;
  ruleId?: string;
  sourceIp?: string;
  severity?: string;
  status?: string;
  title?: string;
  timestamp?: string;
}

export default function SecurityIntelligencePage() {
  const threats = useList<ThreatEventItem>({
    path: "/admin/alerts",
  });

  const kpis = [
    { label: "SOC Detection Rules", value: "24 Active", icon: <Radar size={18} /> },
    { label: "SIEM Ingestion Rate", value: "14.2k eps", icon: <Activity size={18} /> },
    { label: "Containment Response", value: "<15s Automated", icon: <CheckCircle2 size={18} /> },
    { label: "Active Threat Cases", value: threats.data.length || 0, icon: <ShieldAlert size={18} /> },
  ];

  return (
    <DomainShell domainId="security-intelligence" title="PCC-10 · Security Intelligence (SOC)">
      <AppSkeletonView<ThreatEventItem>
        domainId="security-intelligence"
        appId="PCC-10"
        title="Security Intelligence (SOC)"
        description="Real-time threat detection rules, SOC cases, SIEM telemetry feeds, and automated containment."
        kpis={kpis}
        columns={[
          { key: "id", header: "Incident ID", isMono: true },
          { key: "title", header: "Detection Signature" },
          { key: "severity", header: "Severity" },
          { key: "status", header: "Status" },
          { key: "sourceIp", header: "Vector IP", isMono: true },
        ]}
        items={threats.data}
        loading={threats.loading}
        onRefresh={threats.reload}
        primaryActionLabel="Deploy Containment Rule"
        privilegedActionName="Automated Isolation Containment"
        emptyTitle="No Active Security Threats"
        emptyDescription="All cluster perimeters secure. Real-time SOC telemetry observing normal operation."
      />
    </DomainShell>
  );
}
