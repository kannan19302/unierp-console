"use client";
/**
 * Ops → Automation.
 *
 * Automation rules / workflows configured on the platform from the operations
 * API. Real reads with honest loading/error/empty states.
 */
import { Workflow, Zap, Boxes, CircleCheck } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface AutomationRule {
  id?: string;
  name?: string;
  description?: string;
  trigger?: string;
  action?: string;
  enabled?: boolean;
  status?: string;
}

function isEnabled(r: AutomationRule): boolean {
  if (r.enabled != null) return r.enabled;
  return (r.status ?? "").toUpperCase() === "ENABLED";
}

export default function OpsAutomation() {
  const rules = useList<AutomationRule>({ path: "/platform/v1/operations/automation" });

  const enabled = rules.data.filter(isEnabled);

  const stats: StatCardItem[] = [
    { label: "Automation rules", value: rules.data.length, icon: <Workflow size={18} /> },
    { label: "Enabled", value: enabled.length, icon: <CircleCheck size={18} /> },
  ];

  if (rules.loading) {
    return (
      <DomainShell domainId="ops" title="Automation">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="ops"
      title="Automation"
      description="Automation rules and workflows across the platform."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        {rules.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {rules.error.message}
          </p>
        ) : rules.data.length === 0 ? (
          <EmptyState title="No automation rules" description="The automation endpoint returned no rules." />
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <Workflow size={16} /> Automation rules
            </h3>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {rules.data.map((r) => (
                <li key={r.id ?? r.name ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", fontWeight: 500 }}>
                    <Boxes size={15} />
                    {r.name ?? r.id ?? "—"}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {[r.trigger, r.action].filter(Boolean).join(" → ") || "—"}
                    </span>
                    <Badge variant={isEnabled(r) ? "success" : "default"}>
                      {isEnabled(r) ? "ENABLED" : "DISABLED"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}