"use client";
/**
 * Tenants → Data.
 * Tenant data imports from the imports endpoint. Pick a tenant to see its
 * import runs, record counts and failures.
 */
import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
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
import TenantSelector from "../_tenant-select";
import { statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface ImportRow {
  id?: string;
  type?: string;
  kind?: string;
  source?: string;
  file?: string;
  filename?: string;
  status?: string;
  recordsImported?: number;
  recordsProcessed?: number;
  totalRecords?: number;
  errors?: number;
  startedAt?: string;
  completedAt?: string;
}

export default function TenantsData() {
  const [tenantId, setTenantId] = useState("");
  const imports = useList<ImportRow>({
    path: `/platform/v1/imports/${tenantId}`,
    disabled: !tenantId,
  });

  const failed = imports.data.filter((i) => String(i.status ?? "").toUpperCase() === "FAILED").length;
  const totalRecords = imports.data.reduce((sum, i) => sum + Number(i.recordsImported ?? i.recordsProcessed ?? 0), 0);

  const stats: StatCardItem[] = [
    { label: "Imports", value: imports.data.length || "—", icon: <FileSpreadsheet size={18} /> },
    { label: "Records imported", value: totalRecords ? totalRecords.toLocaleString() : "—" },
    { label: "Failed", value: failed || "—" },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Data"
      description="Data imports and load jobs per tenant."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} permission="system.tenant.view" />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to read its data imports." />
        ) : imports.loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : imports.error ? (
          <p className={styles.error}>
            {imports.error.message}
          </p>
        ) : imports.data.length === 0 ? (
          <EmptyState title="No imports" description="The imports endpoint returned no rows for this tenant." />
        ) : (
          <Card padding="md">
            <StatCardRow stats={stats} columns={3} />
            <ul className={styles.list}>
              {imports.data.slice(0, 40).map((i) => (
                <li
                  key={i.id ?? `${i.type ?? "import"}-${i.startedAt ?? ""}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span className={styles.listItemName}>
                    <span style={{ fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.type ?? i.kind ?? "import"}
                    </span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {i.source ?? i.filename ?? i.file ?? ""}
                      {i.completedAt ? ` · done ${i.completedAt}` : i.startedAt ? ` · started ${i.startedAt}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {Number(i.recordsImported ?? i.recordsProcessed ?? 0).toLocaleString()}
                      {i.totalRecords != null ? ` / ${i.totalRecords.toLocaleString()}` : ""}
                    </span>
                    <Badge variant={statusVariant(i.status)}>{i.status ?? "UNKNOWN"}</Badge>
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