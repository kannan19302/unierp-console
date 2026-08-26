"use client";
/**
 * Security & Compliance → Compliance.
 *
 * Compliance posture from the enterprise-scale compliance endpoints: framework
 * coverage, isolation policies and enforcement state. Real reads only.
 */
import { useState } from "react";
import { BookCheck, Download, Lock, RefreshCw, Scale, ShieldCheck, Zap } from "lucide-react";
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
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
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
  const toast = useToast();
  const canManage = usePermission("system.compliance.manage");

  const frameworks = useList<ComplianceFramework>({
    path: "/platform/v1/enterprise-scale/compliance-frameworks",
  });
  const isolation = useList<IsolationPolicy>({
    path: "/platform/v1/enterprise-scale/isolation-policies",
  });

  const [runningMonitoring, setRunningMonitoring] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [controlCode, setControlCode] = useState("AC-1");
  const [auditorQuestion, setAuditorQuestion] = useState("Provide SOC2 Type II access review evidence.");
  const [exporting, setExporting] = useState(false);

  const handleRunMonitoring = async () => {
    setRunningMonitoring(true);
    try {
      await api.post("/platform/v1/compliance-controls/monitor");
      await frameworks.reload();
      toast.success("Continuous Monitoring Ran", "Evaluated all compliance controls against the audit spine.");
    } catch {
      toast.error("Monitoring Run Failed", "Could not trigger continuous compliance monitoring.");
    } finally {
      setRunningMonitoring(false);
    }
  };

  const handleExportEvidence = async () => {
    setExporting(true);
    try {
      await api.post(`/platform/v1/compliance-controls/${controlCode}/evidence`, {
        auditorQuestion,
      });
      toast.success("Evidence Exported", `Audit evidence generated for control ${controlCode}.`);
      setExportOpen(false);
    } catch {
      toast.error("Export Failed", "Could not generate audit evidence bundle.");
    } finally {
      setExporting(false);
    }
  };

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
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRunMonitoring}
            disabled={runningMonitoring || !canManage}
          >
            <Zap size={14} className={runningMonitoring ? "animate-spin" : ""} />
            {runningMonitoring ? "Evaluating..." : "Run Monitoring"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setExportOpen(true)}
            disabled={!canManage}
          >
            <Download size={14} />
            Export Evidence
          </Button>
        </div>
      }
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
                      {f.version ? (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginLeft: "var(--space-2)" }}>{f.version}</span>
                      ) : null}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      {f.controls != null ? (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {f.controlsPassed ?? 0}/{f.controls} passed
                        </span>
                      ) : null}
                      <Badge variant={statusVariant(f.status)}>
                        {f.coveragePct != null ? `${f.coveragePct}%` : f.status ?? "UNKNOWN"}
                      </Badge>
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
                  <li key={p.id ?? p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 500 }}>{p.name ?? p.id}</span>
                      {p.description ? (
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginLeft: "var(--space-2)" }}>{p.description}</span>
                      ) : null}
                    </span>
                    <Badge variant={p.isActive ? "success" : "default"}>
                      {p.isActive ? "ENFORCED" : "INACTIVE"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        title="Export Compliance Audit Evidence"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Extract cryptographic evidence from the real audit spine for auditor inquiries.
          </p>
          <FormField label="Control Code" required>
            <Input
              value={controlCode}
              onChange={(e) => setControlCode(e.target.value)}
              placeholder="e.g. AC-1, IA-2, SC-7"
            />
          </FormField>
          <FormField label="Auditor Question / Scope" required>
            <Input
              value={auditorQuestion}
              onChange={(e) => setAuditorQuestion(e.target.value)}
              placeholder="e.g. Provide evidence of multi-factor authentication enforcement"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setExportOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleExportEvidence}
              disabled={exporting || !controlCode.trim()}
            >
              {exporting ? "Exporting..." : "Generate Evidence"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}