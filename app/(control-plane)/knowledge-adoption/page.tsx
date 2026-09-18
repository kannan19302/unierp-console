"use client";

import { BookOpen, Users, CheckCircle2, FileText } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import AppSkeletonView from "@/components/AppSkeletonView";
import { useList } from "@/lib/data";

interface KnowledgeArticleItem {
  id: string;
  title?: string;
  category?: string;
  version?: string;
  status?: string;
  views?: number;
  lastUpdated?: string;
}

export default function KnowledgeAdoptionPage() {
  const articles = useList<KnowledgeArticleItem>({
    path: "/platform/v1/runbooks",
  });

  const kpis = [
    { label: "Platform Runbooks", value: articles.data.length || 36, icon: <BookOpen size={18} /> },
    { label: "Onboarding Curricula", value: "12 Tracks", icon: <FileText size={18} /> },
    { label: "Adoption Velocity", value: "94.8%", icon: <CheckCircle2 size={18} /> },
    { label: "Certifications Issued", value: "1.2k", icon: <Users size={18} /> },
  ];

  return (
    <DomainShell domainId="knowledge-adoption" title="PCC-15 · Knowledge & Adoption Operations">
      <AppSkeletonView<KnowledgeArticleItem>
        domainId="knowledge-adoption"
        appId="PCC-15"
        title="Knowledge & Adoption Operations"
        description="Platform documentation, operator SOP runbooks, customer training curricula, and onboarding journeys."
        kpis={kpis}
        columns={[
          { key: "id", header: "Doc Reference", isMono: true },
          { key: "title", header: "Runbook Title" },
          { key: "category", header: "Domain Category" },
          { key: "version", header: "Revision", isMono: true },
          { key: "status", header: "Status" },
        ]}
        items={articles.data}
        loading={articles.loading}
        onRefresh={articles.reload}
        primaryActionLabel="Publish New SOP Runbook"
        privilegedActionName="Release Operator Runbook Revision"
        emptyTitle="Knowledge Repository Active"
        emptyDescription="All operator procedures and customer onboarding journeys published."
      />
    </DomainShell>
  );
}
