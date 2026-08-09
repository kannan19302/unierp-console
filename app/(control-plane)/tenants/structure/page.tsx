"use client";
/**
 * Tenants → Structure.
 * Organisational hierarchy per tenant, read from the tenant detail
 * endpoint. Pick a tenant to review its structural entities.
 */
import { useState, type ReactNode } from "react";
import { Layers } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import TenantSelector from "../_tenant-select";
import { statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface StructureNode {
  id?: string;
  label?: string;
  name?: string;
  code?: string;
  kind?: string;
  type?: string;
  status?: string;
  children?: StructureNode[];
}

interface TenantDetail {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  region?: string;
  structure?: StructureNode[] | Record<string, unknown> | null;
}

export default function TenantsStructure() {
  const [tenantId, setTenantId] = useState("");
  const { data: detail, loading, error } = useItem<TenantDetail>(
    tenantId ? `/platform/v1/super-admin/tenants/${tenantId}` : null,
  );

  const nodes: StructureNode[] = Array.isArray(detail?.structure)
    ? (detail?.structure as StructureNode[])
    : [];

  const countNodes = (list: StructureNode[]): number =>
    list.reduce((sum, n) => sum + 1 + countNodes(n.children ?? []), 0);

  const depth = (list: StructureNode[], level = 1): number =>
    list.reduce((max, n) => Math.max(max, depth(n.children ?? [], level + 1)), level);

  const stats: StatCardItem[] = [
    { label: "Entities", value: countNodes(nodes) || "—", icon: <Layers size={18} /> },
    { label: "Depth", value: nodes.length ? depth(nodes) : "—" },
    { label: "Region", value: detail?.region ?? "—" },
  ];

  const flatten = (list: StructureNode[], level = 0): ReactNode =>
    list.map((n) => (
      <li key={n.id ?? n.code ?? `${n.name ?? "node"}-${level}`} style={{ listStyle: "none" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
            padding: "var(--space-2) 0",
            borderBottom: "1px solid var(--color-border)",
            paddingLeft: `calc(var(--space-4) * ${level})`,
          }}
        >
          <span className={styles.listItemName}>
            {n.label ?? n.name ?? n.code ?? n.kind ?? "—"}
          </span>
          <span className={styles.listItemMeta}>
            <span>{n.type ?? n.kind ?? ""}</span>
            {n.status ? <Badge variant={statusVariant(n.status)}>{n.status}</Badge> : null}
          </span>
        </div>
        {n.children && n.children.length > 0 ? (
          <ul style={{ margin: 0, padding: 0 }}>{flatten(n.children, level + 1)}</ul>
        ) : null}
      </li>
    ));

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Structure"
      description="Per-tenant organisational hierarchy."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} permission="system.tenant.update" />

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to inspect its structure." />
        ) : loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <p className={styles.error}>
            {error.message}
          </p>
        ) : nodes.length === 0 ? (
          <EmptyState title="No structure data" description="The tenant detail endpoint returned no hierarchy for this tenant." />
        ) : (
          <Card padding="md">
            <StatCardRow stats={stats} columns={3} />
            <ul style={{ margin: "var(--space-4) 0 0", padding: 0 }}>{flatten(nodes)}</ul>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}