"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Plus,
  Trash2,
  Code,
  X,
} from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../integrations.module.css";
import type {
  DataMappingDefinition,
  FieldMappingRule,
  TransformFunction,
} from "@/lib/integration-schema";

interface DataMapperProps {
  mappings: DataMappingDefinition[];
  selectedMapping: DataMappingDefinition;
  onSelectMapping: (mapping: DataMappingDefinition) => void;
  onSaveMapping: (newMap: DataMappingDefinition) => void;
}

export function DataMapper({
  mappings,
  selectedMapping,
  onSelectMapping,
  onSaveMapping,
}: DataMapperProps) {
  const [isNewMappingOpen, setIsNewMappingOpen] = useState(false);
  const [newMapName, setNewMapName] = useState("");
  const [newConnectorId, setNewConnectorId] = useState("conn-sfdc");
  const [newSourceEntity, setNewSourceEntity] = useState("Account");
  const [newTargetEntity, setNewTargetEntity] = useState("Customer");
  const [editingRules, setEditingRules] = useState<FieldMappingRule[]>([
    { sourceField: "Name", targetField: "companyName", transform: "TRIM" },
    { sourceField: "Code", targetField: "customerCode", transform: "UPPERCASE" },
  ]);

  // Test Playground state (EC-20.1)
  const [testPayloadStr, setTestPayloadStr] = useState(
    JSON.stringify({ Name: "  Acme Global Corp  ", Code: "acme-100", AnnualRevenue: "$2,500,000.00" }, null, 2)
  );
  const [testOutputStr, setTestOutputStr] = useState<string>("");

  const handleAddRule = () => {
    setEditingRules((prev) => [...prev, { sourceField: "", targetField: "", transform: "NONE" }]);
  };

  const handleRemoveRule = (index: number) => {
    setEditingRules((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleRuleChange = (index: number, field: keyof FieldMappingRule, value: string) => {
    setEditingRules((prev) =>
      prev.map((rule, idx) => (idx === index ? { ...rule, [field]: value } : rule))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;

    const newMap: DataMappingDefinition = {
      id: `map-${Date.now()}`,
      name: newMapName.trim(),
      connectorId: newConnectorId,
      sourceEntity: newSourceEntity.trim(),
      targetEntity: newTargetEntity.trim(),
      fieldMappings: editingRules.filter((r) => r.sourceField && r.targetField),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveMapping(newMap);
    setIsNewMappingOpen(false);
    setNewMapName("");
  };

  const handleEvaluateTestMapping = () => {
    try {
      const parsed = JSON.parse(testPayloadStr);
      const rules = selectedMapping.fieldMappings;
      const result: Record<string, unknown> = {};

      for (const rule of rules) {
        const raw = parsed[rule.sourceField] ?? rule.defaultValue;
        if (raw === undefined || raw === null) {
          result[rule.targetField] = null;
          continue;
        }
        switch (rule.transform) {
          case "UPPERCASE":
            result[rule.targetField] = String(raw).toUpperCase();
            break;
          case "LOWERCASE":
            result[rule.targetField] = String(raw).toLowerCase();
            break;
          case "TRIM":
            result[rule.targetField] = String(raw).trim();
            break;
          case "PARSE_FLOAT":
            result[rule.targetField] = parseFloat(String(raw).replace(/[^0-9.-]+/g, "")) || 0;
            break;
          case "FORMAT_DATE":
            result[rule.targetField] = new Date(String(raw)).toISOString().split("T")[0];
            break;
          default:
            result[rule.targetField] = raw;
            break;
        }
      }

      setTestOutputStr(JSON.stringify(result, null, 2));
    } catch (err: unknown) {
      setTestOutputStr(`Error parsing input JSON: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Select Entity Mapping:</span>
          <select
            value={selectedMapping.id}
            onChange={(e) => {
              const m = mappings.find((item) => item.id === e.target.value);
              if (m) onSelectMapping(m);
            }}
            className={styles.formSelect}
            style={{ width: "auto" }}
          >
            {mappings.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.sourceEntity} → {m.targetEntity})
              </option>
            ))}
          </select>
        </div>

        <Button variant="primary" onClick={() => setIsNewMappingOpen(true)}>
          <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
          New Entity Mapping
        </Button>
      </div>

      <div className={styles.mappingDesignerBox}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "0.0625rem solid var(--color-border)", paddingBottom: "var(--space-3)" }}>
          <div>
            <h4 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>{selectedMapping.name}</h4>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
              Bridge: {selectedMapping.connectorId} • {selectedMapping.fieldMappings.length} Field Rules
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Badge variant="info">Source: {selectedMapping.sourceEntity}</Badge>
            <ArrowRight size={14} />
            <Badge variant="primary">Target: {selectedMapping.targetEntity}</Badge>
          </div>
        </div>

        {/* Rules List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {selectedMapping.fieldMappings.map((rule, idx) => (
            <div key={idx} className={styles.fieldRuleRow}>
              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{rule.sourceField}</span>
              <ArrowRight size={14} color="var(--color-text-secondary)" />
              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--color-primary)" }}>
                {rule.targetField}
              </span>
              <span className={styles.monoBadge}>
                Transform: {rule.transform}
              </span>
              {rule.defaultValue && (
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  (default: {rule.defaultValue})
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Test Playground (EC-20.1) */}
        <div style={{ borderTop: "0.0625rem solid var(--color-border)", paddingTop: "var(--space-4)", marginTop: "var(--space-2)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h5 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>
                Interactive Mapping Test Playground (EC-20.1)
              </h5>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Test live transformation functions against a sample JSON payload before promoting to production.
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={handleEvaluateTestMapping}>
              <Code size={14} style={{ marginRight: "var(--space-1)" }} />
              Evaluate Transformation
            </Button>
          </div>

          <div className={styles.testPlayground}>
            <div>
              <label className={styles.formLabel}>Sample Source Payload (JSON):</label>
              <textarea
                value={testPayloadStr}
                onChange={(e) => setTestPayloadStr(e.target.value)}
                className={styles.jsonEditor}
              />
            </div>
            <div>
              <label className={styles.formLabel}>Transformed Target Output (JSON):</label>
              <pre data-testid="mapping-test-output" className={styles.jsonOutput}>
                {testOutputStr || "// Click Evaluate Transformation to run rules..."}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: NEW DATA MAPPING (EC-20.1) */}
      {isNewMappingOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                Create Visual Entity Data Mapping (EC-20.1)
              </h3>
              <button
                onClick={() => setIsNewMappingOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Mapping Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SFDC Lead → UniERP Opportunity"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Connector Bridge *</label>
                  <select
                    value={newConnectorId}
                    onChange={(e) => setNewConnectorId(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="conn-sfdc">Salesforce CRM</option>
                    <option value="conn-shopify">Shopify Plus</option>
                    <option value="conn-netsuite">Oracle NetSuite</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Source Entity *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead"
                    value={newSourceEntity}
                    onChange={(e) => setNewSourceEntity(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Entity *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Opportunity"
                    value={newTargetEntity}
                    onChange={(e) => setNewTargetEntity(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* Dynamic Rule Builder */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                  <label className={styles.formLabel}>Field Mapping Rules & Transforms:</label>
                  <Button variant="outline" size="sm" type="button" onClick={handleAddRule}>
                    <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
                    Add Field Rule
                  </Button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {editingRules.map((rule, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr 1.2fr auto", alignItems: "center", gap: "var(--space-2)" }}>
                      <input
                        type="text"
                        placeholder="Source Field (e.g. First_Name)"
                        value={rule.sourceField}
                        onChange={(e) => handleRuleChange(idx, "sourceField", e.target.value)}
                        className={styles.formInput}
                      />
                      <ArrowRight size={14} color="var(--color-text-secondary)" />
                      <input
                        type="text"
                        placeholder="Target Field (e.g. firstName)"
                        value={rule.targetField}
                        onChange={(e) => handleRuleChange(idx, "targetField", e.target.value)}
                        className={styles.formInput}
                      />
                      <select
                        value={rule.transform}
                        onChange={(e) => handleRuleChange(idx, "transform", e.target.value as TransformFunction)}
                        className={styles.formSelect}
                      >
                        <option value="NONE">No Transform</option>
                        <option value="UPPERCASE">UPPERCASE</option>
                        <option value="LOWERCASE">LOWERCASE</option>
                        <option value="TRIM">TRIM</option>
                        <option value="PARSE_FLOAT">PARSE_FLOAT</option>
                        <option value="FORMAT_DATE">FORMAT_DATE</option>
                      </select>
                      <Button
                        variant="danger"
                        size="sm"
                        type="button"
                        disabled={editingRules.length <= 1}
                        onClick={() => handleRemoveRule(idx)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <Button variant="outline" type="button" onClick={() => setIsNewMappingOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Entity Mapping
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
