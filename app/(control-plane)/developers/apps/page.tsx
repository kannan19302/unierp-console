"use client";
/**
 * Developers → Apps.
 * Apps registered in the developer portal — inventory, status and
 * lifecycle, read from the builder stats and recent-items endpoints.
 */
import { AppWindow, Boxes, Layers } from "lucide-react";
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

interface AppRow {
  id?: string;
  name?: string;
  title?: string;
  type?: string;
  status?: string;
  appType?: string;
  tenant?: string;
  updatedAt?: string;
  createdAt?: string;
}

export default function DevelopersApps() {
  const stats = useItem<Record<string, unknown>>("/builder/stats");
  const apps = useList<AppRow>({ path: "/builder/recent-items" });

  const s = stats.data ?? {};
  const totalApps = numValue(s.totalApps, s.apps, s.appCount) ?? apps.total ?? apps.data.length;

  const published = apps.data.filter((a) => (a.status ?? "").toUpperCase() === "PUBLISHED").length;

  const statsCards: StatCardItem[] = [
    { label: "Apps", value: totalApps, icon: <AppWindow size={18} /> },
    { label: "Published", value: numValue(s.publishedApps) ?? published, icon: <Boxes size={18} /> },
    { label: "Drafts", value: numValue(s.draftApps) ?? Math.max(apps.data.length - published, 0), icon: <Layers size={18} /> },
    { label: "Environments", value: numValue(s.environments, s.sandboxes) ?? 0, icon: <Boxes size={18} /> },
  ];

  if (apps.loading || stats.loading) {
    return (
      <DomainShell domainId="developers" title="Apps" description="Apps registered in the developer portal.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="Apps" description="Apps registered in the developer portal.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={statsCards} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Registered apps</h3>
          {apps.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {apps.error.message}
            </p>
          ) : apps.data.length === 0 ? (
            <EmptyState title="No apps registered" description="The builder returned no app rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {apps.data.slice(0, 30).map((a) => (
                <li
                  key={a.id ?? `${a.name}-${a.updatedAt ?? a.createdAt}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{a.name ?? a.title ?? "—"}</span>
                    {a.tenant ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}> · {a.tenant}</span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    {a.type || a.appType ? <Badge variant="info">{a.type ?? a.appType}</Badge> : null}
                    <Badge variant={statusVariant(a.status)}>{a.status ?? "UNKNOWN"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}

function numValue(...values: unknown[]): number | undefined {
  return values.find((v) => typeof v === "number") as number | undefined;
}

function statusVariant(status?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "PUBLISHED":
    case "ACTIVE":
      return "success";
    case "DRAFT":
    case "PENDING":
    case "ARCHIVED":
      return "warning";
    case "DISABLED":
    case "REVOKED":
    case "FAILED":
      return "danger";
    default:
      return "default";
  }
}