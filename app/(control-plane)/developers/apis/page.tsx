"use client";
/**
 * Developers → APIs.
 * The public API catalog — endpoints, methods, paths and publication state,
 * read from the API platform endpoints.
 */
import { useMemo } from "react";
import { Braces, Plug, ShieldCheck } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList, useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ApiEndpointRow {
  id?: string;
  name?: string;
  title?: string;
  path?: string;
  method?: string;
  version?: string;
  status?: string;
  description?: string;
}

export default function DevelopersApis() {
  const catalog = useList<ApiEndpointRow>({ path: "/api-platform" });
  const admin = useItem<Record<string, unknown>>("/admin/api-platform");

  const a = admin.data ?? {};
  const total = numValue(a.totalEndpoints, a.endpointCount) ?? catalog.total ?? catalog.data.length;

  const byMethod = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of catalog.data) {
      const m = (e.method ?? "GET").toUpperCase();
      counts.set(m, (counts.get(m) ?? 0) + 1);
    }
    return counts;
  }, [catalog.data]);

  const published = catalog.data.filter((e) => (e.status ?? "").toUpperCase() === "ACTIVE").length;

  const stats: StatCardItem[] = [
    { label: "Endpoints", value: total, icon: <Plug size={18} /> },
    { label: "Published", value: published || numValue(a.publishedEndpoints) || 0, icon: <Braces size={18} /> },
    { label: "Methods", value: byMethod.size || "—", icon: <Braces size={18} /> },
    { label: "Admin registered", value: a.registered ? "Yes" : "—", icon: <ShieldCheck size={18} /> },
  ];

  if (catalog.loading || admin.loading) {
    return (
      <DomainShell domainId="developers" title="APIs" description="Public API catalog and publication state.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="APIs" description="Public API catalog and publication state.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Endpoints</h3>
          {catalog.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {catalog.error.message}
            </p>
          ) : catalog.data.length === 0 ? (
            <EmptyState title="No endpoints published" description="The API platform returned no endpoints." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {catalog.data.slice(0, 40).map((e) => (
                <li
                  key={e.id ?? `${e.method ?? e.name}-${e.path}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
                    <Badge variant={methodVariant(e.method ?? "GET")}>{e.method ?? "GET"}</Badge>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name ?? e.title ?? e.path ?? "—"}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{e.path ?? ""}</span>
                    {e.version ? <Badge variant="info">v{e.version}</Badge> : null}
                    <Badge variant={statusVariant(e.status)}>{e.status ?? "UNKNOWN"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {admin.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{admin.error.message}</p>
        ) : null}
      </div>
    </DomainShell>
  );
}

function numValue(...values: unknown[]): number | undefined {
  return values.find((v) => typeof v === "number") as number | undefined;
}

function methodVariant(method: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch (method.toUpperCase()) {
    case "GET":
      return "success";
    case "POST":
      return "primary";
    case "PUT":
    case "PATCH":
      return "warning";
    case "DELETE":
      return "danger";
    default:
      return "info";
  }
}

function statusVariant(status?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
    case "PUBLISHED":
    case "LIVE":
      return "success";
    case "DRAFT":
    case "BETA":
    case "DEPRECATED":
      return "warning";
    case "DISABLED":
    case "RETIRED":
    case "FAILED":
      return "danger";
    default:
      return "default";
  }
}