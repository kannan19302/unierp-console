"use client";
/**
 * Developers → Overview.
 * Developer-portal command dashboard: provider KPI cards for the API
 * platform, webhooks and API-key management, plus the latest builder
 * activity, all read from real control-plane endpoints.
 */
import { Activity, Braces, Code2, KeyRound, Webhook } from "lucide-react";
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
}

interface WebhookRow {
  id?: string;
  name?: string;
  url?: string;
  endpoint?: string;
  events?: string[] | number;
  status?: string;
}

interface ApiKeyRow {
  id?: string;
  name?: string;
  label?: string;
  prefix?: string;
  scopes?: string[];
  status?: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

interface BuilderItemRow {
  id?: string;
  type?: string;
  name?: string;
  title?: string;
  status?: string;
  tenant?: string;
  updatedAt?: string;
  createdAt?: string;
}

export default function DevelopersOverview() {
  const endpoints = useList<ApiEndpointRow>({ path: "/api-platform" });
  const webhooks = useList<WebhookRow>({ path: "/saas/webhooks" });
  const apiKeys = useList<ApiKeyRow>({ path: "/saas/api-keys" });
  const recent = useList<BuilderItemRow>({ path: "/builder/recent-items" });
  const kpis = useItem<Record<string, unknown>>("/builder/enterprise/dashboard-kpis");
  const dashboard = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  const k = kpis.data ?? {};
  const d = dashboard.data ?? {};

  const endpointsTotal = endpointsTotalCount(k, d) ?? endpoints.total ?? endpoints.data.length;
  const webhooksTotal = numberValue(k.webhooks, d.webhooks) ?? webhooks.total ?? webhooks.data.length;
  const keysTotal = numberValue(k.apiKeys, k.keys, d.apiKeys) ?? apiKeys.total ?? apiKeys.data.length;

  const stats: StatCardItem[] = [
    {
      label: "API endpoints",
      value: endpointsTotal,
      icon: <Braces size={18} />,
    },
    {
      label: "Webhooks",
      value: webhooksTotal,
      icon: <Webhook size={18} />,
    },
    {
      label: "API keys",
      value: keysTotal,
      icon: <KeyRound size={18} />,
    },
    {
      label: "Developer apps",
      value: numberValue(k.apps, k.applications, d.apps) ?? 0,
      icon: <Code2 size={18} />,
    },
    {
      label: "Recent activity",
      value: recent.total ?? recent.data.length,
      icon: <Activity size={18} />,
    },
  ];

  const loading =
    kpis.loading || dashboard.loading || endpoints.loading || webhooks.loading || apiKeys.loading || recent.loading;

  if (loading) {
    return (
      <DomainShell domainId="developers" title="Developers" description="Developer platform overview.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="Developers" description="Developer platform overview.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>API endpoints</h3>
            {endpoints.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
                {endpoints.error.message}
              </p>
            ) : endpoints.data.length === 0 ? (
              <EmptyState title="No API endpoints" description="The API platform returned no endpoints." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {endpoints.data.slice(0, 8).map((e) => (
                  <li
                    key={e.id ?? `${e.method}-${e.path}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name ?? e.title ?? e.path ?? "—"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      {e.version ? <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>v{e.version}</span> : null}
                      <Badge variant="info">{e.method ?? "GET"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Webhooks</h3>
            {webhooks.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
                {webhooks.error.message}
              </p>
            ) : webhooks.data.length === 0 ? (
              <EmptyState title="No webhooks registered" description="The webhooks endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {webhooks.data.slice(0, 8).map((w) => (
                  <li
                    key={w.id ?? w.url ?? w.endpoint}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {w.name ?? w.url ?? w.endpoint ?? "—"}
                    </span>
                    <Badge variant={w.status === "ACTIVE" ? "success" : "default"}>{w.status ?? "UNKNOWN"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>API keys</h3>
            {apiKeys.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
                {apiKeys.error.message}
              </p>
            ) : apiKeys.data.length === 0 ? (
              <EmptyState title="No API keys issued" description="The API keys endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {apiKeys.data.slice(0, 8).map((k) => (
                  <li
                    key={k.id ?? k.prefix ?? k.name ?? "?"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      {k.label ?? k.name ?? k.prefix ?? "—"}
                    </span>
                    <Badge variant={k.status === "ACTIVE" ? "success" : k.status === "REVOKED" ? "danger" : "default"}>
                      {k.status ?? "ACTIVE"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent builder activity</h3>
          {recent.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {recent.error.message}
            </p>
          ) : recent.data.length === 0 ? (
            <EmptyState title="No builder activity" description="The recent-items endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {recent.data.slice(0, 10).map((r) => (
                <li
                  key={r.id ?? `${r.type}-${r.updatedAt ?? r.createdAt}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500 }}>{r.name ?? r.title ?? "—"}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    {r.tenant ? <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{r.tenant}</span> : null}
                    <Badge variant="default">{r.type ?? "ITEM"}</Badge>
                    <Badge variant={r.status === "PUBLISHED" ? "success" : r.status === "DRAFT" ? "warning" : "default"}>
                      {r.status ?? "UNKNOWN"}
                    </Badge>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {r.updatedAt ?? r.createdAt ?? ""}
                    </span>
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

function numberValue(...values: unknown[]): number | undefined {
  return values.find((v) => typeof v === "number") as number | undefined;
}

function endpointsTotalCount(k: Record<string, unknown>, d: Record<string, unknown>): number | undefined {
  const direct = numberValue(k.endpoints, k.totalEndpoints, k.endpointCount, d.totalApiEndpoints, d.apiEndpoints);
  if (direct !== undefined) return direct;
  if (Array.isArray(k.endpointList)) return (k.endpointList as unknown[]).length;
  return undefined;
}