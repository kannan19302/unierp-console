"use client";

import React, { useState } from "react";
import {
  Plus,
  Play,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../ai.module.css";
import type {
  GuardrailPolicy,
  GuardrailRuleType,
  GuardrailAction,
} from "@/lib/ai-schema";
import { api } from "@/lib/api";

interface GuardrailEditorProps {
  policies: GuardrailPolicy[];
  onTogglePolicy: (policyId: string) => Promise<void>;
  onCreatePolicy: (newPolicy: GuardrailPolicy) => void;
}

export function GuardrailEditor({
  policies,
  onTogglePolicy,
  onCreatePolicy,
}: GuardrailEditorProps) {
  const [isNewPolicyOpen, setIsNewPolicyOpen] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newRuleType, setNewRuleType] = useState<GuardrailRuleType>("KEYWORD");
  const [newAction, setNewAction] = useState<GuardrailAction>("BLOCK");
  const [newSeverity, setNewSeverity] = useState<"high" | "medium" | "low">("high");
  const [newPatterns, setNewPatterns] = useState("");

  // Live Guardrail Tester Playground state
  const [testPrompt, setTestPrompt] = useState("Summarize the quarterly revenue report for Acme Corp");
  const [testEvaluation, setTestEvaluation] = useState<{
    tested: boolean;
    passed: boolean;
    blockCount: number;
    warnCount: number;
    violations: Array<{ name: string; ruleType: string; action: string; matchedText?: string }>;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicyName.trim()) return;

    const patternList = newPatterns
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const newPol: GuardrailPolicy = {
      id: `pol-${Date.now()}`,
      name: newPolicyName.trim(),
      ruleType: newRuleType,
      rule: { patterns: patternList },
      action: newAction,
      severity: newSeverity,
      enabled: true,
      description: `User-defined ${newRuleType} content safety policy.`,
      createdAt: new Date().toISOString(),
    };

    onCreatePolicy(newPol);
    setNewPolicyName("");
    setNewPatterns("");
    setIsNewPolicyOpen(false);
  };

  const handleTestGuardrails = async () => {
    if (!testPrompt.trim()) return;

    try {
      const resp = await api.post<{
        success?: boolean;
        data?: {
          passed: boolean;
          blockCount: number;
          warnCount: number;
          violations: Array<{ name: string; ruleType: string; action: string; matchedText?: string }>;
        };
      }>("/platform/v1/ai/guardrails/test", { prompt: testPrompt });

      if (resp?.data?.data) {
        setTestEvaluation({
          tested: true,
          ...resp.data.data,
        });
        return;
      }
    } catch {
      // Local client-side evaluation fallback matching service logic
    }

    const violations: Array<{ name: string; ruleType: string; action: string; matchedText?: string }> = [];
    const lowered = testPrompt.toLowerCase();

    for (const policy of policies.filter((p) => p.enabled)) {
      const patterns = ((policy.rule as { patterns?: string[] })?.patterns ?? []);
      if (policy.ruleType === "KEYWORD") {
        for (const p of patterns) {
          if (lowered.includes(p.toLowerCase())) {
            violations.push({ name: policy.name, ruleType: policy.ruleType, action: policy.action, matchedText: p });
            break;
          }
        }
      } else if (policy.ruleType === "REGEX") {
        for (const p of patterns) {
          try {
            const regex = new RegExp(p, "i");
            const match = testPrompt.match(regex);
            if (match) {
              violations.push({ name: policy.name, ruleType: policy.ruleType, action: policy.action, matchedText: match[0] });
              break;
            }
          } catch {
            // ignore
          }
        }
      } else if (policy.ruleType === "PII") {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
        const match = testPrompt.match(emailRegex);
        if (match) {
          violations.push({ name: policy.name, ruleType: policy.ruleType, action: policy.action, matchedText: match[0] });
        }
      }
    }

    const hasBlock = violations.some((v) => v.action === "BLOCK");
    setTestEvaluation({
      tested: true,
      passed: !hasBlock,
      blockCount: violations.filter((v) => v.action === "BLOCK").length,
      warnCount: violations.filter((v) => v.action === "WARN").length,
      violations,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            AI Guardrail Rules & Content Safety (EC-21.2)
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Pre-execution prompt filters evaluated before inference. BLOCK triggers stop model invocation with 403 Forbidden.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsNewPolicyOpen(true)}>
          <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
          New Guardrail Policy
        </Button>
      </div>

      {/* Active Policies Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Policy Name</th>
              <th className={styles.th}>Rule Type</th>
              <th className={styles.th}>Action</th>
              <th className={styles.th}>Severity</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: "right" }}>Toggle</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((p) => (
              <tr key={p.id} className={styles.tr}>
                <td className={styles.td}>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {p.description}
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.monoBadge}>{p.ruleType}</span>
                </td>
                <td className={styles.td}>
                  <Badge variant={p.action === "BLOCK" ? "danger" : "warning"}>
                    {p.action}
                  </Badge>
                </td>
                <td className={styles.td}>
                  <span style={{ fontSize: "var(--text-xs)", textTransform: "capitalize" }}>
                    {p.severity}
                  </span>
                </td>
                <td className={styles.td}>
                  <Badge variant={p.enabled ? "success" : "default"}>
                    {p.enabled ? "Active" : "Disabled"}
                  </Badge>
                </td>
                <td className={styles.td} style={{ textAlign: "right" }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTogglePolicy(p.id)}
                  >
                    {p.enabled ? "Disable" : "Enable"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live Guardrail Evaluation Playground (EC-21.2) */}
      <div className={styles.testerPanel}>
        <div>
          <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Interactive Prompt Guardrail Tester (EC-21.2)
          </h4>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Test prompt strings against active guardrails to verify BLOCK/WARN trigger sensitivity before deployment.
          </p>
        </div>

        <div className={styles.testerGrid}>
          <div>
            <label className={styles.formLabel}>Sample Input Prompt:</label>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className={styles.testerInput}
              placeholder="Enter prompt text to simulate..."
            />
            <div style={{ marginTop: "var(--space-2)", display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" size="sm" onClick={handleTestGuardrails}>
                <Play size={14} style={{ marginRight: "var(--space-1)" }} />
                Test Guardrails
              </Button>
            </div>
          </div>

          <div>
            <label className={styles.formLabel}>Live Evaluation Result:</label>
            <div className={styles.testerResult} data-testid="guardrail-test-result">
              {!testEvaluation ? (
                <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                  Click &quot;Test Guardrails&quot; to simulate policy evaluation against the sample prompt.
                </span>
              ) : testEvaluation.passed ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-success)" }}>
                    <CheckCircle2 size={20} />
                    <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                      Passed Guardrail Safety Audit
                    </span>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    No BLOCK rules tripped. Safe to route to inference provider.
                  </span>
                  {testEvaluation.warnCount > 0 && (
                    <div style={{ marginTop: "var(--space-2)", padding: "var(--space-2)", background: "var(--color-warning-subtle)", borderRadius: "var(--radius-sm)" }}>
                      <span style={{ fontSize: "var(--text-xs)", color: "var(--color-warning)", fontWeight: 600 }}>
                        ⚠️ {testEvaluation.warnCount} WARN trigger(s) recorded for audit trail.
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-danger)" }}>
                    <XCircle size={20} />
                    <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                      PROMPT BLOCKED (HTTP 403 Forbidden)
                    </span>
                  </div>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {testEvaluation.blockCount} BLOCK policy rule(s) violated. Model call aborted.
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", marginTop: "var(--space-2)" }}>
                    {testEvaluation.violations.map((v, i) => (
                      <div key={i} style={{ fontSize: "var(--text-xs)", padding: "var(--space-1) var(--space-2)", background: "var(--color-danger-subtle)", borderRadius: "var(--radius-sm)" }}>
                        <strong style={{ color: "var(--color-danger)" }}>[{v.action}]</strong> {v.name} ({v.ruleType}) {v.matchedText ? `— matched: "${v.matchedText}"` : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: New Guardrail Policy (EC-21.2) */}
      {isNewPolicyOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                Create AI Guardrail Policy (EC-21.2)
              </h3>
              <Button variant="outline" size="sm" onClick={() => setIsNewPolicyOpen(false)}>
                Cancel
              </Button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Policy Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Disallow Unapproved Financial Advice"
                  value={newPolicyName}
                  onChange={(e) => setNewPolicyName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Rule Type *</label>
                  <select
                    value={newRuleType}
                    onChange={(e) => setNewRuleType(e.target.value as GuardrailRuleType)}
                    className={styles.formSelect}
                  >
                    <option value="KEYWORD">Keyword Match</option>
                    <option value="REGEX">Regular Expression</option>
                    <option value="PII">PII Redaction</option>
                    <option value="TOXICITY">Toxicity Threshold</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Action on Trigger *</label>
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value as GuardrailAction)}
                    className={styles.formSelect}
                  >
                    <option value="BLOCK">BLOCK (403 Forbidden)</option>
                    <option value="WARN">WARN (Audit Trail Shadow)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Patterns / Keywords (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. insider trading, override audit, stock prediction"
                  value={newPatterns}
                  onChange={(e) => setNewPatterns(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value as "high" | "medium" | "low")}
                  className={styles.formSelect}
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button variant="outline" type="button" onClick={() => setIsNewPolicyOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Guardrail Policy
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
