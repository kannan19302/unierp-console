"use client";
/**
 * Developers → Documentation.
 * In-console developer documentation index for the API platform — endpoint
 * reference read from the live API catalog.
 */
import { BookOpen, FileText, ExternalLink, Braces } from "lucide-react";
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

interface DocEndpoint {
  id?: string;
  name?: string;
  title?: string;
  path?: string;
  method?: string;
  version?: string;
  description?: string;
  summary?: string;
}

export default function DevelopersDocumentation() {
  const catalog = useList<DocEndpoint>({ path: "/api-platform" });

  const sections = catalog.data.reduce((m: Record<string, number>, e) => {
    const path = e.path ?? "";
    const seg = path.split("/").filter(Boolean)[0] ?? "general";
    m[seg] = (m[seg] ?? 0) + 1;
    return m;
  }, {});

  const stats: StatCardItem[] = [
    { label: "Documented endpoints", value: catalog.total ?? catalog.data.length, icon: <Braces size={18} /> },
    { label: "Sections", value: Object.keys(sections).length, icon: <BookOpen size={18} /> },
  ];

  if (catalog.loading) {
    return (
      <DomainShell domainId="developers" title="Documentation" description="Developer documentation for the API platform.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="Documentation" description="Developer documentation for the API platform.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={2} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Documentation sections</h3>
          {catalog.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {catalog.error.message}
            </p>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {filterEntries(sections).map(([seg, count]) => (
                <li
                  key={seg}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <FileText size={16} style={{ color: "var(--color-text-secondary)" }} />
                    <span style={{ fontWeight: 500 }}>{seg}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {count} endpoint{count === 1 ? "" : "s"}
                    </span>
                    <span style={{ color: "var(--color-primary)", display: "flex", alignItems: "center" }}>
                      <ExternalLink size={14} />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Endpoint reference</h3>
          {catalog.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {catalog.error.message}
            </p>
          ) : catalog.data.length === 0 ? (
            <EmptyState title="No documented endpoints" description="The catalog returned no endpoints to document." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {catalog.data.slice(0, 40).map((e, i) => (
                <li
                  key={e.id ?? `${e.method}-${e.path}-${i}`}
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
                    <Badge variant={methodVariant(e.method ?? "GET")}>{e.method ?? "GET"}</Badge>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.name ?? e.title ?? e.path ?? "—"}
                    </span>
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", flexShrink: 0 }}>
                    {e.version ? `v${e.version}` : ""} {e.path ?? ""}
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

function filterEntries(record: Record<string, number>): [string, number][] {
  return Object.entries(record).filter(([, n]) => n > 0);
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