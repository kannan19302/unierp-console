"use client";
/**
 * Tenants → Directory.
 * Searchable cross-tenant directory. Full registry from the tenants endpoint;
 * typing a query switches to the cross-tenant search endpoint.
 */
import { useState } from "react";
import { Building2, Search, ShieldBan, MapPin } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { useRealtimeData } from "@/lib/use-realtime-data";
import DomainShell from "@/components/domain-shell";
import { statusVariant } from "../_badge";
import styles from "../tenants.module.css";

interface TenantRow {
  id: string;
  name?: string;
  region?: string;
  status?: string;
  plan?: string;
  createdAt?: string;
}

export default function TenantsDirectory() {
  const canView = usePermission("system.tenant.view");
  const [query, setQuery] = useState("");

  const search = query.trim();
  const directory = useList<TenantRow>({
    path: search
      ? "/platform/v1/super-admin/cross-tenant-search"
      : "/platform/v1/super-admin/tenants",
    params: search ? { q: search, justification: "Platform admin directory search" } : undefined,
    disabled: !canView,
  });

  // Listen to WebSocket events for real-time tenant status changes
  useRealtimeData(["tenant.update", "tenant.create", "tenant.delete"], directory.reload);

  const active = directory.data.filter((t) => t.status === "ACTIVE").length;
  const suspended = directory.data.filter((t) => t.status === "SUSPENDED").length;
  const regions = new Set(directory.data.map((t) => t.region ?? "")).size;

  const stats: StatCardItem[] = [
    { label: search ? "Results" : "Tenants", value: directory.total ?? directory.data.length, icon: <Building2 size={18} /> },
    { label: "Active", value: active, icon: <Building2 size={18} /> },
    { label: "Suspended", value: suspended, icon: <ShieldBan size={18} /> },
    { label: "Regions", value: regions || "—", icon: <MapPin size={18} /> },
  ];

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Directory"
      description="Search and browse every tenant on the platform."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          <label
            htmlFor="tenant-search"
            style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}
          >
            Search tenants
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", maxWidth: 520 }}>
            <Search size={16} style={{ color: "var(--color-text-tertiary)" }} />
            <input
              id="tenant-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name or tenant id…"
              style={{
                flex: 1,
                padding: "var(--space-2) var(--space-3)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-bg-elevated)",
                color: "var(--color-text)",
                fontSize: "var(--text-sm)",
              }}
            />
          </div>
        </div>

        <Card padding="md">
          <h3 className={styles.cardTitle}>
            {search ? "Search results" : "All tenants"}
          </h3>
          {directory.error ? (
            <p className={styles.error}>
              {directory.error.message}
            </p>
          ) : directory.loading ? (
            <div className={styles.loadingCenter}>
              <Spinner size="md" />
            </div>
          ) : directory.data.length === 0 ? (
            <EmptyState
              title={search ? "No matching tenants" : "No tenants"}
              description={
                search
                  ? "No tenant matched that query."
                  : "The tenants endpoint returned no rows."
              }
            />
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
              {directory.data.slice(0, 50).map((t) => (
                <li
                  key={t.id}
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
                    {t.name ?? t.id}
                  </span>
                  <span className={styles.listItemMeta}>
                    <span>{t.region ?? "—"}</span>
                    <span>{t.plan ?? "—"}</span>
                    <Badge variant={statusVariant(t.status)}>{t.status ?? "UNKNOWN"}</Badge>
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