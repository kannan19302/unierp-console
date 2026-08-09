"use client";
/**
 * Support / Incidents.
 * Operational incidents affecting customer-facing services, from the
 * operations incidents feed plus the operations dashboard summary.
 */
import { Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
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

interface IncidentRow {
  id: string;
  title?: string;
  summary?: string;
  status?: string;
  severity?: string;
  service?: string;
  startedAt?: string;
  resolvedAt?: string;
  updatedAt?: string;
}

function fmtDate(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString();
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function severityVariant(sv?: string): "danger" | "warning" | "info" | "default" {
  const s = (sv ?? "").toUpperCase();
  if (["CRITICAL", "SEV1", "HIGH", "P1"].includes(s)) return "danger";
  if (["MAJOR", "MEDIUM", "SEV2", "P2", "WARNING"].includes(s)) return "warning";
  if (["MINOR", "LOW", "SEV3", "P4", "INFO"].includes(s)) return "info";
  return "default";
}

function statusVariant(s?: string): "success" | "warning" | "danger" | "info" | "default" {
  const st = (s ?? "").toUpperCase();
  if (["RESOLVED", "CLOSED", "MITIGATED"].includes(st)) return "success";
  if (["INVESTIGATING", "MONITORING", "MONITOR"].includes(st)) return "warning";
  if (["OPEN", "ACTIVE", "DISRUPTION"].includes(st)) return "danger";
  if (["IDENTIFIED", "TRIAGING", "PENDING"].includes(st)) return "info";
  return "default";
}

export default function SupportIncidents() {
  const incidents = useList<IncidentRow>({ path: "/platform/v1/operations/incidents" });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  const active = incidents.data.filter((i) =>
    !["RESOLVED", "CLOSED", "MITIGATED"].includes((i.status ?? "").toUpperCase()),
  ).length;
  const critical = incidents.data.filter((i) =>
    ["CRITICAL", "SEV1", "HIGH", "P1"].includes((i.severity ?? "").toUpperCase()),
  ).length;

  const s = summary.data ?? {};
  const stats: StatCardItem[] = [
    { label: "Active incidents", value: num(s.openIncidents) ?? active, icon: <Activity size={18} />, loading: incidents.loading || summary.loading },
    { label: "High severity", value: num(s.criticalIncidents) ?? critical, icon: <AlertTriangle size={18} />, loading: incidents.loading || summary.loading },
    { label: "Resolved", value: incidents.data.length - active, icon: <CheckCircle2 size={18} />, loading: incidents.loading },
    { label: "Recently updated", value: s.recentIncidents != null ? String(s.recentIncidents) : "—", icon: <Clock size={18} />, loading: summary.loading },
  ];

  return (
    <DomainShell
      domainId="support"
      title="Incidents"
      description="Operational incidents that impact the support surface."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Incident log</h3>
          {incidents.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
              <Spinner size="md" />
            </div>
          ) : incidents.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{incidents.error.message}</p>
          ) : incidents.data.length === 0 ? (
            <EmptyState title="No incidents" description="The operations endpoint returned no incidents." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {incidents.data.map((i) => (
                <li
                  key={i.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontWeight: 600 }}>
                      {i.title ?? i.id}
                    </span>
                    <span
                      style={{
                        display: "block",
                        marginTop: "var(--space-1)",
                        fontSize: "var(--text-sm)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      {i.summary ?? "—"}
                    </span>
                    <span style={{ display: "block", marginTop: "var(--space-1)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      {i.service ? `${i.service} · ` : ""}
                      {fmtDate(i.startedAt)}
                      {i.resolvedAt ? ` → resolved ${fmtDate(i.resolvedAt)}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={severityVariant(i.severity)}>{i.severity ?? "UNKNOWN"}</Badge>
                    <Badge variant={statusVariant(i.status)}>{i.status ?? "UNKNOWN"}</Badge>
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