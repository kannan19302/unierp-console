"use client";
/**
 * Ops → Overview.
 * Platforms Operations landing — real dashboard KPIs (queue depth, outbox,
 * degraded tenants, open incidents), Grafana links and the live background-work
 * picture from the control-plane operations API. No mock rows.
 */
import {
  Activity,
  ArrowUpRight,
  Clock3,
  Inbox,
  TriangleAlert,
} from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface JobRow {
  id?: string;
  name?: string;
  type?: string;
  status?: string;
  startedAt?: string;
  finishedAt?: string;
  error?: string;
}

export default function OpsOverview() {
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const health = useItem<Record<string, unknown>>("/platform/v1/operations/health");
  const jobs = useList<JobRow>({ path: "/platform/v1/operations/jobs" });

  const s = summary.data ?? {};
  const metrics = (s.metrics ?? {}) as Record<string, unknown>;
  const queueDepth =
    Number(s.queueDepth ?? metrics.queueDepth ?? 0) || 0;
  const outboxLagSeconds =
    Number(s.outboxLagSeconds ?? s.outboxLag ?? metrics.outboxLagSeconds ?? 0) || 0;
  const degradedTenants =
    Number(s.degradedTenants ?? metrics.degradedTenants ?? 0) || 0;
  const deadLetters =
    Number(s.deadLetters ?? metrics.deadLetters ?? 0) || 0;

  const links = (s.links ?? {}) as Record<string, unknown>;
  const grafanaLinks = [
    { label: "Platform overview", href: links.platformOverview as string },
    { label: "Per-tenant SLO", href: links.perTenantSlo as string },
  ].filter((l) => typeof l.href === "string" && l.href.length > 0);

  const h = health.data ?? {};
  const openIncidents = Number(h.openIncidents ?? 0) || 0;
  const degradedServices = Number(h.degradedServices ?? 0) || 0;
  const availability = h.availability ?? "—";

  const activeCount = jobs.data.filter(
    (j) =>
      j.status === "ACTIVE" ||
      j.status === "RUNNING" ||
      j.status === "PENDING" ||
      j.status === "WAITING",
  ).length;

  const stats: StatCardItem[] = [
    { label: "Queue depth", value: queueDepth, icon: <Inbox size={18} /> },
    {
      label: "Outbox lag (s)",
      value: outboxLagSeconds,
      icon: <Clock3 size={18} />,
    },
    {
      label: "Degraded tenants",
      value: degradedTenants,
      icon: <TriangleAlert size={18} />,
      color:
        degradedTenants > 0
          ? "var(--color-warning)"
          : "var(--color-success)",
    },
    {
      label: "Open incidents",
      value: openIncidents,
      icon: <Activity size={18} />,
      color: openIncidents > 0 ? "var(--color-danger)" : "var(--color-success)",
    },
  ];

  if (health.loading || jobs.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Platform Operations"
      description="Queue, outbox, releases, workflows and maintenance for the UniERP control plane."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Availability & health
            </h3>
            <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              {degradedServices > 0
                ? `${degradedServices} degraded service(s)`
                : "All services nominal"}
            </p>
            <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
              <Badge variant={degradedServices > 0 ? "warning" : "success"}>
                {degradedServices} degraded
              </Badge>
              <Badge variant={openIncidents > 0 ? "danger" : "success"}>
                {openIncidents} incident(s)
              </Badge>
              <Badge variant="info">avail {String(availability)}</Badge>
            </div>
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Grafana
            </h3>
            {grafanaLinks.length === 0 ? (
              <EmptyState
                title="No Grafana links"
                description="The dashboard endpoint returned no links."
              />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {grafanaLinks.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-2)",
                        color: "var(--color-primary)",
                        textDecoration: "none",
                        fontSize: "var(--text-sm)",
                      }}
                    >
                      <ArrowUpRight size={14} /> {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Dead letters
            </h3>
            <p style={{ margin: "var(--space-2) 0 0", fontSize: "var(--text-xl)", fontWeight: 700 }}>
              {deadLetters}
            </p>
            <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              failed background jobs awaiting review
            </p>
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Background jobs
          </h3>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            {activeCount} active · {jobs.data.length} total in history
          </p>
          {jobs.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{jobs.error.message}</p>
          ) : jobs.data.length === 0 ? (
            <EmptyState title="No jobs in history" description="The operations endpoint returned no jobs." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {jobs.data.slice(0, 20).map((j) => (
                <li
                  key={j.id ?? j.name ?? j.type}
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
                        j.status === "COMPLETED"
                          ? "success"
                          : j.status === "FAILED"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {j.status ?? "UNKNOWN"}
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