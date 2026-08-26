"use client";
/**
 * Tenants → Directory.
 * Searchable cross-tenant directory. Full registry from the tenants endpoint;
 * typing a query switches to the cross-tenant search endpoint.
 */
import { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Download,
  Key,
  MapPin,
  Play,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FormField,
  Input,
  Modal,
  Spinner,
  StatCardRow,
  usePermission,
  useToast,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
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
  const toast = useToast();
  const canView = usePermission("system.tenant.view");
  const canSuspend = usePermission("system.tenant.suspend");
  const canUnsuspend = usePermission("system.tenant.unsuspend");
  const canExport = usePermission("system.tenant.export");
  const canImpersonate = usePermission("system.tenant.impersonate");

  const [query, setQuery] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<TenantRow | null>(null);
  const [unsuspendTarget, setUnsuspendTarget] = useState<TenantRow | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [acting, setActing] = useState(false);

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

  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setActing(true);
    try {
      await api.post(`/platform/v1/tenants/${suspendTarget.id}/suspend`, {
        reason: suspendReason || "Administrative suspension by operator",
      });
      await directory.reload();
      toast.success("Tenant Suspended", `Tenant "${suspendTarget.name || suspendTarget.id}" suspended.`);
      setSuspendTarget(null);
      setSuspendReason("");
    } catch (err: any) {
      toast.error("Suspension Failed", err.message || "Failed to suspend tenant.");
    } finally {
      setActing(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!unsuspendTarget) return;
    setActing(true);
    try {
      await api.post(`/platform/v1/tenants/${unsuspendTarget.id}/unsuspend`, {
        reason: "Administrative unsuspension by operator",
      });
      await directory.reload();
      toast.success("Tenant Unsuspended", `Tenant "${unsuspendTarget.name || unsuspendTarget.id}" reinstated.`);
      setUnsuspendTarget(null);
    } catch (err: any) {
      toast.error("Unsuspension Failed", err.message || "Failed to unsuspend tenant.");
    } finally {
      setActing(false);
    }
  };

  const handleExport = async (tenant: TenantRow) => {
    try {
      await api.post(`/platform/v1/tenants/${tenant.id}/export`, {
        includeAudit: true,
        includeCompliance: true,
      });
      toast.success("Export Scheduled", `Data export for "${tenant.name || tenant.id}" initiated.`);
    } catch (err: any) {
      toast.error("Export Failed", err.message || "Could not schedule export.");
    }
  };

  const handleImpersonate = async (tenant: TenantRow) => {
    try {
      const resp = await api.post<{ token?: string; redirectUrl?: string }>(
        `/platform/v1/super-admin/tenants/${tenant.id}/impersonate`
      );
      toast.success("Impersonation Session Granted", `Session token generated for ${tenant.name || tenant.id}`);
    } catch (err: any) {
      toast.error("Impersonation Denied", err.message || "Could not impersonate tenant admin.");
    }
  };

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
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => directory.reload()}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Link href="/tenants/provision" style={{ textDecoration: "none" }}>
            <Button variant="primary" size="sm">
              <Plus size={14} />
              Provision Tenant
            </Button>
          </Link>
        </div>
      }
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
                    padding: "var(--space-3) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
                    <span className={styles.listItemName}>
                      {t.name ?? t.id}
                    </span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                      ID: {t.id} · Region: {t.region ?? "us-east-1"} · Plan: {t.plan ?? "STANDARD"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={statusVariant(t.status)}>{t.status ?? "UNKNOWN"}</Badge>

                    {canImpersonate && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleImpersonate(t)}
                        title="Impersonate Tenant Admin"
                      >
                        <UserCheck size={12} />
                        Impersonate
                      </Button>
                    )}

                    {canExport && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(t)}
                        title="Export Tenant Data"
                      >
                        <Download size={12} />
                        Export
                      </Button>
                    )}

                    {t.status === "ACTIVE" && canSuspend && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSuspendTarget(t)}
                        style={{ color: "var(--color-danger)" }}
                      >
                        <ShieldAlert size={12} />
                        Suspend
                      </Button>
                    )}

                    {t.status === "SUSPENDED" && canUnsuspend && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setUnsuspendTarget(t)}
                        style={{ color: "var(--color-success)" }}
                      >
                        <ShieldCheck size={12} />
                        Unsuspend
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(suspendTarget)}
        onClose={() => {
          setSuspendTarget(null);
          setSuspendReason("");
        }}
        title={`Suspend Tenant: ${suspendTarget?.name || suspendTarget?.id}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-danger)" }}>
            Suspending this tenant will immediately revoke active user sessions and halt outbound workflows.
          </p>
          <FormField label="Reason for Suspension" required>
            <Input
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Non-payment of invoice or Terms of Service violation"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setSuspendTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleSuspend}
              disabled={acting || !suspendReason.trim()}
            >
              {acting ? "Suspending..." : "Confirm Suspension"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(unsuspendTarget)}
        onClose={() => setUnsuspendTarget(null)}
        onConfirm={handleUnsuspend}
        title={`Unsuspend Tenant: ${unsuspendTarget?.name || unsuspendTarget?.id}`}
        message="This will restore normal operational access for all tenant users and resume queued operations. Proceed?"
        confirmLabel={acting ? "Unsuspending..." : "Confirm Unsuspension"}
        variant="primary"
      />
    </DomainShell>
  );
}