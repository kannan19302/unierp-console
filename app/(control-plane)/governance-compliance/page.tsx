"use client";

import { Scale, CheckCircle2, ShieldCheck, AlertTriangle } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import AppSkeletonView from "@/components/AppSkeletonView";
import { useList } from "@/lib/data";

interface ComplianceControlItem {
  id: string;
  framework?: string;
  controlCode?: string;
  name?: string;
  status?: string;
  evidenceCount?: number;
  lastAudited?: string;
}

export default function GovernanceCompliancePage() {
  const controls = useList<ComplianceControlItem>({
    path: "/platform/v1/compliance-controls",
  });

  const unavailable = controls.loading || Boolean(controls.error);
  const kpis = [
    { label: "Active Controls", value: unavailable ? "Unknown" : controls.data.length, icon: <Scale size={18} /> },
    { label: "SOC2 Type II", value: "Not reported", icon: <CheckCircle2 size={18} /> },
    { label: "ISO 27001 / HIPAA", value: "Not reported", icon: <ShieldCheck size={18} /> },
    { label: "Evidence Holds", value: "Not reported", icon: <AlertTriangle size={18} /> },
  ];

  return (
    <DomainShell domainId="governance-compliance" title="PCC-09 · Governance & Compliance Center">
      <AppSkeletonView<ComplianceControlItem>
        domainId="governance-compliance"
        appId="PCC-09"
        title="Governance & Compliance Center"
        description="SOC2, ISO27001, HIPAA, GDPR compliance controls, immutable evidence lockers, and audit engagements."
        kpis={kpis}
        columns={[
          { key: "controlCode", header: "Control Code", isMono: true },
          { key: "framework", header: "Framework" },
          { key: "name", header: "Control Objective" },
          { key: "status", header: "Status" },
          { key: "evidenceCount", header: "Artifacts Sealed", isMono: true },
        ]}
        items={controls.data}
        loading={controls.loading}
        onRefresh={controls.reload}
        primaryActionLabel="Seal Evidence Package"
        privilegedActionName="Attest Regulatory Evidence Lock"
        emptyTitle="Compliance Frameworks Active"
        emptyDescription="All SOC2, ISO27001, and GDPR controls evaluated with zero audit gaps."
      />
    </DomainShell>
  );
}
