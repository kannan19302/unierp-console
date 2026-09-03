"use client";
/**
 * Settings → Features.
 *
 * Platform feature flags — real reads from the flags-metering surface. Every
 * section renders honest loading/error/empty states.
 */
import { Flag, ToggleLeft, Users, TrendingUp } from "lucide-react";
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

interface FeatureFlagRule {
  id: string;
  flagKey: string;
  name?: string;
  description?: string;
  percentageRollout?: number;
  userSegments?: string[];
  active?: boolean;
  enabled?: boolean;
}

export default function FeaturesSettingsPage() {
  const flags = useList<FeatureFlagRule>({
    path: "/platform/v1/flags-metering/feature-flags/rules",
  });

  const activeCount = flags.data.filter((r) => r.active ?? r.enabled).length;
  const rolledOut = flags.data.filter((r) => (r.percentageRollout ?? 0) > 0).length;
  const segmented = flags.data.filter((r) => r.userSegments && r.userSegments.length > 0).length;

  const stats: StatCardItem[] = [
    { label: "Feature flag rules", value: flags.data.length, icon: <Flag size={18} /> },
    { label: "Active", value: activeCount, icon: <ToggleLeft size={18} /> },
    { label: "Segmented", value: segmented, icon: <Users size={18} /> },
    { label: "Rolling out", value: rolledOut, icon: <TrendingUp size={18} /> },
  ];

  if (flags.loading) {
    return (
      <DomainShell domainId="settings" title="Features">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="settings"
      title="Features"
      description="Platform feature flags and their rollout rules."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        {flags.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
            {flags.error.message}
          </p>
        ) : flags.data.length === 0 ? (
          <EmptyState title="No feature flags" description="The feature-flags endpoint returned no rules." />
        ) : (
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Feature flag rules</h3>
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {flags.data.map((f) => {
                const on = f.active ?? f.enabled;
                return (
                  <li key={f.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span style={{ fontWeight: 500 }}>{f.name ?? f.flagKey}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                      {f.percentageRollout != null && (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {f.percentageRollout}% rollout
                        </span>
                      )}
                      {f.userSegments && f.userSegments.length > 0 && (
                        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                          {f.userSegments.join(", ")}
                        </span>
                      )}
                      <Badge variant={on ? "success" : "default"}>{on ? "ACTIVE" : "OFF"}</Badge>
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}