"use client";
/**
 * AI Platform → Costs.
 * AI spend from the operations dashboard summary. No standalone AI cost
 * endpoint is exposed, so this reads the cost fields the dashboard returns.
 */
import { PiggyBank, Scale, Wallet } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

function num(v: unknown): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v !== "" && !Number.isNaN(Number(v))) return Number(v);
  return undefined;
}

function fmtMoney(v: number | undefined): string {
  if (v === undefined) return "—";
  return `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AiCostsPage() {
  const summary = useItem<Record<string, unknown>>("/platform/v1/operations/dashboard");
  const s = summary.data ?? {};

  const { aiCost, aiCostsTotal, aiCostPerRequest, aiBudget } = s;
  const total = num(aiCostsTotal ?? aiCost);
  const perRequest = num(aiCostPerRequest);
  const budget = num(aiBudget);

  const stats: StatCardItem[] = [
    { label: "Total AI spend", value: fmtMoney(total), icon: <PiggyBank size={18} /> },
    { label: "Cost per request", value: fmtMoney(perRequest), icon: <Scale size={18} /> },
    { label: "Budget", value: fmtMoney(budget), icon: <Wallet size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="costs"
      description="Provider-side AI spend and unit economics."
    >
      {summary.loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          <StatCardRow stats={stats} columns={3} />
          <Card padding="md">
            {summary.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {summary.error.message}
              </p>
            ) : total === undefined && perRequest === undefined && budget === undefined ? (
              <EmptyState
                title="No cost data"
                description="The operations dashboard summary returned no AI cost fields."
              />
            ) : (
              <div style={{ marginTop: "var(--space-3)" }}>
                <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>AI spend breakdown</h3>
                <ul
                  style={{
                    listStyle: "none",
                    margin: "var(--space-3) 0 0",
                    padding: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {[
                    { label: "Total spend", value: fmtMoney(total) },
                    { label: "Cost per request", value: fmtMoney(perRequest) },
                    { label: "Monthly budget", value: fmtMoney(budget) },
                  ].map((r) => (
                    <li
                      key={r.label}
                      style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                    >
                      <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                        {r.label}
                      </span>
                      <span style={{ fontWeight: 500 }}>{r.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      )}
    </DomainShell>
  );
}