"use client";
/**
 * Analytics → Reports.
 * Reporting catalogue from /reporting, the engine's semantic layer from
 * /reporting/engine, and the schedule list from /reporting/scheduled.
 */
import { FileText, Layers, CalendarClock, Clock } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useList } from "@/lib/data";

interface ReportRow {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EngineEntity {
  id?: string;
  name?: string;
  entity?: string;
  label?: string;
  fields?: { name?: string; label?: string; type?: string }[];
}

interface ScheduledReportRow {
  id?: string;
  name?: string;
  reportType?: string;
  schedule?: string;
  format?: string;
  isActive?: boolean;
  lastRunAt?: string;
  createdAt?: string;
}

export default function AnalyticsReportsTab() {
  const reports = useList<ReportRow>({ path: "/reporting" });
  const engine = useList<EngineEntity>({ path: "/reporting/engine" });
  const scheduled = useList<ScheduledReportRow>({ path: "/reporting/scheduled" });

  const activeScheduled = scheduled.data.filter((s) => s.isActive).length;

  const stats: StatCardItem[] = [
    {
      label: "Reports",
      value: reports.data.length > 0 ? reports.data.length : reports.total ?? "—",
      icon: <FileText size={18} />,
    },
    {
      label: "Engine entities",
      value: engine.data.length > 0 ? engine.data.length : engine.total ?? "—",
      icon: <Layers size={18} />,
    },
    {
      label: "Scheduled reports",
      value: scheduled.data.length > 0 ? scheduled.data.length : scheduled.total ?? "—",
      icon: <CalendarClock size={18} />,
    },
    {
      label: "Active schedules",
      value: activeScheduled,
      icon: <Clock size={18} />,
    },
  ];

  if (reports.loading || engine.loading || scheduled.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="analytics"
      title="Reports"
      description="Saved reports, the reporting engine semantic layer and delivery schedules."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Report library</h3>
            {reports.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {reports.error.message}
              </p>
            ) : reports.data.length === 0 ? (
              <EmptyState title="No reports" description="The reporting API returned no saved reports." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {reports.data.slice(0, 15).map((r) => (
                  <li
                    key={r.id ?? r.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {r.name ?? "—"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge variant={r.type === "SQL" ? "info" : "primary"}>{r.type ?? "BUILDER"}</Badge>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {r.createdAt ?? ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Engine semantic layer</h3>
            {engine.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {engine.error.message}
              </p>
            ) : engine.data.length === 0 ? (
              <EmptyState title="No engine entities" description="The reporting engine returned no semantic-layer entities." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {engine.data.slice(0, 15).map((e, i) => (
                  <li
                    key={e.id ?? e.name ?? e.entity ?? `engine-${i}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ fontWeight: 500 }}>{e.label ?? e.name ?? e.entity ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {e.fields?.length != null ? `${e.fields.length} fields` : "—"}
                      </span>
                      <Badge variant="info">{e.name ?? e.entity ?? "entity"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Scheduled deliveries</h3>
            {scheduled.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {scheduled.error.message}
              </p>
            ) : scheduled.data.length === 0 ? (
              <EmptyState title="No scheduled reports" description="The scheduled-reporting API returned no schedules." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {scheduled.data.slice(0, 15).map((s) => (
                  <li
                    key={s.id ?? s.name}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>
                      {s.name ?? "—"}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Badge variant={s.isActive ? "success" : "default"}>{s.isActive ? "ACTIVE" : "PAUSED"}</Badge>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {s.schedule ?? ""} · {s.format ?? ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DomainShell>
  );
}