"use client";
/**
 * Infrastructure → Resources.
 * Enterprise-scale encryption key rotation for infrastructure resources.
 * Real data from the key-rotations endpoint.
 */
import { KeyRound, RefreshCw, Clock3, TimerReset } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface KeyRotation {
  id?: string;
  name?: string;
  key?: string;
  alias?: string;
  scope?: string;
  algorithm?: string;
  lastRotatedAt?: string;
  lastRotation?: string;
  nextRotationAt?: string;
  nextRotation?: string;
  rotationInterval?: number;
  intervalDays?: number;
  status?: string;
}

export default function InfrastructureResources() {
  const rotations = useList<KeyRotation>({ path: "/platform/v1/enterprise-scale/key-rotations" });

  const now = Date.now();
  const dueSoon = rotations.data.filter((k) => {
    const next = k.nextRotationAt ?? k.nextRotation;
    if (!next) return false;
    const t = Date.parse(next);
    if (Number.isNaN(t)) return false;
    return t - now <= 7 * 24 * 60 * 60 * 1000;
  }).length;

  const stats: StatCardItem[] = [
    { label: "Key rotations", value: rotations.data.length, icon: <KeyRound size={18} /> },
    { label: "Active", value: rotations.data.filter((k) => k.status === "ACTIVE" || k.status === "ENABLED").length, icon: <RefreshCw size={18} /> },
    { label: "Due within 7d", value: dueSoon || "—", icon: <Clock3 size={18} /> },
    { label: "Algorithms", value: new Set(rotations.data.map((k) => k.algorithm).filter(Boolean)).size || "—", icon: <TimerReset size={18} /> },
  ];

  if (rotations.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Resources" description="Encryption key rotation for enterprise-scale infrastructure resources.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Resources" description="Encryption key rotation for enterprise-scale infrastructure resources.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Key rotation schedule</h3>
          {rotations.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {rotations.error.message}
            </p>
          ) : rotations.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No key rotations" description="The key-rotations endpoint returned no rows." />
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: "var(--space-3) 0 0",
                padding: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {rotations.data.slice(0, 30).map((k) => (
                <li
                  key={k.id ?? k.key ?? k.alias ?? k.name ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{k.name ?? k.alias ?? k.key ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {k.scope ? ` · ${k.scope}` : ""}
                      {k.algorithm ? ` · ${k.algorithm}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {k.lastRotatedAt ?? k.lastRotation ? `rotated ${k.lastRotatedAt ?? k.lastRotation}` : ""}
                      {k.nextRotationAt ?? k.nextRotation ? ` · next ${k.nextRotationAt ?? k.nextRotation}` : ""}
                      {k.rotationInterval ?? k.intervalDays ? ` · every ${k.rotationInterval ?? k.intervalDays}d` : ""}
                    </span>
                    <Badge
                      variant={
                        k.status === "ACTIVE" || k.status === "ENABLED"
                          ? "success"
                          : k.status === "PENDING" || k.status === "DUE"
                            ? "warning"
                            : k.status === "FAILED"
                              ? "danger"
                              : "default"
                      }
                    >
                      {k.status ?? "UNKNOWN"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}