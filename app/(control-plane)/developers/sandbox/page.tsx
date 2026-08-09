"use client";
/**
 * Developers → Sandbox.
 * The sandboxed API surface developer apps can call before publishing —
 * endpoint availability plus builder run statistics.
 */
import { FlaskConical, Terminal, Server, TestTubes } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList, useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface SandboxEndpoint {
  id?: string;
  name?: string;
  title?: string;
  path?: string;
  method?: string;
  version?: string;
}

export default function DevelopersSandbox() {
  const sandbox = useList<SandboxEndpoint>({ path: "/api-platform" });
  const stats = useItem<Record<string, unknown>>("/builder/stats");

  const s = stats.data ?? {};
  const sandboxed = sandbox.data.filter((e) => {
    const id = String(e.id ?? e.name ?? "").toUpperCase();
    const path = String(e.path ?? "").toLowerCase();
    return path.includes("sandbox") || id === "SANDBOX";
  });

  const statsCards: StatCardItem[] = [
    { label: "Sandbox endpoints", value: sandboxed.length || sandbox.total || sandbox.data.length, icon: <FlaskConical size={18} /> },
    { label: "Runs", value: numValue(s.sandboxRuns, s.runs) ?? 0, icon: <Terminal size={18} /> },
    { label: "Environments", value: numValue(s.sandboxEnvs, s.environments) ?? 0, icon: <Server size={18} /> },
    { label: "Tool versions", value: numValue(s.sandboxTools, s.toolVersions) ?? 0, icon: <TestTubes size={18} /> },
  ];

  if (sandbox.loading || stats.loading) {
    return (
      <DomainShell domainId="developers" title="Sandbox" description="Sandboxed endpoints available to developer apps.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="Sandbox" description="Sandboxed endpoints available to developer apps.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={statsCards} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Sandbox endpoints</h3>
          {sandbox.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {sandbox.error.message}
            </p>
          ) : sandbox.data.length === 0 ? (
            <EmptyState title="No sandbox endpoints" description="The API platform returned no sandbox endpoints." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {sandbox.data.slice(0, 30).map((e) => (
                <li
                  key={e.id ?? `${e.method}-${e.path}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <Badge variant={methodVariant(e.method ?? "GET")}>{e.method ?? "GET"}</Badge>
                  <span style={{ fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.name ?? e.title ?? e.path ?? "—"}
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", flexShrink: 0 }}>
                    {e.version ? `v${e.version}` : e.path ?? ""}
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

function numValue(...values: unknown[]): number | undefined {
  return values.find((v) => typeof v === "number") as number | undefined;
}

function methodVariant(method: string): "default" | "primary" | "success" | "warning" | "danger" | "info" {
  switch (method.toUpperCase()) {
    case "GET":
      return "success";
    case "POST":
      return "primary";
    case "PUT":
    case "PATCH":
      return "warning";
    case "DELETE":
      return "danger";
    default:
      return "info";
  }
}