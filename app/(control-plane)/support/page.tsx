"use client";
/**
 * Support → Dashboard (OCC-03 Provider Workforce & Support Desk).
 * KPI cards (open tickets, SLA breaches, active incidents, customers) plus
 * recent tickets and the support-admin summary — all real control-plane reads.
 */
import { useState } from "react";
import {
  Ticket,
  ShieldCheck,
  Users,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Spinner,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
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
  const toast = useToast();
  const canWriteSupport = usePermission("system.support.write");

  const tickets = useList<ServiceTicket>({ path: "/saas/support" });
  const tenants = useList<CustomerRow>({ path: "/platform/v1/super-admin/tenants" });
  const sla = useList<SlaUptimeRow>({ path: "/platform/v1/enterprise-scale/sla-uptimes" });
  const incidents = useList<IncidentRow>({ path: "/platform/v1/operations/incidents" });
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const admin = useItem<SupportAdmin>("/saas/support-admin");

  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveTarget, setResolveTarget] = useState<ServiceTicket | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const [resolving, setResolving] = useState(false);

  const handleResolve = async () => {
    if (!resolveTarget) return;
    setResolving(true);
    try {
      await api.post(`/platform/v1/support/tickets/${resolveTarget.id}/resolve`, {
        resolution: resolutionText,
        actorId: "provider-operator",
      });
      await tickets.reload();
      toast.success("Ticket Resolved", `Ticket "${resolveTarget.subject || resolveTarget.id}" marked resolved.`);
      setResolveOpen(false);
      setResolveTarget(null);
      setResolutionText("");
    } catch {
      toast.error("Resolution Failed", "Failed to resolve support ticket.");
    } finally {
      setResolving(false);
    }
  };

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
      <DomainShell domainId="support" title="Support">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="support"
      title="Provider Workforce & Support Desk"
      description="Operator support queues, SLA breach tracking, customer health inspection, and delegated resolution."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              tickets.reload();
              admin.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh Queues
          </Button>
        </div>
      }
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
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Active ticket queue</h3>
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
                {tickets.data.slice(0, 10).map((t) => (
                  <li
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-3) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
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
                        {fmtDate(t.createdAt)} {t.priority ? `· Priority: ${t.priority}` : ""}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
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
                      {!["RESOLVED", "CLOSED"].includes((t.status ?? "").toUpperCase()) && canWriteSupport && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setResolveTarget(t);
                            setResolveOpen(true);
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Support Operations Health</h3>
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

      <Modal
        open={resolveOpen}
        onClose={() => {
          setResolveOpen(false);
          setResolveTarget(null);
        }}
        title={`Resolve Support Ticket: ${resolveTarget?.subject || resolveTarget?.id}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Provide resolution notes and close the customer inquiry ticket.
          </p>
          <FormField label="Resolution Summary" required>
            <Input
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="e.g. Cleared stuck background job and verified outbox processing."
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleResolve}
              disabled={resolving || !resolutionText.trim()}
            >
              {resolving ? "Resolving..." : "Confirm Resolution"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}