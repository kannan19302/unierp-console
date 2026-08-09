"use client";
/**
 * Security & Compliance → Compliance.
 *
 * Compliance posture from the enterprise-scale compliance endpoints: framework
 * coverage, isolation policies and enforcement state. Real reads only.
 */
import { BookCheck, Lock, ShieldCheck, Scale } from "lucide-react";
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

interface ComplianceFramework {
  id: string;
  name?: string;
  version?: string;
  coveragePct?: number;
  status?: string;
  controls?: number;
  controlsPassed?: number;
}

interface IsolationPolicy {
  id?: string;
  name?: string;
  description?: string;
  enforcement?: string;
  isActive?: boolean;
}

function statusVariant(status: string | undefined) {
  const s = (status ?? "").toUpperCase();
  if (s === "COMPLIANT" || s === "PASS" || s === "HEALTHY") return "success";
  if (s === "PARTIAL" || s === "REVIEW" || s === "IN_PROGRESS") return "warning";
  if (s === "NON_COMPLIANT" || s === "FAIL" || s === "BREACHED") return "danger";
  return "default";
}

export default function SecurityCompliance() {
  const frameworks = useList<ComplianceFramework>({
    path: "/platform/v1/enterprise-scale/compliance-frameworks",
  });
  const isolation = useList<IsolationPolicy>({
    path: "/platform/v1/enterprise-scale/isolation-policies",
  });

  const covered = frameworks.data.filter((f) => ((f.coveragePct ?? 0) >= 100) || f.status === "COMPLIANT");
  const enforcedPoly = isolation.data.filter((p) => p.isActive).length;

  const stats = [
    { label: "Frameworks", value: frameworks.data.length, icon: <Scale size={18} /> },
    { label: "Fully covered", value: covered.length, icon: <ShieldCheck size={18} /> },
    { label: "Isolation policies", value: isolation.data.length, icon: <Lock size={18} /> },
    { label: "Enforced", value: enforcedPoly, icon: <ShieldCheck size={18} /> },
  ] as StatCardItem[];

  if (frameworks.loading || isolation.loading) {
    return (
      <DomainShell domainId="security" title="Compliance">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Compliance"
      description="Compliance posture, frameworks and isolation enforcement."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <Scale size={16} /> Frameworks
            </h3>
            {frameworks.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {frameworks.error.message}
              </p>
            ) : frameworks.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No compliance frameworks" description="The compliance endpoint returned no frameworks." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {frameworks.data.map((f) => (
                  <li key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>
                      {f.name ?? f.id}
                      {f.version ? <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}> · {f.version}</span> : null}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {f.coveragePct != null ? `${f.coveragePct}%` : f.controls != null ? `${f.controlsPassed ?? "—"} / ${f.controls}` : null}
                      </span>
                      <Badge variant={statusVariant(f.status)}>{f.status ?? "STATUS"}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <Lock size={16} /> Isolation policies
            </h3>
            {isolation.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {isolation.error.message}
              </p>
            ) : isolation.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No isolation policies" description="The isolation endpoint returned no policies." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {isolation.data.map((p) => (
                  <li key={p.id ?? p.name ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{p.name ?? p.id ?? "—"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      {p.enforcement && (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {p.enforcement}
                        </span>
                      )}
                      <Badge variant={p.isActive ? "success" : "default"}>
                        {p.isActive ? "ENFORCED" : "INACTIVE"}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            <ShieldCheck size={16} /> Compliance posture
          </h3>
          <div style={{ margin: "var(--space-3) 0 0", display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
            {frameworks.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
                {frameworks.error.message}
              </p>
            ) : frameworks.data.length === 0 ? (
              <EmptyState title="No compliance data" description="The compliance endpoint returned no frameworks." />
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
                {frameworks.data.map((f) => {
                  const cls = ((f.coveragePct ?? 0) >= 100 || f.status === "COMPLIANT") ? "var(--color-success)" : "var(--color-warning)";
                  return (
                    <li key={f.id} style={{ color: cls }}>
                      <Badge variant={(f.coveragePct ?? 0) >= 100 || f.status === "COMPLIANT" ? "success" : "warning"}>
                        {f.name ?? f.id}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </DomainShell>
  );
}