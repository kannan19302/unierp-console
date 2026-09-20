"use client";

import { useState, useId } from "react";
import {
  Badge,
  Button,
  FormField,
  Input,
  Modal,
} from "@kannan19302/ui";
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
} from "lucide-react";
import styles from "../policies.module.css";
import type { AbacPolicyRule, AbacCondition } from "@/lib/security-schema";

interface AbacRuleBuilderProps {
  abacRules: AbacPolicyRule[];
  canManage: boolean;
  onMovePriority: (index: number, direction: "up" | "down") => void;
  onAddRule: (rule: AbacPolicyRule) => void;
  abacModalOpen: boolean;
  setAbacModalOpen: (open: boolean) => void;
}

export function AbacRuleBuilder({
  abacRules,
  canManage,
  onMovePriority,
  onAddRule,
  abacModalOpen,
  setAbacModalOpen,
}: AbacRuleBuilderProps) {
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDesc, setNewRuleDesc] = useState("");
  const [newRuleEffect, setNewRuleEffect] = useState<"ALLOW" | "DENY" | "REQUIRE_APPROVAL">("DENY");
  const [newRulePriority, setNewRulePriority] = useState(15);
  const [newRuleConditions, setNewRuleConditions] = useState<AbacCondition[]>([
    { id: "c-init-1", attribute: "user.role", operator: "equals", value: "OPERATOR" },
  ]);

  const ruleEffectId = useId();

  const handleAddCondition = () => {
    setNewRuleConditions((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, attribute: "user.role", operator: "equals", value: "" },
    ]);
  };

  const handleRemoveCondition = (id: string) => {
    setNewRuleConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const handleUpdateCondition = (id: string, field: keyof AbacCondition, val: any) => {
    setNewRuleConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: val } : c))
    );
  };

  const handleSave = () => {
    if (!newRuleName.trim()) return;
    const createdRule: AbacPolicyRule = {
      id: `abac-rule-${Date.now()}`,
      name: newRuleName,
      description: newRuleDesc,
      effect: newRuleEffect,
      priority: Number(newRulePriority) || 50,
      conditions: newRuleConditions,
    };
    onAddRule(createdRule);
    setNewRuleName("");
    setNewRuleDesc("");
    setAbacModalOpen(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.tableToolbar}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Visual Attribute-Based Access Control Rules
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Evaluated sequentially by numerical priority. Rules combine subject, resource, action, and environment attributes.
          </p>
        </div>
        {canManage && (
          <Button variant="primary" size="sm" onClick={() => setAbacModalOpen(true)}>
            <Plus size={14} />
            Add ABAC Rule
          </Button>
        )}
      </div>

      <div className={styles.rulesGrid}>
        {abacRules.map((rule, idx) => (
          <div key={rule.id} className={styles.ruleCard}>
            <div className={styles.ruleHeader}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <span className={styles.priorityBadge}>PRIORITY #{rule.priority}</span>
                  <h4 className={styles.ruleTitle}>{rule.name}</h4>
                  <Badge
                    variant={
                      rule.effect === "ALLOW"
                        ? "success"
                        : rule.effect === "DENY"
                        ? "danger"
                        : "warning"
                    }
                  >
                    {rule.effect}
                  </Badge>
                </div>
                {rule.description && (
                  <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {rule.description}
                  </p>
                )}
              </div>

              <div style={{ display: "flex", gap: "var(--space-1)" }}>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={idx === 0}
                  onClick={() => onMovePriority(idx, "up")}
                  title="Increase Priority"
                >
                  <ArrowUp size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={idx === abacRules.length - 1}
                  onClick={() => onMovePriority(idx, "down")}
                  title="Decrease Priority"
                >
                  <ArrowDown size={14} />
                </Button>
              </div>
            </div>

            <div style={{ marginTop: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-secondary)", display: "block", marginBottom: "var(--space-1)" }}>
                Evaluation Conditions:
              </span>
              <div className={styles.conditionsList}>
                {rule.conditions.map((cond) => (
                  <div key={cond.id} className={styles.conditionChip}>
                    <span style={{ color: "var(--color-primary)" }}>{cond.attribute}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{cond.operator}</span>
                    <strong>&quot;{cond.value}&quot;</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT ABAC POLICY RULE MODAL */}
      <Modal
        open={abacModalOpen}
        onClose={() => setAbacModalOpen(false)}
        title="Create Visual ABAC Policy Rule (EC-8.1)"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <FormField label="Rule Name" required>
            <Input
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              placeholder="e.g. Finance Ledger Write Lockdown"
            />
          </FormField>

          <FormField label="Description">
            <Input
              value={newRuleDesc}
              onChange={(e) => setNewRuleDesc(e.target.value)}
              placeholder="Explains access constraint and governance..."
            />
          </FormField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
              <label htmlFor={ruleEffectId} style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Action / Decision</label>
              <select
                id={ruleEffectId}
                aria-label="Select policy action"
                className={styles.formSelect}
                value={newRuleEffect}
                onChange={(e) => setNewRuleEffect(e.target.value as any)}
              >
                <option value="ALLOW">ALLOW (Permit Request)</option>
                <option value="DENY">DENY (Strict Rejection)</option>
                <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Dual-Sign Step-Up)</option>
              </select>
            </div>

            <FormField label="Evaluation Priority (1=Highest)" required>
              <Input
                type="number"
                value={newRulePriority}
                onChange={(e) => setNewRulePriority(Number(e.target.value))}
              />
            </FormField>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>
                Condition Builder (Attributes & Operators):
              </span>
              <Button size="sm" variant="outline" onClick={handleAddCondition}>
                <Plus size={12} /> Add Condition
              </Button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              {newRuleConditions.map((cond) => (
                <div key={cond.id} className={styles.conditionRow}>
                  <select
                    aria-label="Select attribute"
                    className={styles.formSelect}
                    value={cond.attribute}
                    onChange={(e) => handleUpdateCondition(cond.id, "attribute", e.target.value)}
                  >
                    <option value="user.role">user.role</option>
                    <option value="resource.type">resource.type</option>
                    <option value="time.hour">time.hour</option>
                    <option value="tenant.plan">tenant.plan</option>
                    <option value="ip.cidr">ip.cidr</option>
                    <option value="user.department">user.department</option>
                  </select>

                  <select
                    aria-label="Select operator"
                    className={styles.formSelect}
                    value={cond.operator}
                    onChange={(e) => handleUpdateCondition(cond.id, "operator", e.target.value)}
                  >
                    <option value="equals">equals</option>
                    <option value="not_equals">not_equals</option>
                    <option value="contains">contains</option>
                    <option value="in_range">in_range</option>
                    <option value="regex">regex</option>
                    <option value="greater_than">greater_than</option>
                  </select>

                  <Input
                    aria-label="Condition value"
                    value={cond.value}
                    onChange={(e) => handleUpdateCondition(cond.id, "value", e.target.value)}
                    placeholder="Value (e.g. SUPER_ADMIN)"
                  />

                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={newRuleConditions.length <= 1}
                    onClick={() => handleRemoveCondition(cond.id)}
                    title="Remove Condition"
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setAbacModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save ABAC Policy Rule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
