"use client";
/**
 * Ops → Incidents.
 * Open incidents from the health endpoint plus the structured error-log feed
 * (level, context, request id, resolution state) from the operations API.
 */
import { FileWarning } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface LogRow {
  id?: string;
  timestamp?: string;
  level?: string;
  context?: string;
  message?: string;
  requestId?: string;
  stack?: string;
  resolved?: boolean;
}

function levelVariant(level?: string): "success" | "warning" | "danger" | "default" {
  const s = level?.toUpperCase() ?? "";
  if (s === "FATAL") return "danger";
  if (s === "ERROR") return "danger";
  if (s === "WARN" || s === "WARNING") return "warning";
  return "default";
}

export default function OpsIncidents() {
  const health = useItem<Record<string, unknown>>("/platform/v1/operations/health");
  const logs = useList<LogRow>({ path: "/platform/v1/operations/logs" });

  const h = health.data ?? {};
  const metrics = (h.metrics ?? {}) as Record<string, unknown>;
  const openIncidents = Number(h.openIncidents ?? 0) || 0;
  const degradedServices = Number(h.degradedServices ?? metrics.degradedServices ?? 0) || 0;
  const availability = h.availability ?? metrics.availability ?? "—";

  const unresolved = logs.data.filter((l) => !l.resolved).length;

  const stats: StatCardItem[] = [
    { label: "Open incidents", value: openIncidents },
    { label: "Degraded services", value: degradedServices },
    { label: "Error log entries", value: logs.total ?? logs.data.length },
    { label: "Unresolved logs", value: unresolved },
  ];

  if (logs.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Incidents"
      description="Open incidents, degraded services and the error-log feed behind them."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <Card padding="md">
          <h3 style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            <FileWarning size={16} /> Incidents & degraded services
          </h3>
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
            <Badge variant={openIncidents > 0 ? "danger" : "success"}>
              {openIncidents} open
            </Badge>
            <Badge variant={degradedServices > 0 ? "warning" : "success"}>
              {degradedServices} degraded
            </Badge>
            <Badge variant="info">avail {String(availability)}</Badge>
          </div>
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Error log feed
          </h3>
          {logs.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {logs.error.message}
            </p>
          ) : logs.data.length === 0 ? (
            <EmptyState title="No error logs" description="The logs endpoint returned no error entries." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {logs.data.slice(0, 50).map((l) => (
                <li
                  key={l.id ?? l.message}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-1)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.message}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                      <Badge variant={levelVariant(l.level)}>{l.level ?? "—"}</Badge>
                      <Badge variant={l.resolved ? "success" : "warning"}>
                        {l.resolved ? "resolved" : "open"}
                      </Badge>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    {l.timestamp && <span>{formatTime(l.timestamp)}</span>}
                    {l.context && <span>{l.context}</span>}
                    {l.requestId && <span>req {l.requestId}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}