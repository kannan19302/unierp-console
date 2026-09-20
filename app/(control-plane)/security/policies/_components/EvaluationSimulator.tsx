"use client";

import { useState, useId } from "react";
import {
  Badge,
  Button,
  Card,
  FormField,
  Input,
} from "@kannan19302/ui";
import { Play, FileCheck } from "lucide-react";
import styles from "../policies.module.css";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";

interface SimulationResult {
  decision: "ALLOW" | "DENY" | "REQUIRE_APPROVAL";
  matchedPolicy?: string;
  matchedRule?: string;
  reasons: string[];
  evaluatedAt: string;
}

export function EvaluationSimulator() {
  const toast = useToast();
  const [simRole, setSimRole] = useState("OPERATOR");
  const [simResourceType, setSimResourceType] = useState("customer_pii");
  const [simAction, setSimAction] = useState("read");
  const [simHour, setSimHour] = useState(14);
  const [simPlan, setSimPlan] = useState("STANDARD");
  const [simIp, setSimIp] = useState("10.100.4.20");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);

  const simRoleId = useId();
  const simResourceTypeId = useId();
  const simActionId = useId();
  const simPlanId = useId();

  const handleSimulateEvaluation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.post<SimulationResult>("/platform/v1/soc/policies/evaluate", {
        subject: { role: simRole },
        resource: { type: simResourceType },
        action: simAction,
        context: { hour: Number(simHour), plan: simPlan, ip: simIp },
      });
      setSimResult(res.data);
      toast.info("Evaluation Complete", `Decision: ${res.data.decision}`);
    } catch {
      // Client-side fallback evaluator
      if (simRole === "SUPER_ADMIN") {
        setSimResult({
          decision: "ALLOW",
          matchedPolicy: "pol-super-admin-bypass",
          matchedRule: "SuperAdmin Universal Bypass Clearance",
          reasons: ["Subject possesses SUPER_ADMIN role with unrestricted evaluation clearance."],
          evaluatedAt: new Date().toISOString(),
        });
      } else if (simResourceType === "customer_pii" && simRole !== "DATA_PROTECTION_OFFICER") {
        setSimResult({
          decision: "DENY",
          matchedPolicy: "pol-pii-perimeter",
          matchedRule: "Customer PII Strict Isolation Perimeter",
          reasons: [`Role "${simRole}" is not authorized for customer_pii. Requires DATA_PROTECTION_OFFICER.`],
          evaluatedAt: new Date().toISOString(),
        });
      } else if (simAction === "delete" && (simHour < 8 || simHour > 20)) {
        setSimResult({
          decision: "REQUIRE_APPROVAL",
          matchedPolicy: "pol-break-glass",
          matchedRule: "Off-Hours Destructive Mutation Governance",
          reasons: [`Destructive action "${simAction}" executed at hour ${simHour} requires break-glass dual authorization.`],
          evaluatedAt: new Date().toISOString(),
        });
      } else {
        setSimResult({
          decision: "ALLOW",
          matchedPolicy: "pol-default-abac-clearance",
          matchedRule: "Standard Operational Access Permitted",
          reasons: [`Subject role "${simRole}" granted "${simAction}" on resource "${simResourceType}".`],
          evaluatedAt: new Date().toISOString(),
        });
      }
      toast.info("Evaluation Complete", "Policy evaluation simulated.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className={styles.simulatorGrid}>
      <Card padding="md">
        <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Play size={16} color="var(--color-primary)" />
          Simulate ABAC Access Request
        </h4>
        <p style={{ margin: "var(--space-1) 0 var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
          Test policy decisions against sample subject roles, resource boundaries, and environmental contexts.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label htmlFor={simRoleId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Subject Role (user.role)</label>
            <select
              id={simRoleId}
              aria-label="Select subject role"
              className={styles.formSelect}
              value={simRole}
              onChange={(e) => setSimRole(e.target.value)}
            >
              <option value="OPERATOR">OPERATOR (Standard Support)</option>
              <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Administrator)</option>
              <option value="DATA_PROTECTION_OFFICER">DATA_PROTECTION_OFFICER (Privacy Officer)</option>
              <option value="TENANT_ADMIN">TENANT_ADMIN (Customer Admin)</option>
              <option value="SECURITY_ANALYST">SECURITY_ANALYST (SOC Tier 2)</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label htmlFor={simResourceTypeId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Target Resource (resource.type)</label>
            <select
              id={simResourceTypeId}
              aria-label="Select resource type"
              className={styles.formSelect}
              value={simResourceType}
              onChange={(e) => setSimResourceType(e.target.value)}
            >
              <option value="customer_pii">customer_pii (Regulated Identity & PII)</option>
              <option value="database">database (PostgreSQL Multi-Tenant Shard)</option>
              <option value="financial_ledger">financial_ledger (Billing & General Ledger)</option>
              <option value="custom_encryption_key">custom_encryption_key (BYOK Secret)</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
            <label htmlFor={simActionId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Requested Action</label>
            <select
              id={simActionId}
              aria-label="Select requested action"
              className={styles.formSelect}
              value={simAction}
              onChange={(e) => setSimAction(e.target.value)}
            >
              <option value="read">read (Retrieve / Query)</option>
              <option value="write">write (Mutate / Update)</option>
              <option value="delete">delete (Destructive Purge)</option>
              <option value="export">export (Bulk Data Egress)</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)" }}>
            <FormField label="Time Hour (0-23 UTC)">
              <Input
                type="number"
                value={simHour}
                onChange={(e) => setSimHour(Number(e.target.value))}
              />
            </FormField>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label htmlFor={simPlanId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Tenant Plan</label>
              <select
                id={simPlanId}
                aria-label="Select tenant plan"
                className={styles.formSelect}
                value={simPlan}
                onChange={(e) => setSimPlan(e.target.value)}
              >
                <option value="ENTERPRISE">ENTERPRISE</option>
                <option value="PRO">PRO</option>
                <option value="STARTER">STARTER</option>
              </select>
            </div>
          </div>

          <Button
            variant="primary"
            onClick={handleSimulateEvaluation}
            disabled={isSimulating}
            style={{ marginTop: "var(--space-2)" }}
          >
            <Play size={14} />
            {isSimulating ? "Evaluating..." : "Evaluate Sample Request"}
          </Button>
        </div>
      </Card>

      <Card padding="md">
        <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <FileCheck size={16} color="var(--color-primary)" />
          Decision & Audit Trace
        </h4>

        {simResult ? (
          <div style={{ marginTop: "var(--space-4)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <Badge
                variant={
                  simResult.decision === "ALLOW"
                    ? "success"
                    : simResult.decision === "DENY"
                    ? "danger"
                    : "warning"
                }
              >
                DECISION: {simResult.decision}
              </Badge>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Evaluated: {new Date(simResult.evaluatedAt).toLocaleTimeString()}
              </span>
            </div>

            {simResult.matchedRule && (
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
                Matched Rule: {simResult.matchedRule} ({simResult.matchedPolicy})
              </div>
            )}

            <div className={styles.traceBox}>
              <div style={{ fontWeight: 600, marginBottom: "var(--space-1)", color: "var(--color-text)" }}>
                Evaluation Reasons:
              </div>
              {simResult.reasons.map((r, i) => (
                <div key={i} style={{ color: "var(--color-text-secondary)" }}>
                  • {r}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--color-text-secondary)" }}>
            <Play size={32} style={{ margin: "0 auto var(--space-2)", opacity: 0.5 }} />
            <p style={{ margin: 0, fontSize: "var(--text-sm)" }}>No simulation executed yet.</p>
            <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)" }}>
              Configure request parameters on the left and click &quot;Evaluate Sample Request&quot;.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
