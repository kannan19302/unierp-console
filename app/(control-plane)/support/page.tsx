"use client";
/**
 * Support → Dashboard.
 * KPI cards (open tickets, SLA breaches, active incidents, customers) plus
 * recent tickets and the support-admin summary — all real control-plane reads.
 */
import {
  Ticket,
  ShieldCheck,
  Users,
  AlertTriangle,
  Activity,
  Clock,
} from "lucide-react";
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

interface ServiceTicket {
  id: string;
  subject?: string;
  title?: string;
  ticketNumber?: string;
  status?: string;
  priority?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  tenantId?: string;
  customerId?: string;
}

interface CustomerRow {
  id: string;
  name: string;
  status?: string;
  plan?: string;
  region?: string;
}

interface SlaUptimeRow {
  id?: string;
  service?: string;
  name?: string;
  uptime?: number;
  target?: number;
  breaches?: number;
}

interface IncidentRow {
  id: string;
  title?: string;
  summary?: string;
  status?: string;
  severity?: string;
}

interface SupportAdmin {
  agentsOnline?: number;
  openTickets?: number;
  unassigned?: number;
  avgFirstResponse?: string | number;
  slaCoverage?: string | number;
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

export default function SupportDashboard() {
  const tickets = useList<ServiceTicket>({ path: "/saas/support" });
  const tenants = useList<CustomerRow>({ path: "/platform/v1/super-admin/tenants" });
  const sla = useList<SlaUptimeRow>({ path: "/platform/v1/enterprise-scale/sla-uptimes" });
  const incidents = useList<IncidentRow>({ path: "/platform/v1/operations/incidents" });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const admin = useItem<SupportAdmin>("/saas/support-admin");

  const openStatuses = new Set(["OPEN", "NEW", "IN_PROGRESS", "PENDING", "ASSIGNED", "REOPENED"]);
  const openTickets = tickets.data.filter((t) => openStatuses.has((t.status ?? "").toUpperCase())).length;
  const activeIncidents = incidents.data.filter((i) =>
    !["RESOLVED", "CLOSED", "MITIGATED"].includes((i.status ?? "").toUpperCase()),
  ).length;
  const slaBreaches = sla.data.reduce((n, r) => n + (num(r.breaches) ?? 0), 0);

  const s = summary.data ?? {};
  const stats: StatCardItem[] = [
    {
      label: "Open tickets",
      value: num(s.openTickets) ?? openTickets,
      icon: <Ticket size={18} />,
      color: "var(--color-primary)",
    },
    {
      label: "SLA breaches",
      value: num(s.slaBreaches) ?? slaBreaches,
      icon: <AlertTriangle size={18} />,
      color: "var(--color-danger)",
    },
    {
      label: "Active incidents",
      value: num(s.openIncidents) ?? activeIncidents,
      icon: <Activity size={18} />,
      color: "var(--color-warning)",
    },
    {
      label: "Customers",
      value: num(s.totalTenants) ?? tenants.total ?? tenants.data.length,
      icon: <Users size={18} />,
      color: "var(--color-success)",
    },
  ];

  if (tickets.loading || tenants.loading || sla.loading || incidents.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }


  return (
    <DomainShell
      domainId="support"
      title="Support"
      description="Ticket queue, SLA compliance, customers and incident posture."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "var(--space-4)",
          }}
        >
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent tickets</h3>
            {tickets.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{tickets.error.message}</p>
            ) : tickets.data.length === 0 ? (
              <EmptyState title="No support tickets" description="The support endpoint returned no tickets." />
            ) : (
              <ul
                style={{
                  listStyle: "none",
                  margin: "var(--space-3) 0 0",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {tickets.data.slice(0, 8).map((t) => (
                  <li
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: "block",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {t.subject ?? t.title ?? (t.ticketNumber ? `Ticket ${t.ticketNumber}` : t.id)}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        {fmtDate(t.createdAt)} {t.priority ? `· ${t.priority}` : ""}
                      </span>
                    </span>
                    <Badge
                      variant={
                        ["RESOLVED", "CLOSED", "COMPLETED"].includes((t.status ?? "").toUpperCase())
                          ? "success"
                          : ["IN_PROGRESS", "ASSIGNED"].includes((t.status ?? "").toUpperCase())
                            ? "primary"
                            : ["PENDING", "WAITING"].includes((t.status ?? "").toUpperCase())
                              ? "warning"
                              : "default"
                      }
                    >
                      {t.status ?? "UNKNOWN"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Support admin</h3>
            {admin.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{admin.error.message}</p>
            ) : !admin.data ? (
              <EmptyState title="No admin summary" description="The support-admin endpoint returned no data." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {[
                  { label: "Agents online", value: admin.data.agentsOnline, icon: <Users size={16} /> },
                  { label: "Open (admin)", value: admin.data.openTickets, icon: <Ticket size={16} /> },
                  { label: "Unassigned", value: admin.data.unassigned, icon: <Clock size={16} /> },
                  { label: "Avg first response", value: admin.data.avgFirstResponse, icon: <ShieldCheck size={16} /> },
                  {
                    label: "SLA coverage",
                    value: admin.data.slaCoverage != null ? `${admin.data.slaCoverage}%` : undefined,
                    icon: <AlertTriangle size={16} />,
                  },
                ].map((row) => (
                  <li
                    key={row.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {row.icon} <span>{row.label}</span>
                    </span>
                    <span style={{ fontWeight: 600 }}>{row.value != null ? String(row.value) : "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}