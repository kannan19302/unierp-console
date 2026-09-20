"use client";
/**
 * Settings → Templates.
 *
 * Reporting templates shared across the platform (real reads from
 * `/reporting/templates-deep/templates`). Every section renders honest
 * loading/error/empty states.
 */
import { FileText, FolderOpen, LayoutTemplate, Package, Mail } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Button,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ReportTemplate {
  id: string;
  title: string;
  category: string;
  layoutHtml?: string;
  headerFooter?: unknown;
  isSystem?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function TemplatesSettingsPage() {
  const templates = useList<ReportTemplate>({
    path: "/reporting/templates-deep/templates",
  });

  const systemCount = templates.data.filter((t) => t.isSystem).length;
  const customCount = templates.data.length - systemCount;
  const categoriesList = Array.from(new Set(templates.data.map((t) => t.category))).sort();

  const stats: StatCardItem[] = [
    { label: "Templates", value: templates.data.length, icon: <LayoutTemplate size={18} /> },
    { label: "System", value: systemCount, icon: <Package size={18} /> },
    { label: "Custom", value: customCount, icon: <FileText size={18} /> },
    { label: "Categories", value: categoriesList.length, icon: <FolderOpen size={18} /> },
  ];

  if (templates.loading) {
    return (
      <DomainShell domainId="settings" title="Templates">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="settings"
      title="Templates"
      description="Reporting templates available across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-bg-subtle, #f8fafc)", padding: "var(--space-3, 12px) var(--space-4, 16px)", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--color-border, #e2e8f0)", flexWrap: "wrap", gap: "var(--space-3, 12px)" }}>
          <div>
            <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
              System Transactional Email Templates
            </span>
            <p style={{ margin: "var(--space-0-5, 2px) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              Preview and configure authentication, email verification, welcome, and security email templates.
            </p>
          </div>
          <Link href="/settings/templates/email" style={{ textDecoration: "none" }}>
            <Button variant="outline" size="sm" style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1-5, 6px)" }}>
              <Mail size={14} />
              <span>Manage Email Templates &rarr;</span>
            </Button>
          </Link>
        </div>

        <StatCardRow stats={stats} columns={4} />

        {templates.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {templates.error.message}
          </p>
        ) : templates.data.length === 0 ? (
          <EmptyState title="No reporting templates" description="The templates endpoint returned no templates." />
        ) : (
          categoriesList.map((cat) => (
            <Card key={cat} padding="md">
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>{cat}</h3>
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {templates.data
                  .filter((t) => t.category === cat)
                  .map((tpl) => (
                    <li key={tpl.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                      <span style={{ fontWeight: 500 }}>{tpl.title}</span>
                      <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          created {formatDate(tpl.createdAt)}
                        </span>
                        {tpl.isSystem ? <Badge variant="info">SYSTEM</Badge> : <Badge variant="default">CUSTOM</Badge>}
                      </span>
                    </li>
                  ))}
              </ul>
            </Card>
          ))
        )}
      </div>
    </DomainShell>
  );
}