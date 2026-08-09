"use client";
/**
 * Infrastructure → Database.
 * The database schema catalog read from the operations db-schema endpoint.
 * Real data only — every table row comes from the control-plane API.
 */
import { Database, Table2, Rows3, Boxes } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface SchemaTable {
  id?: string;
  name?: string;
  table?: string;
  schema?: string;
  engine?: string;
  type?: string;
  columns?: number;
  rows?: number;
  size?: string | number;
  owner?: string;
  status?: string;
}

export default function InfrastructureDatabase() {
  const schema = useList<SchemaTable>({ path: "/platform/v1/operations/db-schema" });

  const columnCount = schema.data.reduce((acc, t) => acc + Number(t.columns ?? 0), 0);
  const ownerCount = new Set(schema.data.map((t) => t.owner).filter(Boolean)).size;

  const stats: StatCardItem[] = [
    { label: "Tables", value: schema.data.length, icon: <Table2 size={18} /> },
    { label: "Columns", value: columnCount || "—", icon: <Rows3 size={18} /> },
    { label: "Schemas", value: new Set(schema.data.map((t) => t.schema ?? t.engine).filter(Boolean)).size || "—", icon: <Database size={18} /> },
    { label: "Owners", value: ownerCount || "—", icon: <Boxes size={18} /> },
  ];

  if (schema.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Database" description="Database schema catalog, tables, columns and owners.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Database" description="Database schema catalog, tables, columns and owners.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Schema catalog</h3>
          {schema.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {schema.error.message}
            </p>
          ) : schema.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No schema data" description="The db-schema endpoint returned no tables." />
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
              {schema.data.slice(0, 40).map((t) => (
                <li
                  key={t.id ?? t.table ?? t.name ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{t.table ?? t.name ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {t.schema ? ` · ${t.schema}` : ""}
                      {t.engine ? ` · ${t.engine}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {t.columns != null ? `${t.columns} cols` : ""}
                      {t.rows != null ? ` · ${t.rows} rows` : ""}
                      {t.size != null ? ` · ${t.size}` : ""}
                    </span>
                    <Badge
                      variant={
                        t.status === "HEALTHY" || t.status === "ACTIVE"
                          ? "success"
                          : t.status === "DEGRADED"
                            ? "warning"
                            : t.status === "FAILED" || t.status === "UNHEALTHY"
                              ? "danger"
                              : "default"
                      }
                    >
                      {t.status ?? "UNKNOWN"}
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