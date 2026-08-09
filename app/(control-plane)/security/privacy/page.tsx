"use client";
/**
 * Security & Compliance → Privacy.
 * GDPR posture: retention policies, erasure requests and GDPR status, read
 * from the real `/saas-portal/gdpr-compliance` controller resources.
 */
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

interface RetentionPolicy {
  id?: string;
  entityType?: string;
  retentionDays?: number;
  action?: string;
  isActive?: boolean;
  lastRunAt?: string;
}

interface ErasureRequest {
  id?: string;
  subjectEmail?: string;
  subjectName?: string;
  status?: string;
  entityTypes?: string[];
  erasedAt?: string;
  createdAt?: string;
}

interface GdprStatus {
  compliant?: boolean;
  dpaSigned?: boolean;
  dataExports?: number;
  erasureRequests?: number;
  dataProcessor?: string;
}

export default function SecurityPrivacy() {
  const policies = useList<RetentionPolicy>({
    path: "/saas-portal/gdpr-compliance/retention-policies",
  });
  const erasures = useList<ErasureRequest>({
    path: "/saas-portal/gdpr-compliance/erasure-requests",
  });
  const status = useItem<GdprStatus>("/saas-portal/gdpr-compliance/gdpr-status");

  const activePolicies = policies.data.filter((p) => p.isActive).length;
  const pendingErasures = erasures.data.filter((r) => r.status === "PENDING").length;

  const stats: StatCardItem[] = [
    { label: "Retention policies", value: activePolicies },
    { label: "Erasure requests", value: erasures.data.length },
    { label: "Pending erasures", value: pendingErasures },
    { label: "Data exports", value: status.data?.dataExports ?? "—" },
  ];

  const loading = policies.loading || erasures.loading || status.loading;
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Privacy"
      description="GDPR compliance: retention policies, erasure requests and subject access."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>GDPR status</h3>
          {status.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {status.error.message}
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Compliance</span>
                <Badge variant={status.data?.compliant ? "success" : "danger"}>
                  {status.data?.compliant ? "Compliant" : "Non-compliant"}
                </Badge>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>DPA signed</span>
                <Badge variant={status.data?.dpaSigned ? "success" : "warning"}>
                  {status.data?.dpaSigned ? "Signed" : "Unsigned"}
                </Badge>
              </li>
              <li style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Data processor</span>
                <span>{status.data?.dataProcessor ?? "—"}</span>
              </li>
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Retention policies</h3>
          {policies.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {policies.error.message}
            </p>
          ) : policies.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No retention policies" description="The retention-policies endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {policies.data.map((p) => (
                <li key={p.id ?? p.entityType} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.entityType ?? p.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {p.retentionDays != null ? `${p.retentionDays} days` : "—"}
                      {p.action ? ` · ${p.action}` : ""}
                      {p.lastRunAt ? ` · last run ${p.lastRunAt}` : ""}
                    </div>
                  </div>
                  <Badge variant={p.isActive ? "success" : "default"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Erasure requests</h3>
          {erasures.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {erasures.error.message}
            </p>
          ) : erasures.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No erasure requests" description="The erasure-requests endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {erasures.data.map((r) => (
                <li key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.subjectEmail ?? "—"}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {r.subjectName ?? ""} {(r.entityTypes ?? []).join(", ")}
                    </div>
                  </div>
                  <Badge variant={r.status === "COMPLETED" ? "success" : r.status === "PENDING" ? "warning" : "default"}>
                    {r.status ?? "PENDING"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}