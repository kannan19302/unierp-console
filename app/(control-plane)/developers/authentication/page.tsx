"use client";
/**
 * Developers → Authentication.
 * API-key and credential surface for the developer portal — issued keys,
 * scopes and rotation/expiry state, read from the SaaS API keys endpoint.
 */
import { KeyRound, ShieldCheck, Lock, RefreshCcw } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface ApiKeyRow {
  id?: string;
  name?: string;
  label?: string;
  key?: string;
  prefix?: string;
  scopes?: string[];
  createdAt?: string;
  lastUsedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  status?: string;
}

export default function DevelopersAuthentication() {
  const keys = useList<ApiKeyRow>({ path: "/saas/api-keys" });

  const active = keys.data.filter((k) => (k.status ?? "").toUpperCase() === "ACTIVE").length;
  const expiring = keys.data.filter((k) => !!k.expiresAt && !k.lastUsedAt && (k.status ?? "").toUpperCase() !== "REVOKED").length;
  const revoked = keys.data.filter((k) => (k.status ?? "").toUpperCase() === "REVOKED").length;

  const stats: StatCardItem[] = [
    { label: "API keys", value: keys.total ?? keys.data.length, icon: <KeyRound size={18} /> },
    { label: "Active", value: active, icon: <ShieldCheck size={18} /> },
    { label: "Revoked", value: revoked, icon: <Lock size={18} /> },
    { label: "Unused / expiring", value: expiring, icon: <RefreshCcw size={18} /> },
  ];

  if (keys.loading) {
    return (
      <DomainShell domainId="developers" title="Authentication" description="API credentials and key lifecycle.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="Authentication" description="API credentials and key lifecycle.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>API keys</h3>
          {keys.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {keys.error.message}
            </p>
          ) : keys.data.length === 0 ? (
            <EmptyState title="No API keys issued" description="The API keys endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {keys.data.slice(0, 40).map((k) => (
                <li
                  key={k.id ?? k.prefix ?? k.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{k.name ?? k.label ?? k.prefix ?? "—"}</span>
                    {k.scopes && k.scopes.length > 0 ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {k.scopes.join(", ")}
                      </span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {k.lastUsedAt ? `used ${k.lastUsedAt}` : k.expiresAt ? `expires ${k.expiresAt}` : ""}
                    </span>
                    <Badge variant={keyStatusVariant(k.status)}>{k.status ?? "ACTIVE"}</Badge>
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

function keyStatusVariant(status?: string): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
      return "success";
    case "REVOKED":
    case "EXPIRED":
    case "FAILED":
      return "danger";
    case "DISABLED":
      return "warning";
    default:
      return "default";
  }
}