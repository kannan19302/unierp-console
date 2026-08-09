"use client";
/**
 * Support / SLA.
 * Enterprise-level SLA uptime targets read from the sla-uptimes endpoint.
 */
import { Gauge, FileClock, AlertTriangle, BadgeCheck } from "lucide-react";
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

interface SlaRow {
  id?: string;
  service?: string;
  name?: string;
  uptime?: number;
  target?: number;
  breaches?: number;
  status?: string;
  period?: string;
}

function num(v: unknown): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function pct(v?: number): string {
  return v == null ? "—" : `${v}%`;
}

function slaVariant(status?: string, breaches?: number): "success" | "warning" | "danger" | "default" {
  const st = (status ?? "").toUpperCase();
  if (["VIOLATED", "BREACHED", "FAILED", "OUTAGE"].includes(st) || Number(breaches) > 0) return "danger";
  if (["AT_RISK", "DEGRADED", "NEAR_MISS"].includes(st)) return "warning";
  if (["MET", "WITHIN", "HEALTHY", "OPERATIONAL"].includes(st)) return "success";
  return "default";
}

export default function SupportSla() {
  const sla = useList<SlaRow>({ path: "/platform/v1/enterprise-scale/sla-uptimes" });

  const breaches = sla.data.reduce((n, r) => n + (num(r.breaches) ?? 0), 0);
  const atRisk = sla.data.filter(
    (r) =>
      ["AT_RISK", "DEGRADED", "NEAR_MISS"].includes((r.status ?? "").toUpperCase()) ||
      Number(r.breaches) > 0,
  ).length;

  const stats: StatCardItem[] = [
    { label: "Services tracked", value: sla.data.length, icon: <Gauge size={18} />, loading: sla.loading },
    { label: "SLA breaches", value: breaches, icon: <AlertTriangle size={18} />, loading: sla.loading },
    { label: "At risk", value: atRisk, icon: <FileClock size={18} />, loading: sla.loading },
    { label: "Within target", value: sla.data.length - atRisk, icon: <BadgeCheck size={18} />, loading: sla.loading },
  ];

  return (
    <DomainShell
      domainId="support"
      title="SLA"
      description="Enterprise-scale service-level uptime commitments."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />
        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Uptime commitments</h3>
          {sla.loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
              <Spinner size="md" />
            </div>
          ) : sla.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{sla.error.message}</p>
          ) : sla.data.length === 0 ? (
            <EmptyState title="No SLA data" description="The sla-uptimes endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {sla.data.map((r) => {
                const uptime = num(r.uptime);
                const target = num(r.target);
                const within = uptime != null && target != null ? uptime >= target : undefined;
                return (
                  <li
                    key={r.id ?? r.service ?? r.name ?? "?"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-3) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontWeight: 600 }}>
                        {r.service ?? r.name ?? "Unnamed service"}
                      </span>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        Target {pct(target)} · Actual {pct(uptime)}
                        {within !== undefined ? ` · ${within ? "within target" : "below target"}` : ""}
                        {r.period ? ` · ${r.period}` : ""}
                        {num(r.breaches) != null ? ` · ${num(r.breaches)} breaches` : ""}
                      </span>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{pct(uptime)}</span>
                      <Badge variant={slaVariant(r.status, num(r.breaches))}>
                        {r.status ?? "UNKNOWN"}
                      </Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}