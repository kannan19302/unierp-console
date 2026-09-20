"use client";

/**
 * PCC-21: AI Platform Governance Console
 *
 * Enterprise-grade multi-model registry with operational toggles,
 * content guardrail policy editor with live testing playground,
 * and per-model / per-tenant cost and token budget telemetry.
 */

import { useState } from "react";
import {
  Boxes,
  ShieldAlert,
  ShieldCheck,
  PiggyBank,
  Activity,
} from "lucide-react";
import {
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import type {
  AiModel,
  GuardrailPolicy,
  AiTelemetry,
} from "@/lib/ai-schema";
import {
  INITIAL_MODELS,
  INITIAL_POLICIES,
  INITIAL_TELEMETRY,
} from "@/lib/fixtures/ai";
import {
  ModelRegistry,
  GuardrailEditor,
  CostTelemetry,
} from "./_components";
import styles from "./ai.module.css";

type TabKey = "models" | "guardrails" | "costs";

export default function AiGovernanceOverview() {
  const [activeTab, setActiveTab] = useState<TabKey>("models");

  // State: Model Registry (EC-21.1)
  const [models, setModels] = useState<AiModel[]>(INITIAL_MODELS);

  // State: Guardrail Policies (EC-21.2)
  const [policies, setPolicies] = useState<GuardrailPolicy[]>(INITIAL_POLICIES);

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

  const handleCreateModel = (newModel: AiModel) => {
    setModels((prev) => [newModel, ...prev]);
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

  const handleCreatePolicy = (newPolicy: GuardrailPolicy) => {
    setPolicies((prev) => [newPolicy, ...prev]);
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
          <ModelRegistry
            models={models}
            onToggleModel={handleToggleModel}
            onCreateModel={handleCreateModel}
          />
        )}

        {/* TAB 2: GUARDRAIL POLICIES & LIVE TESTER (EC-21.2) */}
        {activeTab === "guardrails" && (
          <GuardrailEditor
            policies={policies}
            onTogglePolicy={handleTogglePolicy}
            onCreatePolicy={handleCreatePolicy}
          />
        )}

        {/* TAB 3: COST & TOKEN BUDGET TELEMETRY (EC-21.3) */}
        {activeTab === "costs" && (
          <CostTelemetry telemetry={telemetry} />
        )}
      </div>
    </DomainShell>
  );
}