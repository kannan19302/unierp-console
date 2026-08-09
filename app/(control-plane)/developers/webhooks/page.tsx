"use client";
/**
 * Developers → Webhooks.
 * Webhook subscriptions exposed to developer apps — endpoints, events,
 * delivery state and raw payload bodies drowned in metadata, read from the
 * SaaS webhooks endpoint.
 */
import { Send, Webhook, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface WebhookRow {
  id?: string;
  name?: string;
  app?: string;
  url?: string;
  endpoint?: string;
  events?: string;
  eventCount?: number;
  createdAt?: string;
  lastDeliveryAt?: string;
  lastStatus?: string;
  status?: string;
}

export default function DevelopersWebhooks() {
  const webhooks = useList<WebhookRow>({ path: "/saas/webhooks" });

  const active = webhooks.data.filter((w) => (w.status ?? "").toUpperCase() === "ACTIVE").length;
  const failing = webhooks.data.filter((w) => {
    const s = (w.lastStatus ?? w.status ?? "").toUpperCase();
    return s === "FAILED" || s === "FAILING" || s === "ERROR";
  }).length;

  const stats: StatCardItem[] = [
    { label: "Webhooks", value: webhooks.total ?? webhooks.data.length, icon: <Send size={18} /> },
    { label: "Active", value: active, icon: <CheckCircle2 size={18} /> },
    { label: "Failing deliveries", value: failing, icon: <AlertTriangle size={18} /> },
  ];

  if (webhooks.loading) {
    return (
      <DomainShell domainId="developers" title="Webhooks" description="Webhook subscriptions and delivery status.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="Webhooks" description="Webhook subscriptions and delivery status.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Webhook subscriptions</h3>
          {webhooks.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {webhooks.error.message}
            </p>
          ) : webhooks.data.length === 0 ? (
            <EmptyState title="No webhooks registered" description="The webhooks endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {webhooks.data.slice(0, 40).map((w) => (
                <li
                  key={w.id ?? w.url ?? w.endpoint}
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
                    <Webhook size={16} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {w.name ?? w.url ?? w.endpoint ?? "—"}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                    {w.events ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{w.events}</span>
                    ) : null}
                    {w.lastDeliveryAt ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        last {w.lastStatus ? `${w.lastStatus} ` : ""}{w.lastDeliveryAt}
                      </span>
                    ) : null}
                    <Badge variant={deliveryStatusVariant(w.lastStatus ?? w.status)}>
                      {w.lastStatus ?? w.status ?? "UNKNOWN"}
                    </Badge>
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

function deliveryStatusVariant(status?: string): "default" | "primary" | "success" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
    case "DELIVERED":
    case "OK":
      return "success";
    case "FAILED":
    case "FAILING":
    case "ERROR":
      return "danger";
    case "PENDING":
    case "RETRYING":
      return "warning";
    default:
      return "default";
  }
}