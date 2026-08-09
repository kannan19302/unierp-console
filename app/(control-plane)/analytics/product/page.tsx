"use client";
/**
 * Analytics → Product.
 * Deep-expansion analytics: KPI catalogue, metric definitions and feature
 * adoption surfaced by the analytics deep endpoint.
 */
import { BarChart3, Layers, Package, Sparkles } from "lucide-react";
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

interface ProductDeepRow {
  id?: string;
  name?: string;
  code?: string;
  label?: string;
  category?: string;
  unit?: string;
  value?: string | number;
  aggregation?: string;
  adoption?: number;
  changePct?: number;
}

interface ProductDeepAnalytics {
  kpis?: ProductDeepRow[];
  metricCatalog?: ProductDeepRow[];
  features?: ProductDeepRow[];
  dashboards?: { id?: string; name?: string; widgetCount?: number }[];
  generatedAt?: string;
}

export default function AnalyticsProductTab() {
  const deep = useItem<ProductDeepAnalytics>("/analytics/deep-expansion");
  const d = deep.data ?? ({} as ProductDeepAnalytics);

  const kpis = d.kpis ?? [];
  const catalog = d.metricCatalog ?? [];
  const features = d.features ?? [];

  const stats: StatCardItem[] = [
    {
      label: "KPIs tracked",
      value: kpis.length > 0 ? kpis.length : "—",
      icon: <BarChart3 size={18} />,
    },
    {
      label: "Metric catalogue",
      value: catalog.length > 0 ? catalog.length : "—",
      icon: <Layers size={18} />,
    },
    {
      label: "Feature adoption",
      value: features.length > 0 ? `${features.length} tracked` : "—",
      icon: <Package size={18} />,
    },
    {
      label: "Deep dashboards",
      value: d.dashboards?.length ?? "—",
      icon: <Sparkles size={18} />,
    },
  ];

  if (deep.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="analytics"
      title="Product"
      description="KPI catalogue, metric definitions and feature adoption analytics."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>KPI definitions</h3>
            {deep.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {deep.error.message}
              </p>
            ) : kpis.length === 0 ? (
              <EmptyState title="No KPIs defined" description="The deep analytics endpoint returned no KPI definitions." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {kpis.slice(0, 18).map((k, i) => (
                  <li
                    key={k.id ?? k.code ?? `kpi-${i}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "var(--space-3)",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{k.name ?? k.label ?? k.code ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {k.value ?? "—"}
                        {k.changePct != null ? ` · ${k.changePct > 0 ? "+" : ""}${k.changePct}%` : ""}
                      </span>
                      {k.unit && <Badge variant="info">{k.unit}</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Metric catalogue</h3>
            {deep.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {deep.error.message}
              </p>
            ) : catalog.length === 0 ? (
              <EmptyState title="No metrics defined" description="The deep analytics endpoint returned no metric definitions." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {catalog.slice(0, 18).map((m, i) => (
                  <li
                    key={m.id ?? m.code ?? `metric-${i}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ fontWeight: 500 }}>{m.name ?? m.label ?? m.code ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {m.category ?? "—"}
                      </span>
                      <Badge variant="primary">{m.aggregation ?? "SUM"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Feature adoption</h3>
            {deep.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", marginTop: "var(--space-2)" }}>
                {deep.error.message}
              </p>
            ) : features.length === 0 ? (
              <EmptyState title="No feature adoption" description="The deep analytics endpoint returned no feature adoption data." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {features.slice(0, 18).map((f, i) => (
                  <li
                    key={f.id ?? f.code ?? `feature-${i}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ fontWeight: 500 }}>{f.name ?? f.label ?? f.code ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {f.adoption != null ? `${f.adoption}% adopted` : "—"}
                      </span>
                      <Badge variant={f.adoption == null ? "default" : f.adoption >= 50 ? "success" : "warning"}>
                        {f.adoption != null ? `${f.adoption}%` : "N/A"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </DomainShell>
  );
}