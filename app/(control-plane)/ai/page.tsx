"use client";

/**
 * PCC-21: AI Platform Governance Console
 *
 * Enterprise-grade multi-model registry with operational toggles,
 * content guardrail policy editor with live testing playground,
 * and per-model / per-tenant cost and token budget telemetry.
 */

import React, { useState } from "react";
import {
  Boxes,
  ShieldAlert,
  ShieldCheck,
  PiggyBank,
  Cpu,
  Plus,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Activity,
  Layers,
  Code,
  Lock,
} from "lucide-react";
import {
  Badge,
  Button,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import styles from "./ai.module.css";
import type {
  AiModel,
  GuardrailPolicy,
  GuardrailRuleType,
  GuardrailAction,
  AiTelemetry,
} from "@/lib/ai-schema";

type TabKey = "models" | "guardrails" | "costs";

const INITIAL_MODELS: AiModel[] = [
  {
    id: "mod-gpt4o",
    providerId: "prov-openai",
    providerName: "OpenAI",
    modelId: "gpt-4o",
    version: "2024-08-06",
    capabilities: ["chat", "vision", "tools", "json"],
    contextWindow: 128000,
    costPer1kTokens: 0.005,
    status: "ACTIVE",
    createdAt: "2026-01-15T08:00:00Z",
  },
  {
    id: "mod-claude35",
    providerId: "prov-anthropic",
    providerName: "Anthropic",
    modelId: "claude-3-5-sonnet",
    version: "20241022",
    capabilities: ["chat", "code", "tools", "vision"],
    contextWindow: 200000,
    costPer1kTokens: 0.006,
    status: "ACTIVE",
    createdAt: "2026-01-20T10:30:00Z",
  },
  {
    id: "mod-gemini15",
    providerId: "prov-google",
    providerName: "Google Cloud",
    modelId: "gemini-1.5-pro",
    version: "002",
    capabilities: ["chat", "vision", "tools", "embeddings"],
    contextWindow: 1000000,
    costPer1kTokens: 0.0025,
    status: "ACTIVE",
    createdAt: "2026-02-01T12:00:00Z",
  },
  {
    id: "mod-llama33",
    providerId: "prov-groq",
    providerName: "Groq / vLLM",
    modelId: "llama-3.3-70b-versatile",
    version: "main",
    capabilities: ["chat", "code", "json"],
    contextWindow: 128000,
    costPer1kTokens: 0.0008,
    status: "DISABLED",
    createdAt: "2026-02-15T14:45:00Z",
  },
];

const INITIAL_POLICIES: GuardrailPolicy[] = [
  {
    id: "pol-block-exploits",
    name: "Block Financial & Security Exploits",
    ruleType: "KEYWORD",
    rule: { patterns: ["wire fraud", "bypass accounting audit", "shadow transaction", "jailbreak"] },
    action: "BLOCK",
    severity: "high",
    enabled: true,
    description: "Strictly prevents generation of malicious financial transaction bypass prompts.",
    createdAt: "2026-02-10T10:00:00Z",
  },
  {
    id: "pol-pii-redaction",
    name: "PII Detection & Redaction Alert",
    ruleType: "PII",
    rule: { patterns: ["email", "ssn", "credit_card"] },
    action: "WARN",
    severity: "medium",
    enabled: true,
    description: "Detects personally identifiable information in prompt text and records an audit warning.",
    createdAt: "2026-02-14T11:20:00Z",
  },
  {
    id: "pol-prompt-injection",
    name: "System Prompt Injection Defense",
    ruleType: "REGEX",
    rule: { patterns: ["ignore previous instructions", "system prompt reveal", "disregard all earlier"] },
    action: "BLOCK",
    severity: "high",
    enabled: true,
    description: "Blocks adversarial prompt injections attempting to extract control-plane system instructions.",
    createdAt: "2026-02-18T16:00:00Z",
  },
];

const INITIAL_TELEMETRY: AiTelemetry = {
  period: "LAST_30_DAYS",
  totalSpendUsd: 1482.45,
  totalQueries: 48920,
  totalTokens: 12450000,
  costByModel: [
    { modelId: "gpt-4o", provider: "OpenAI", spendUsd: 642.1, tokens: 4200000, queries: 14200 },
    { modelId: "claude-3-5-sonnet", provider: "Anthropic", spendUsd: 512.8, tokens: 3800000, queries: 12800 },
    { modelId: "gemini-1.5-pro", provider: "Google Cloud", spendUsd: 215.3, tokens: 2950000, queries: 15100 },
    { modelId: "llama-3.3-70b-versatile", provider: "Groq / vLLM", spendUsd: 112.25, tokens: 1500000, queries: 6820 },
  ],
  costByTenant: [
    { tenantId: "00000000-0000-0000-0000-000000000001", tenantName: "Acme Corp (Primary)", spendUsd: 890.15, queries: 28400 },
    { tenantId: "00000000-0000-0000-0000-000000000002", tenantName: "Globex Logistics", spendUsd: 385.4, queries: 12300 },
    { tenantId: "00000000-0000-0000-0000-000000000003", tenantName: "Initech Systems", spendUsd: 206.9, queries: 8220 },
  ],
  tokenRateBudget: {
    dailyCap: 1000000,
    consumedToday: 342100,
    pctUsed: 34.2,
  },
};

export default function AiGovernanceOverview() {
  const [activeTab, setActiveTab] = useState<TabKey>("models");

  // State: Model Registry (EC-21.1)
  const [models, setModels] = useState<AiModel[]>(INITIAL_MODELS);
  const [isNewModelOpen, setIsNewModelOpen] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [newProviderId, setNewProviderId] = useState("prov-openai");
  const [newContextWindow, setNewContextWindow] = useState(128000);
  const [newCapabilities, setNewCapabilities] = useState("chat, vision, tools");

  // State: Guardrail Policies (EC-21.2)
  const [policies, setPolicies] = useState<GuardrailPolicy[]>(INITIAL_POLICIES);
  const [isNewPolicyOpen, setIsNewPolicyOpen] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newRuleType, setNewRuleType] = useState<GuardrailRuleType>("KEYWORD");
  const [newAction, setNewAction] = useState<GuardrailAction>("BLOCK");
  const [newSeverity, setNewSeverity] = useState<"high" | "medium" | "low">("high");
  const [newPatterns, setNewPatterns] = useState("");

  // State: Live Guardrail Tester Playground (EC-21.2)
  const [testPrompt, setTestPrompt] = useState("Summarize the quarterly revenue report for Acme Corp");
  const [testEvaluation, setTestEvaluation] = useState<{
    tested: boolean;
    passed: boolean;
    blockCount: number;
    warnCount: number;
    violations: Array<{ name: string; ruleType: string; action: string; matchedText?: string }>;
  } | null>(null);

  // State: Cost & Telemetry (EC-21.3)
  const [telemetry] = useState<AiTelemetry>(INITIAL_TELEMETRY);

  // --- Handlers: Model Registry (EC-21.1) ---

  const handleToggleModel = async (modelId: string) => {
    try {
      await api.post(`/platform/v1/ai/models/${modelId}/toggle`, {});
    } catch {
      // optimistic fallback
    }
    setModels((prev) =>
      prev.map((m) =>
        m.id === modelId
          ? { ...m, status: m.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }
          : m
      )
    );
  };

  const handleCreateModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelId.trim()) return;

    const providerNameMap: Record<string, string> = {
      "prov-openai": "OpenAI",
      "prov-anthropic": "Anthropic",
      "prov-google": "Google Cloud",
      "prov-groq": "Groq / vLLM",
    };

    const newModel: AiModel = {
      id: `mod-${Date.now()}`,
      providerId: newProviderId,
      providerName: providerNameMap[newProviderId] || "Custom Provider",
      modelId: newModelId.trim(),
      capabilities: newCapabilities.split(",").map((c) => c.trim()).filter(Boolean),
      contextWindow: Number(newContextWindow) || 128000,
      costPer1kTokens: 0.003,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    setModels((prev) => [newModel, ...prev]);
    setNewModelId("");
    setIsNewModelOpen(false);
  };

  // --- Handlers: Guardrail Policies (EC-21.2) ---

  const handleTogglePolicy = async (policyId: string) => {
    const target = policies.find((p) => p.id === policyId);
    if (!target) return;
    try {
      await api.post(`/platform/v1/ai/guardrails/${policyId}`, {
        enabled: !target.enabled,
      });
    } catch {
      // optimistic fallback
    }
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleCreatePolicy = (e: React.FormEvent) => {
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

    setPolicies((prev) => [newPol, ...prev]);
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

  // Top stats summary
  const activeModelsCount = models.filter((m) => m.status === "ACTIVE").length;
  const enabledPoliciesCount = policies.filter((p) => p.enabled).length;

  const stats: StatCardItem[] = [
    { label: "Active AI Models", value: activeModelsCount, icon: <Boxes size={18} /> },
    { label: "Active Guardrail Policies", value: enabledPoliciesCount, icon: <ShieldAlert size={18} /> },
    { label: "30-Day AI Spend", value: `$${telemetry.totalSpendUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: <PiggyBank size={18} /> },
    { label: "Queries Processed", value: telemetry.totalQueries.toLocaleString(), icon: <Activity size={18} /> },
  ];

  return (
    <DomainShell
      domainId="ai"
      title="AI Platform Governance"
      description="PCC-21: Multi-model provider registry with enable/disable controls, content guardrail safety policies, and token rate spend telemetry."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        {/* Navigation Tabs */}
        <div className={styles.tabBar} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "models"}
            className={`${styles.tabButton} ${activeTab === "models" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("models")}
          >
            <Boxes size={16} />
            Multi-Model Registry ({models.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "guardrails"}
            className={`${styles.tabButton} ${activeTab === "guardrails" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("guardrails")}
          >
            <ShieldCheck size={16} />
            Guardrail Policies & Safety ({policies.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "costs"}
            className={`${styles.tabButton} ${activeTab === "costs" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("costs")}
          >
            <PiggyBank size={16} />
            Cost & Token Budget Telemetry
          </button>
        </div>

        {/* TAB 1: MULTI-MODEL REGISTRY (EC-21.1) */}
        {activeTab === "models" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  Approved Foundation & Open Weights Models (EC-21.1)
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Global provider catalog with dynamic model availability toggles, context limits, and capability tags.
                </p>
              </div>
              <Button variant="primary" onClick={() => setIsNewModelOpen(true)}>
                <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
                Register New Model
              </Button>
            </div>

            <div className={styles.grid}>
              {models.map((model) => (
                <div key={model.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>
                        {model.modelId}
                      </div>
                      <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        Provider: {model.providerName || model.providerId} • Version: {model.version || "latest"}
                      </div>
                    </div>
                    <Badge variant={model.status === "ACTIVE" ? "success" : "danger"}>
                      {model.status}
                    </Badge>
                  </div>

                  <div className={styles.badgeRow}>
                    {model.capabilities.map((cap) => (
                      <span key={cap} className={styles.monoBadge}>
                        {cap}
                      </span>
                    ))}
                  </div>

                  <div className={styles.metricGrid}>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Context Window</span>
                      <span className={styles.metricValue}>
                        {model.contextWindow ? `${(model.contextWindow / 1000).toFixed(0)}k tokens` : "—"}
                      </span>
                    </div>
                    <div className={styles.metricItem}>
                      <span className={styles.metricLabel}>Cost / 1k Tokens</span>
                      <span className={styles.metricValue}>
                        ${model.costPer1kTokens ? model.costPer1kTokens.toFixed(4) : "0.0030"}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "var(--space-2)", borderTop: "0.0625rem solid var(--color-border)" }}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      Routing State: {model.status === "ACTIVE" ? "Routable" : "Suspended"}
                    </span>
                    <Button
                      variant={model.status === "ACTIVE" ? "outline" : "primary"}
                      size="sm"
                      onClick={() => handleToggleModel(model.id)}
                    >
                      {model.status === "ACTIVE" ? (
                        <>
                          <ToggleRight size={14} style={{ marginRight: "var(--space-1)" }} />
                          Disable Model
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={14} style={{ marginRight: "var(--space-1)" }} />
                          Enable Model
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: GUARDRAIL POLICIES & LIVE TESTER (EC-21.2) */}
        {activeTab === "guardrails" && (
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
                          onClick={() => handleTogglePolicy(p.id)}
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
                        Click "Test Guardrails" to simulate policy evaluation against the sample prompt.
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
          </div>
        )}

        {/* TAB 3: COST & TOKEN BUDGET TELEMETRY (EC-21.3) */}
        {activeTab === "costs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div className={styles.actionHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                  Token Consumption & Cost Allocation (EC-21.3)
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  Aggregated multi-provider spend, rate limits, and per-model / per-tenant cost attribution.
                </p>
              </div>
            </div>

            {/* Daily Token Rate Budget Progress Card */}
            <div className={styles.budgetCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                    Daily Token Rate Budget Cap
                  </span>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {telemetry.tokenRateBudget.consumedToday.toLocaleString()} / {telemetry.tokenRateBudget.dailyCap.toLocaleString()} tokens consumed today
                  </div>
                </div>
                <Badge variant={telemetry.tokenRateBudget.pctUsed > 80 ? "danger" : "info"}>
                  {telemetry.tokenRateBudget.pctUsed}% Quota Used
                </Badge>
              </div>
              <div className={styles.budgetBar}>
                <div
                  className={styles.budgetFill}
                  style={{ width: `${Math.min(telemetry.tokenRateBudget.pctUsed, 100)}%` }}
                />
              </div>
            </div>

            {/* Cost By Model Grid */}
            <div>
              <h4 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Cost Allocation by Foundation Model
              </h4>
              <div className={styles.grid}>
                {telemetry.costByModel.map((item) => (
                  <div key={item.modelId} className={styles.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{item.modelId}</span>
                      <span className={styles.monoBadge}>{item.provider}</span>
                    </div>
                    <div style={{ fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--color-primary)" }}>
                      ${item.spendUsd.toFixed(2)}
                    </div>
                    <div className={styles.metricGrid}>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Tokens Billed</span>
                        <span className={styles.metricValue}>{(item.tokens / 1000000).toFixed(2)}M</span>
                      </div>
                      <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Queries</span>
                        <span className={styles.metricValue}>{item.queries.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost By Tenant Table */}
            <div>
              <h4 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Tenant Spend Attribution (30-Day Window)
              </h4>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Tenant Name</th>
                      <th className={styles.th}>Tenant UUID</th>
                      <th className={styles.th}>Queries</th>
                      <th className={styles.th} style={{ textAlign: "right" }}>Spend (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetry.costByTenant.map((tenant) => (
                      <tr key={tenant.tenantId} className={styles.tr}>
                        <td className={styles.td} style={{ fontWeight: 600 }}>
                          {tenant.tenantName}
                        </td>
                        <td className={styles.td}>
                          <span className={styles.monoBadge}>{tenant.tenantId}</span>
                        </td>
                        <td className={styles.td}>{tenant.queries.toLocaleString()}</td>
                        <td className={styles.td} style={{ textAlign: "right", fontWeight: 600, color: "var(--color-primary)" }}>
                          ${tenant.spendUsd.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Register New Model (EC-21.1) */}
      {isNewModelOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                Register Foundation Model (EC-21.1)
              </h3>
              <Button variant="outline" size="sm" onClick={() => setIsNewModelOpen(false)}>
                Cancel
              </Button>
            </div>

            <form onSubmit={handleCreateModel} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Model Identifier *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. gpt-4.5-preview, mistral-large-2411"
                  value={newModelId}
                  onChange={(e) => setNewModelId(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Inference Provider *</label>
                <select
                  value={newProviderId}
                  onChange={(e) => setNewProviderId(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="prov-openai">OpenAI Platform</option>
                  <option value="prov-anthropic">Anthropic Claude</option>
                  <option value="prov-google">Google Cloud Vertex</option>
                  <option value="prov-groq">Groq / Local vLLM</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Context Window (Tokens)</label>
                <input
                  type="number"
                  value={newContextWindow}
                  onChange={(e) => setNewContextWindow(Number(e.target.value))}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Capabilities (Comma-separated)</label>
                <input
                  type="text"
                  value={newCapabilities}
                  onChange={(e) => setNewCapabilities(e.target.value)}
                  placeholder="chat, vision, tools, code"
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                <Button variant="outline" type="button" onClick={() => setIsNewModelOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save & Register Model
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            <form onSubmit={handleCreatePolicy} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
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
    </DomainShell>
  );
}