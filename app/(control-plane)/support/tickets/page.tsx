"use client";
/**
 * Support → Tickets.
 * Three real ticket streams — the support queue, service-management tickets
 * and the helpdesk — with per-stream loading, error and empty states.
 */
import { Ticket, Wrench, Headphones } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList, type UseListResult } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface TicketRow {
  id: string;
  subject?: string;
  title?: string;
  ticketNumber?: string;
  status?: string;
  priority?: string;
  category?: string;
  assignee?: string;
  assignedTo?: string;
  customer?: string;
  tenantId?: string;
  createdAt?: string;
  updatedAt?: string;
}

function fmtDate(v?: string): string {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString();
}

function ticketVariant(status?: string): "success" | "primary" | "warning" | "danger" | "info" | "default" {
  const st = (status ?? "").toUpperCase();
  if (["RESOLVED", "CLOSED", "COMPLETED", "DONE"].includes(st)) return "success";
  if (["IN_PROGRESS", "ASSIGNED", "ACTIVE"].includes(st)) return "primary";
  if (["PENDING", "WAITING", "ON_HOLD"].includes(st)) return "warning";
  if (["FAILED", "ESCALATED", "BLOCKED"].includes(st)) return "danger";
  if (["NEW", "OPEN", "REOPENED"].includes(st)) return "info";
  return "default";
}

function isOpen(status?: string): boolean {
  return !["RESOLVED", "CLOSED", "COMPLETED", "DONE"].includes((status ?? "").toUpperCase());
}

function TicketStream({
  title,
  description,
  hook,
}: {
  title: string;
  description: string;
  hook: UseListResult<TicketRow>;
}) {
  return (
    <Card padding="md">
      <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>{title}</h3>
      <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
        {description}
      </p>
      {hook.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
          <Spinner size="md" />
        </div>
      ) : hook.error ? (
        <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{hook.error.message}</p>
      ) : hook.data.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()}`} description="This stream returned no tickets." />
      ) : (
        <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
          {hook.data.map((t) => (
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
                <span style={{ display: "block", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.subject ?? t.title ?? (t.ticketNumber ? `Ticket ${t.ticketNumber}` : t.id)}
                </span>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  {fmtDate(t.createdAt)}
                  {t.customer ? ` · ${t.customer}` : ""}
                  {t.priority ? ` · ${t.priority}` : ""}
                </span>
              </span>
              <Badge variant={ticketVariant(t.status)}>{t.status ?? "UNKNOWN"}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function SupportTickets() {
  const support = useList<TicketRow>({ path: "/saas/support" });
  const serviceMgmt = useList<TicketRow>({ path: "/service-management/tickets" });
  const helpdesk = useList<TicketRow>({ path: "/communication/helpdesk" });

  const stats: StatCardItem[] = [
    {
      label: "Support open",
      value: support.data.filter((t) => isOpen(t.status)).length,
      icon: <Ticket size={18} />,
      loading: support.loading,
    },
    {
      label: "Service mgmt open",
      value: serviceMgmt.data.filter((t) => isOpen(t.status)).length,
      icon: <Wrench size={18} />,
      loading: serviceMgmt.loading,
    },
    {
      label: "Helpdesk open",
      value: helpdesk.data.filter((t) => isOpen(t.status)).length,
      icon: <Headphones size={18} />,
      loading: helpdesk.loading,
    },
    {
      label: "Total in flight",
      value:
        support.data.filter((t) => isOpen(t.status)).length +
        serviceMgmt.data.filter((t) => isOpen(t.status)).length +
        helpdesk.data.filter((t) => isOpen(t.status)).length,
      icon: <Ticket size={18} />,
    },
  ];

  return (
    <DomainShell
      domainId="support"
      title="Tickets"
      description="Support, service-management and helpdesk ticket streams."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <TicketStream title="Support tickets" description="Queued through /saas/support." hook={support} />
        <TicketStream title="Service management tickets" description="Queued through /service-management/tickets." hook={serviceMgmt} />
        <TicketStream title="Helpdesk" description="Queued through /communication/helpdesk." hook={helpdesk} />
      </div>
    </DomainShell>
  );
}