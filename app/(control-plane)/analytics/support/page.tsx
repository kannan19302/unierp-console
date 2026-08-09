"use client";
/**
 * Analytics → Support.
 * Tenant health and churn risk as support signals: health scores, at-risk
 * tenants and trial-conversion health from the SaaS revenue-churn endpoint,
 * plus degraded tenants from the operations dashboard.
 */
import { HeartPulse, ShieldAlert, Users, Activity, FileWarning } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem } from "@/lib/data";

interface RevenueChurnHealth {
  healthScore?: number;
  healthDimensions?: { name?: string; weight?: number }[];
  churnProbabilityPct?: number;
  atRisk?: { tenantId?: string; name?: string; healthScore?: number; mrrAtRisk?: number }[];
  trialConversion?: {
    totalTrials?: number;
    activeTrials?: number;
    convertedTrials?: number;
    conversionRatePct?: number;
  };
  topRiskFactors?: string[];
}

interface OpsDashboard {
  status?: string;
  metrics?: { degradedTenants?: number };
}

export default function AnalyticsSupportTab() {
  const health = useItem<RevenueChurnHealth>("/saas/revenue-churn-health");
  const dashboard = useItem<OpsDashboard>("/platform/v1/operations/dashboard");

  const h = health.data ?? ({} as RevenueChurnHealth);
  const degraded = dashboard.data?.metrics?.degradedTenants;

  const money = (v?: number): string =>
    v == null || Number.isNaN(v) ? "—" : `$${Math.round(v).toLocaleString()}`;

  const stats: StatCardItem[] = [
    {
      label: "Tenant health score",
      value: h.healthScore != null ? String(h.healthScore) : "—",
      icon: <HeartPulse size={18} />,
    },
    {
      label: "Churn probability",
      value: h.churnProbabilityPct != null ? `${h.churnProbabilityPct}%` : "—",
      icon: <ShieldAlert size={18} />,
      color: h.churnProbabilityPct != null && h.churnProbabilityPct >= 25 ? "var(--color-danger)" : undefined,
    },
    {
      label: "At-risk accounts",
      value: h.atRisk?.length ?? "—",
      icon: <Users size={18} />,
    },
    {
      label: "Trial conversion",
      value: h.trialConversion?.conversionRatePct != null ? `${h.trialConversion.conversionRatePct}%` : "—",
      icon: <FileWarning size={18} />,
    },
    {
      label: "Degraded tenants",
      value: degraded ?? "—",
      icon: <Activity size={18} />,
      color: degraded != null && degraded > 0 ? "var(--color-danger)" : undefined,
    },
  ];

  if (health.loading || dashboard.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="analytics"
      title="Support"
      description="Tenant health, churn risk, trial conversion and operational degraded state."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>At-risk accounts</h3>
            {health.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {health.error.message}
              </p>
            ) : !h.atRisk || h.atRisk.length === 0 ? (
              <EmptyState title="No at-risk accounts" description="No tenants are currently flagged as at risk of churn." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {h.atRisk.map((t, i) => (
                  <li
                    key={t.tenantId ?? t.name ?? `at-risk-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{t.name ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {t.healthScore != null ? `health ${t.healthScore}` : ""}
                        {t.mrrAtRisk != null ? ` · ${money(t.mrrAtRisk)} at risk` : ""}
                      </span>
                      <Badge variant={t.healthScore == null ? "default" : t.healthScore < 50 ? "danger" : "warning"}>
                        {t.healthScore ?? "N/A"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Health dimensions</h3>
            {health.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {health.error.message}
              </p>
            ) : !h.healthDimensions || h.healthDimensions.length === 0 ? (
              <EmptyState title="No health dimensions" description="The revenue-churn endpoint returned no health dimension weights." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {h.healthDimensions.map((d, i) => (
                  <li key={d.name ?? `dimension-${i}`} style={rowStyle}>
                    <span>{d.name}</span>
                    <span>{d.weight != null ? `${d.weight}%` : "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Trial funnel</h3>
            {health.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-3)" }}>
                {health.error.message}
              </p>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {(
                  [
                    ["Total trials", h.trialConversion?.totalTrials ?? "—"],
                    ["Active trials", h.trialConversion?.activeTrials ?? "—"],
                    ["Converted", h.trialConversion?.convertedTrials ?? "—"],
                    ["Conversion rate", h.trialConversion?.conversionRatePct != null ? `${h.trialConversion.conversionRatePct}%` : "—"],
                  ] as const
                ).map(([label, value]) => (
                  <li key={label} style={rowStyle}>
                    <span>{label}</span>
                    <span>{value}</span>
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

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "var(--space-3)",
  padding: "var(--space-2) 0",
  borderBottom: "1px solid var(--color-border)",
  fontSize: "var(--text-sm)",
} as const;