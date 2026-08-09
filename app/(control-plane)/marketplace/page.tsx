"use client";
/**
 * Marketplace → Overview.
 *
 * Landing dashboard: KPI row (extensions, pending approvals, installations,
 * platform operations) + recent submissions, all read from the verified
 * control-plane marketplace endpoints.
 */
import { BadgeCheck, ShieldCheck, AppWindow } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ExtensionRow {
  id?: string;
  appSlug?: string;
  appId?: string;
  status?: string;
}

interface SubmissionRow {
  id?: string;
  name?: string;
  status?: string;
  submittedAt?: string;
}

interface MarketplaceStats {
  totalApps?: number;
  totalInstalls?: number;
}

const STATUS_VARIANT = (s?: string) =>
  s === "ACTIVE" || s === "APPROVED" || s === "PUBLISHED"
    ? "success"
    : s === "PENDING_REVIEW" || s === "PENDING" || s === "IN_REVIEW"
      ? "warning"
      : s === "REJECTED" || s === "FAILED" || s === "DISABLED"
        ? "danger"
        : "default";

export default function MarketplaceOverview() {
  const extensions = useList<ExtensionRow>({
    path: "/platform/v1/marketplace/extensions",
  });
  const submissions = useList<SubmissionRow>({
    path: "/platform/v1/marketplace/submissions",
  });
  const stats = useItem<MarketplaceStats>("/admin/marketplace/stats");
  const dashboard = useItem<Record<string, unknown>>(
    "/platform/v1/operations/dashboard",
  );

  const s = stats.data ?? {};
  const d = dashboard.data ?? {};
  const metrics =
    d.metrics && typeof d.metrics === "object"
      ? (d.metrics as Record<string, unknown>)
      : {};

  const pending = submissions.data.filter(
    (x) =>
      x.status === "PENDING_REVIEW" ||
      x.status === "PENDING" ||
      x.status === "IN_REVIEW",
  ).length;

  const kpis: StatCardItem[] = [
    {
      label: "Marketplace extensions",
      value: Number(s.totalApps) || stats.loading ? "—" : extensions.data.length,
      icon: <AppWindow size={18} />,
    },
    {
      label: "Pending approvals",
      value: pendingApprovalsValue(pending, submissions.total),
      icon: <BadgeCheck size={18} />,
    },
    {
      label: "Total installations",
      value: s.totalInstalls != null ? s.totalInstalls : "—",
      icon: <ShieldCheck size={18} />,
    },
    {
      label: "Queue depth",
      value: metrics.queueDepth != null ? Number(metrics.queueDepth) : "—",
      icon: <ShieldCheck size={18} />,
    },
  ];

  const loading = extensions.loading || submissions.loading || stats.loading;
  if (loading) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Marketplace"
        description="Extensions, publishing and approval governance for the app store."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="marketplace"
      title="Marketplace"
      description="Extensions, publishing and approval governance for the app store."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={kpis} columns={4} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Extension catalog
            </h3>
            {extensions.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
                {extensions.error.message}
              </p>
            ) : extensions.data.length === 0 ? (
              <EmptyState
                title="No extensions"
                description="The extensions endpoint returned no records."
              />
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  margin: "var(--space-3) 0 0",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {extensions.data.slice(0, 8).map((e, i) => (
                  <li
                    key={e.appSlug ?? e.appId ?? String(i)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{e.appSlug ?? e.appId ?? "—"}</span>
                    <Badge variant={STATUS_VARIANT(e.status)}>{e.status ?? "UNKNOWN"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Recent submissions
            </h3>
            {submissions.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
                {submissions.error.message}
              </p>
            ) : submissions.data.length === 0 ? (
              <EmptyState
                title="No submissions"
                description="The submissions endpoint returned no rows."
              />
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  margin: "var(--space-3) 0 0",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {submissions.data.slice(0, 8).map((row) => (
                  <li
                    key={row.id ?? row.name ?? "?"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{row.name ?? row.id ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {row.submittedAt ?? ""}
                      </span>
                      <Badge variant={STATUS_VARIANT(row.status)}>{row.status ?? "UNKNOWN"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}

function pendingApprovalsValue(pending: number, total: number | undefined): number | string {
  if (total != null) return `${pending} of ${total}`;
  return pending;
}