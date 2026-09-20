"use client";

import React, { useState } from "react";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../ai.module.css";
import type { AiModel } from "@/lib/ai-schema";

interface ModelRegistryProps {
  models: AiModel[];
  onToggleModel: (modelId: string) => Promise<void>;
  onCreateModel: (newModel: AiModel) => void;
}

export function ModelRegistry({
  models,
  onToggleModel,
  onCreateModel,
}: ModelRegistryProps) {
  const [isNewModelOpen, setIsNewModelOpen] = useState(false);
  const [newModelId, setNewModelId] = useState("");
  const [newProviderId, setNewProviderId] = useState("prov-openai");
  const [newContextWindow, setNewContextWindow] = useState(128000);
  const [newCapabilities, setNewCapabilities] = useState("chat, vision, tools");

  const handleSubmit = (e: React.FormEvent) => {
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

    onCreateModel(newModel);
    setNewModelId("");
    setIsNewModelOpen(false);
  };

  return (
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
                onClick={() => onToggleModel(model.id)}
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

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
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
    </div>
  );
}
