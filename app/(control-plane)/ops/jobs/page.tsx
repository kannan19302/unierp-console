"use client";
/**
 * Ops → Jobs.
 * Background job queues and scheduled cron tasks from the real operations API.
 */
import { Clock3, Loader2 } from "lucide-react";
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

interface JobQueueRow {
  name?: string;
  active?: number;
  waiting?: number;
  completed?: number;
  failed?: number;
}

interface TaskRow {
  id?: string;
  name?: string;
  expression?: string;
  handler?: string;
  nextRun?: string | null;
  lastRun?: string | null;
  lastResult?: string | null;
  status?: string;
}

export default function OpsJobs() {
  const jobs = useList<JobQueueRow>({ path: "/platform/v1/operations/jobs" });
  const tasks = useList<TaskRow>({ path: "/platform/v1/operations/tasks" });

  const pending = jobs.data.reduce((acc, q) => acc + ((q.waiting ?? 0) + (q.active ?? 0)), 0);
  const failed = jobs.data.reduce((acc, q) => acc + (q.failed ?? 0), 0);

  const stats: StatCardItem[] = [
    { label: "Queues", value: jobs.data.length },
    { label: "In-flight", value: pending },
    { label: "Failed", value: failed },
    { label: "Scheduled tasks", value: tasks.data.length },
  ];

  if (jobs.loading || tasks.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Jobs"
      description="Background job queues and scheduled tasks running on the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Job queues
          </h3>
          {jobs.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{jobs.error.message}</p>
          ) : jobs.data.length === 0 ? (
            <EmptyState title="No job queues" description="The jobs endpoint returned no queues." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {jobs.data.map((q) => (
                <li
                  key={q.name ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 500 }}>
                    <Loader2 size={14} /> {q.name}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      active {q.active ?? 0} · waiting {q.waiting ?? 0} · done {q.completed ?? 0}
                    </span>
                    <Badge variant={(q.failed ?? 0) > 0 ? "danger" : "success"}>
                      {(q.failed ?? 0) > 0 ? `${q.failed} failed` : "clean"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Scheduled tasks
          </h3>
          {tasks.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{tasks.error.message}</p>
          ) : tasks.data.length === 0 ? (
            <EmptyState title="No scheduled tasks" description="The tasks endpoint returned no scheduled tasks." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {tasks.data.map((t) => (
                <li
                  key={t.id ?? t.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 500 }}>
                    <Clock3 size={14} /> {t.name ?? t.handler}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {t.handler ? `${t.handler} · ` : ""}
                      {t.expression ?? ""}
                      {t.nextRun ? ` · next ${formatTime(t.nextRun)}` : ""}
                    </span>
                    <Badge variant={taskStatusVariant(t.status, t.lastResult)}>
                      {t.status ?? "UNKNOWN"}
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

function taskStatusVariant(status?: string, lastResult?: string | null): "success" | "danger" | "warning" | "default" {
  const s = status?.toUpperCase() ?? "";
  if (s === "ENABLED" || s === "ACTIVE" || s === "COMPLETED") return "success";
  if (s === "FAILED" || s === "ERROR") return "danger";
  if (s === "RUNNING" || lastResult === "FAILED") return "warning";
  return "default";
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}