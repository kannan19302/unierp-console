"use client";
/**
 * Ops → Maintenance.
 * Scheduled and broadcast maintenance windows from the real
 * /platform/v1/broadcasts/windows endpoint.
 */
import { CalendarClock, Wrench } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface MaintenanceWindowRow {
  id?: string;
  title?: string;
  description?: string;
  message?: string;
  tenantId?: string;
  status?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  createdBy?: string;
  createdAt?: string;
}

function statusVariant(status?: string): "success" | "warning" | "danger" | "info" | "default" {
  const s = status?.toUpperCase() ?? "";
  if (s === "COMPLETED" || s === "CLOSED") return "success";
  if (s === "SCHEDULED") return "info";
  if (s === "ACTIVE" || s === "IN_PROGRESS") return "warning";
  if (s === "CANCELLED") return "danger";
  return "default";
}

export default function OpsMaintenance() {
  const windows = useList<MaintenanceWindowRow>({ path: "/platform/v1/broadcasts/windows" });

  const scheduled = windows.data.filter(
    (w) => (w.status ?? "").toUpperCase() === "SCHEDULED" || (w.status ?? "").toUpperCase() === "ACTIVE",
  ).length;

  const stats: StatCardItem[] = [
    { label: "Windows", value: windows.total ?? windows.data.length },
    { label: "Scheduled/active", value: scheduled },
  ];

  if (windows.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Maintenance"
      description="Maintenance windows broadcast to clusters and tenants."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={2} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Maintenance windows
          </h3>
          {windows.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
              {windows.error.message}
            </p>
          ) : windows.data.length === 0 ? (
            <EmptyState title="No maintenance windows" description="The broadcasts/windows endpoint returned no windows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {windows.data.slice(0, 50).map((w) => (
                <li
                  key={w.id ?? w.title}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-1)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 500 }}>
                      <Wrench size={14} /> {w.title ?? w.id}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge variant={statusVariant(w.status)}>{w.status ?? "UNKNOWN"}</Badge>
                    </span>
                  </div>
                  {w.description && (
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {w.description}
                    </span>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                    <CalendarClock size={12} />
                    {w.scheduledStart && <span>{formatTime(w.scheduledStart)}</span>}
                    {w.scheduledEnd && <span>→ {formatTime(w.scheduledEnd)}</span>}
                    {w.tenantId && <span>· {w.tenantId}</span>}
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