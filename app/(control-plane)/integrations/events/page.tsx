"use client";
/**
 * Integrations → Events.
 * Integration webhook configurations and delivery statistics from the real
 * ext-gateway and SaaS compliance webhook endpoints.
 */
import { Zap, Send } from "lucide-react";
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

interface WebhookRow {
  id: string;
  name?: string;
  connectionId?: string;
  url?: string;
  eventTypes?: string[];
  format?: string;
  active?: boolean;
  createdAt?: string;
}

interface ComplianceWebhook {
  id?: string;
  url?: string;
  events?: string[];
  active?: boolean;
}

interface WebhookStats {
  totalConfigs?: number;
  totalDeliveries?: number;
  success?: number;
  failed?: number;
  pending?: number;
  retrying?: number;
}

export default function IntegrationsEvents() {
  const webhooks = useList<WebhookRow>({ path: "/ext-gateway/webhooks" });
  const stats = useItem<WebhookStats>("/ext-gateway/webhooks/stats");
  const compliance = useList<ComplianceWebhook>({ path: "/saas/integrations-compliance/webhooks" });

  const kpis: StatCardItem[] = [
    { label: "Webhook configs", value: stats.data?.totalConfigs ?? webhooks.data.length, icon: <Zap size={18} /> },
    { label: "Deliveries", value: stats.data?.totalDeliveries ?? "—", icon: <Send size={18} /> },
    { label: "Failed", value: stats.data?.failed ?? "—", icon: <Zap size={18} /> },
    { label: "SaaS webhooks", value: compliance.data.length, icon: <Zap size={18} /> },
  ];

  if (webhooks.loading || stats.loading || compliance.loading) {
    return (
      <DomainShell
        domainId="integrations"
        title="Integrations"
        description="SaaS integrations, connectors, credentials and gateway activity across the platform."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="integrations"
      title="Integrations"
      description="SaaS integrations, connectors, credentials and gateway activity across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div>
          <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Events</h2>
          <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
            Webhook configurations and delivery events across the integration gateway.
          </p>
        </div>

        <StatCardRow stats={kpis} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Gateway webhooks</h3>
          {webhooks.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{webhooks.error.message}</p>
          ) : webhooks.data.length === 0 ? (
            <EmptyState title="No webhook configs" description="The ext-gateway webhooks endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {webhooks.data.slice(0, 20).map((h) => (
                <li
                  key={h.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{h.name ?? h.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {(h.eventTypes ?? []).join(", ") || "—"}
                    </div>
                  </div>
                  <Badge variant={h.active === false ? "default" : "success"}>
                    {h.active === false ? "Inactive" : "Active"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>SaaS compliance webhooks</h3>
          {compliance.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{compliance.error.message}</p>
          ) : compliance.data.length === 0 ? (
            <EmptyState title="No compliance webhooks" description="The integrations-compliance webhooks endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {compliance.data.map((w) => (
                <li
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 500 }}>{w.url ?? w.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {(w.events ?? []).join(", ") || "—"}
                    </div>
                  </div>
                  <Badge variant={w.active === false ? "default" : "success"}>
                    {w.active === false ? "Disabled" : "Active"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}