"use client";
/**
 * Security & Compliance → Audit.
 *
 * Audit trail from the real `/audit/security` surface: actor, action, target,
 * outcome and timestamp. No mock rows.
 */
import { FileSearch, ShieldCheck, UserX } from "lucide-react";
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

interface AuditRow {
  id?: string;
  userId?: string;
  userEmail?: string;
  action?: string;
  category?: string;
  target?: string;
  outcome?: string;
  status?: string;
  ipAddress?: string;
  createdAt?: string;
}

function formatDate(value: string | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function outcomeVariant(outcome: string | undefined) {
  const o = (outcome ?? "").toUpperCase();
  if (o === "SUCCESS" || o === "ALLOWED" || o === "PASS") return "success";
  if (o === "DENIED" || o === "FAILED" || o === "FAILURE" || o === "BLOCKED") return "danger";
  if (o === "PENDING" || o === "REVIEW") return "warning";
  return "default";
}

export default function SecurityAudit() {
  const audit = useList<AuditRow>({ path: "/audit/security" });

  const denied = audit.data.filter((a) => {
    const o = (a.outcome ?? a.status ?? "").toUpperCase();
    return o === "DENIED" || o === "FAILED" || o === "FAILURE" || o === "BLOCKED";
  }).length;
  const actions = audit.data.reduce((acc, a) => {
    const key = a.action ?? a.category ?? "other";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats: StatCardItem[] = [
    { label: "Audit events", value: audit.total ?? audit.data.length, icon: <FileSearch size={18} /> },
    { label: "Denied / failed", value: denied, icon: <UserX size={18} /> },
    { label: "Action types", value: Object.keys(actions).length, icon: <ShieldCheck size={18} /> },
  ];

  if (audit.loading) {
    return (
      <DomainShell domainId="security" title="Audit">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Audit"
      description="Security audit trail across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        {audit.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {audit.error.message}
          </p>
        ) : audit.data.length === 0 ? (
          <EmptyState title="No audit events" description="The audit endpoint returned no events." />
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent audit events</h3>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {audit.data.slice(0, 50).map((a) => {
                const outcome = a.outcome ?? a.status;
                return (
                  <li key={a.id ?? `${a.action}-${a.createdAt}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{a.action ?? a.category ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {a.userEmail && <span>{a.userEmail}</span>}
                      {a.target && <span>{a.target}</span>}
                      {a.ipAddress && <span>{a.ipAddress}</span>}
                      <span>{formatDate(a.createdAt)}</span>
                      <Badge variant={outcomeVariant(outcome)}>{outcome ?? "—"}</Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}