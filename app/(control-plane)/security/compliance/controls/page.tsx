"use client";
/**
 * Security & Compliance → Controls.
 *
 * The M38 control catalogue: every control mapped to its frameworks,
 * its LATEST monitoring status, and the ability to run monitoring or
 * export evidence artefacts generated from the real audit spine. A
 * control failing here is failing in the console before it is
 * failing in an audit.
 */
import { useMemo, useState } from "react";
import { Activity, ClipboardCheck, Download, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface ComplianceControl {
  code: string;
  frameworks?: string;
  title?: string;
  description?: string;
  status?: "PASS" | "FAIL" | null;
  observed?: number;
  finding?: string | null;
  evaluatedAt?: string | null;
}

interface ExportedEvidence {
  id?: string;
  controlCode?: string;
  auditorQuestion?: string;
  generatedAt?: string;
  generatedBy?: string;
  recordCount?: number;
}

function statusVariant(status: ComplianceControl["status"]) {
  if (status === "PASS") return "success";
  if (status === "FAIL") return "danger";
  return "default";
}

function statusLabel(status: ComplianceControl["status"]) {
  if (status === "PASS") return "PASS";
  if (status === "FAIL") return "FAIL";
  return "NOT RUN";
}

export default function SecurityComplianceControls() {
  const controls = useList<ComplianceControl>({
    path: "/platform/v1/compliance-controls",
  });
  const [monitoring, setMonitoring] = useState(false);
  const [monitorMessage, setMonitorMessage] = useState<string | null>(null);
  const [evidenceFor, setEvidenceFor] = useState<ComplianceControl | null>(null);
  const [question, setQuestion] = useState("");
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportedEvidence | null>(null);

  const passing = controls.data.filter((c) => c.status === "PASS").length;
  const failing = controls.data.filter((c) => c.status === "FAIL").length;
  const notRun = controls.data.filter((c) => c.status !== "PASS" && c.status !== "FAIL").length;

  const stats: StatCardItem[] = [
    { label: "Controls", value: controls.data.length, icon: <ClipboardCheck size={18} /> },
    { label: "Passing", value: passing, icon: <ShieldCheck size={18} /> },
    { label: "Failing", value: failing, icon: <ShieldAlert size={18} /> },
    { label: "Not run", value: notRun, icon: <Activity size={18} /> },
  ];

  async function runMonitoring() {
    setMonitoring(true);
    setMonitorMessage(null);
    try {
      await api.post("/platform/v1/compliance-controls/monitor");
      controls.reload();
      setMonitorMessage("Monitoring pass complete. Status reflects the real audit spine.");
    } catch (e) {
      setMonitorMessage((e as Error).message);
    } finally {
      setMonitoring(false);
    }
  }

  async function exportEvidence() {
    if (!evidenceFor) return;
    setExporting(true);
    setExportResult(null);
    try {
      const resp = await api.post<ExportedEvidence>(`/platform/v1/compliance-controls/${evidenceFor.code}/evidence`, {
        auditorQuestion: question,
      });
      setExportResult(resp.data);
    } catch (e) {
      setExportResult({ auditorQuestion: (e as Error).message });
    } finally {
      setExporting(false);
    }
  }

  const failingControls = useMemo(() => controls.data.filter((c) => c.status === "FAIL"), [controls.data]);

  if (controls.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Compliance controls"
      description="Continuous control monitoring over the M14 audit spine, with evidence exported from real audit records."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={runMonitoring} disabled={monitoring}>
            <RefreshCw size={16} /> {monitoring ? "Running…" : "Run monitoring"}
          </Button>
        </div>
        {monitorMessage && (
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>{monitorMessage}</p>
        )}

        <StatCardRow stats={stats} columns={4} />

        {failing > 0 && (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-danger)" }}>
              <ShieldAlert size={16} /> {failing} failing control{failing > 1 ? "s" : ""} — failing here before an audit
            </h3>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {failingControls.map((c) => (
                <li key={c.code} style={{ fontSize: "var(--text-sm)" }}>
                  <strong>{c.code}</strong> — {c.finding ?? c.title}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            <ClipboardCheck size={16} /> Control catalogue
          </h3>
          {controls.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {controls.error.message}
            </p>
          ) : controls.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No controls" description="The compliance endpoint returned no controls." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {controls.data.map((c) => (
                <li key={c.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-3) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      <span style={{ fontWeight: 600 }}>{c.code}</span>
                      <Badge variant={statusVariant(c.status)}>{statusLabel(c.status)}</Badge>
                    </div>
                    <div style={{ fontWeight: 500, marginTop: "var(--space-1)" }}>{c.title}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{c.description}</div>
                    {c.finding && (
                      <div style={{ fontSize: "var(--text-sm)", color: "var(--color-danger)", marginTop: "var(--space-1)" }}>{c.finding}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {c.frameworks}
                    </span>
                    <Button size="sm" onClick={() => { setEvidenceFor(c); setQuestion(""); setExportResult(null); }}>
                      <Download size={14} /> Export evidence
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {evidenceFor && (
        <Modal open onClose={() => setEvidenceFor(null)} title={`Export evidence — ${evidenceFor.code}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", margin: 0 }}>
              The artefact is generated from the real audit spine records matching this control — no manual assembly step.
            </p>
            <label style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
              Auditor&apos;s question
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. Show every provider operation recorded last quarter"
                style={{ padding: "var(--space-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              />
            </label>
            <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "flex-end" }}>
              <Button variant="ghost" onClick={() => setEvidenceFor(null)}>Cancel</Button>
              <Button onClick={exportEvidence} disabled={exporting || !question.trim()}>
                {exporting ? "Generating…" : "Export"}
              </Button>
            </div>
            {exportResult && (
              <Card padding="sm">
                <div style={{ fontSize: "var(--text-sm)" }}>
                  {exportResult.id ? (
                    <>
                      <div><strong>Artefact generated:</strong> {exportResult.auditorQuestion}</div>
                      <div style={{ color: "var(--color-text-secondary)" }}>
                        {exportResult.recordCount} record(s) from the audit spine · by {exportResult.generatedBy} · {exportResult.generatedAt}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "var(--color-danger)" }}>{exportResult.auditorQuestion}</div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </Modal>
      )}
    </DomainShell>
  );
}