"use client";
/**
 * Overview → Operations.
 * Background jobs, scheduled tasks and operational logs from the real
 * operations API.
 */
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";

interface JobRow {
  id?: string;
  name?: string;
  type?: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
}

interface LogRow {
  id?: string;
  message?: string;
  level?: string;
  createdAt?: string;
}

export default function OverviewOperations() {
  const jobs = useList<JobRow>({ path: "/platform/v1/operations/jobs" });
  const logs = useList<LogRow>({ path: "/platform/v1/operations/logs" });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");

  const s = summary.data ?? {};
  const queueDepth = Number(s.queueDepth) || 0;
  const outboxLag = Number(s.outboxLag) || 0;
  const degradedTenants = Number(s.degradedTenants) || 0;

  const stats: StatCardItem[] = [
    { label: "Jobs", value: jobs.data.length },
    { label: "Queue depth", value: queueDepth },
    { label: "Outbox lag", value: outboxLag },
    { label: "Degraded tenants", value: degradedTenants },
  ];

  if (jobs.loading || logs.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Operations</h2>
        <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
          Background jobs, scheduled tasks and operational logs.
        </p>
      </div>

      <StatCardRow stats={stats} columns={4} />

      <section>
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Background jobs</h3>
        {jobs.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{jobs.error.message}</p>
        ) : jobs.data.length === 0 ? (
          <EmptyState title="No jobs in history" description="The operations endpoint returned no jobs." />
        ) : (
          <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
            {jobs.data.slice(0, 20).map((j) => (
              <li
                key={j.id ?? j.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span style={{ fontWeight: 500 }}>{j.name ?? j.type ?? j.id}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {j.finishedAt ? `done ${j.finishedAt}` : j.startedAt ? `started ${j.startedAt}` : ""}
                  </span>
                  <Badge
                    variant={
                      j.status === "COMPLETED" ? "success" : j.status === "FAILED" || j.status === "FAILED_EXTERNAL" ? "danger" : "default"
                    }
                  >
                    {j.status ?? "UNKNOWN"}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card padding="md">
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent operational logs</h3>
        {logs.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{logs.error.message}</p>
        ) : logs.data.length === 0 ? (
          <EmptyState title="No operational logs" description="The operations endpoint returned no logs." />
        ) : (
          <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
            {logs.data.slice(0, 20).map((l) => (
              <li
                key={l.id ?? l.message}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {l.message}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>{l.createdAt ?? ""}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}