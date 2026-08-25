"use client";
/**
 * Tenants → Configuration.
 * Per-tenant configuration map from the tenant detail endpoint. Pick a
 * tenant to read its settings and registration attributes.
 */
import { useState } from "react";
import { Settings2 } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import TenantSelector from "../_tenant-select";
import { statusVariant } from "../_badge";
import { BreakGlassAction } from "@/components/break-glass-action";
import { useMutation } from "@/lib/data";
import styles from "../tenants.module.css";

interface TenantDetail {
  id?: string;
  name?: string;
  plan?: string;
  status?: string;
  region?: string;
  subdomain?: string;
  locale?: string;
  timezone?: string;
  configuration?: Record<string, unknown> | null;
}

interface LifecycleEvent {
  id?: string;
  eventType?: string;
  status?: string;
  createdAt?: string;
  completedAt?: string;
  payload?: { offboardDate?: string; retentionDays?: number } | null;
}

interface TenantLifecycle {
  currentStatus?: string;
  recentEvents?: LifecycleEvent[];
  stats?: { users?: number; organizations?: number };
  purgeReadiness?: {
    eligible: boolean;
    purgeEligibleAt: string | null;
    activeLegalHolds: number | null;
    blockers: Array<{ code: string; message: string }>;
  };
}

type LifecycleAction = "suspend" | "unsuspend" | "offboard" | "cancel-offboarding" | "purge";

export default function TenantsConfiguration() {
  const [tenantId, setTenantId] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const canSuspend = usePermission("system.tenant.suspend");
  const canUnsuspend = usePermission("system.tenant.unsuspend");
  const canOffboard = usePermission("system.tenant.offboard");
  const canPurge = usePermission("system.tenant.purge");
  const { data: detail, loading, error, reload: reloadDetail } = useItem<TenantDetail>(
    tenantId ? `/platform/v1/super-admin/tenants/${tenantId}` : null,
  );
  const { data: lifecycle, reload: reloadLifecycle } = useItem<TenantLifecycle>(
    tenantId ? `/platform/v1/tenants/${tenantId}/lifecycle` : null,
  );

  const config: Record<string, unknown> = (detail?.configuration ?? {}) as Record<string, unknown>;
  const entries = Object.entries(config);

  const stats: StatCardItem[] = [
    { label: "Settings", value: entries.length || "—", icon: <Settings2 size={18} /> },
    { label: "Region", value: detail?.region ?? "—" },
    { label: "Plan", value: detail?.plan ?? "—" },
  ];

  const lifecycleMutation = useMutation(async ({
    action,
    justification,
  }: {
    action: LifecycleAction;
    justification: string;
  }) => {
    const isPurge = action === "purge";
    const body = action === "offboard"
      ? { retentionDays: 90, reason: justification }
      : { reason: justification };
    const response = await api.post<{ message?: string; recordsDeleted?: number }>(
      `/platform/v1/tenants/${tenantId}/${action}`,
      body,
      isPurge
        ? {
            headers: {
              "x-confirm-purge": "true",
              "x-break-glass-reason": justification,
              "x-correlation-id": globalThis.crypto?.randomUUID?.() ?? `pcc-${Date.now()}`,
            },
          }
        : undefined,
    );
    setActionMessage(response.data.message ?? `Tenant ${action} completed.`);
    if (isPurge) {
      setTenantId("");
      return;
    }
    reloadDetail();
    reloadLifecycle();
  });

  const valueText = (v: unknown): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };
  const currentStatus = lifecycle?.currentStatus ?? detail?.status ?? "UNKNOWN";
  const purgeReadiness = lifecycle?.purgeReadiness;

  return (
    <DomainShell
      domainId="tenants"
      title="Tenants · Configuration"
      description="Per-tenant settings and attributes."
    >
      <div className={styles.container}>
        <TenantSelector value={tenantId} onChange={setTenantId} />

        {actionMessage ? (
          <Card padding="sm">
            <p style={{ margin: 0, color: "var(--color-success)", fontSize: "var(--text-sm)" }}>{actionMessage}</p>
          </Card>
        ) : null}

        {!tenantId ? (
          <EmptyState title="Select a tenant" description="Pick a tenant above to read its configuration." />
        ) : loading ? (
          <div className={styles.loadingCenter}>
            <Spinner size="md" />
          </div>
        ) : error ? (
          <p className={styles.error}>
            {error.message}
          </p>
        ) : (
          <>
          <Card padding="md">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
              <h3 className={styles.cardTitle}>
                {detail?.name ?? detail?.id ?? "Tenant"} · configuration
              </h3>
              <Badge variant={statusVariant(currentStatus)}>{currentStatus}</Badge>
            </div>
            <div style={{ marginTop: "var(--space-3)" }}>
              <StatCardRow stats={stats} columns={3} />
            </div>

            <ul className={styles.list}>
              <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>subdomain</span>
                <span style={{ fontSize: "var(--text-sm)" }}>{detail?.subdomain ?? "—"}</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>locale</span>
                <span style={{ fontSize: "var(--text-sm)" }}>{detail?.locale ?? "—"}</span>
              </li>
              <li style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                <span style={{ fontWeight: 500, color: "var(--color-text-secondary)" }}>timezone</span>
                <span style={{ fontSize: "var(--text-sm)" }}>{detail?.timezone ?? "—"}</span>
              </li>
              {entries.slice(0, 60).map(([key, value]) => (
                <li
                  key={key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ fontWeight: 500, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{key}</span>
                  <span style={{ fontSize: "var(--text-sm)", textAlign: "right", wordBreak: "break-all" }}>
                    {valueText(value)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md">
            <h3 className={styles.cardTitle}>Lifecycle controls</h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              {lifecycle?.stats?.users ?? "—"} users · {lifecycle?.stats?.organizations ?? "—"} organizations
              {purgeReadiness?.purgeEligibleAt
                ? ` · retention expires ${new Date(purgeReadiness.purgeEligibleAt).toLocaleString()}`
                : ""}
            </p>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Badge variant={purgeReadiness?.eligible ? "success" : "warning"}>
                {purgeReadiness?.eligible ? "Purge eligible" : "Purge blocked"}
              </Badge>
              {purgeReadiness?.activeLegalHolds !== null && purgeReadiness?.activeLegalHolds !== undefined ? (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {purgeReadiness.activeLegalHolds} active legal holds
                </span>
              ) : null}
            </div>
            {purgeReadiness?.blockers?.length ? (
              <ul style={{ margin: "var(--space-2) 0 0", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                {purgeReadiness.blockers.map((blocker) => <li key={blocker.code}>{blocker.message}</li>)}
              </ul>
            ) : null}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
              <BreakGlassAction
                buttonLabel="Suspend tenant"
                modalTitle="Suspend tenant"
                modalDescription={`Suspend ${detail?.name ?? detail?.id} and revoke all active sessions.`}
                actionLabel="Suspend"
                variant="danger"
                disabled={!canSuspend || currentStatus === "SUSPENDED" || currentStatus === "OFFBOARDING" || currentStatus === "PURGED"}
                onConfirm={(justification) => lifecycleMutation.run({ action: "suspend", justification }).then(() => undefined)}
              />
              <BreakGlassAction
                buttonLabel="Restore tenant"
                modalTitle="Restore suspended tenant"
                modalDescription={`Restore access for ${detail?.name ?? detail?.id}.`}
                actionLabel="Restore"
                variant="secondary"
                disabled={!canUnsuspend || currentStatus !== "SUSPENDED"}
                onConfirm={(justification) => lifecycleMutation.run({ action: "unsuspend", justification }).then(() => undefined)}
              />
              <BreakGlassAction
                buttonLabel="Start offboarding"
                modalTitle="Start 90-day offboarding"
                modalDescription={`Begin offboarding ${detail?.name ?? detail?.id}. Permanent purge stays blocked until retention expires and all legal holds are released.`}
                actionLabel="Start offboarding"
                variant="danger"
                disabled={!canOffboard || currentStatus === "OFFBOARDING" || currentStatus === "PURGED"}
                onConfirm={(justification) => lifecycleMutation.run({ action: "offboard", justification }).then(() => undefined)}
              />
              <BreakGlassAction
                buttonLabel="Cancel offboarding"
                modalTitle="Cancel offboarding"
                modalDescription={`Cancel offboarding and restore ${detail?.name ?? detail?.id} to active status.`}
                actionLabel="Cancel offboarding"
                variant="secondary"
                disabled={!canOffboard || currentStatus !== "OFFBOARDING"}
                onConfirm={(justification) => lifecycleMutation.run({ action: "cancel-offboarding", justification }).then(() => undefined)}
              />
            </div>
          </Card>

          <Card padding="md">
            <h3 className={styles.cardTitle}>Recent lifecycle events</h3>
            {!lifecycle?.recentEvents?.length ? (
              <EmptyState title="No lifecycle events" description="No lifecycle changes have been recorded for this tenant." />
            ) : (
              <ul className={styles.list}>
                {lifecycle.recentEvents.slice(0, 15).map((event, index) => (
                  <li
                    key={event.id ?? `${event.eventType ?? "event"}-${index}`}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}
                  >
                    <span style={{ fontWeight: 600 }}>{event.eventType ?? "UNKNOWN"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                      <Badge variant={statusVariant(event.status)}>{event.status ?? "UNKNOWN"}</Badge>
                      {event.completedAt || event.createdAt
                        ? new Date(event.completedAt ?? event.createdAt ?? "").toLocaleString()
                        : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          
          <Card padding="md" style={{ border: "1px solid var(--color-danger)" }}>
            <h3 style={{ margin: "0 0 var(--space-2) 0", fontSize: "var(--text-base)", fontWeight: 600, color: "var(--color-danger)" }}>
              Danger Zone
            </h3>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
              Permanent purge is irreversible. The API enforces offboarding completion, retention expiry, legal-hold clearance, explicit confirmation, and two-person approval or an audited break-glass reason.
            </p>
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <BreakGlassAction 
                buttonLabel="Permanently purge tenant"
                modalTitle="Permanently purge tenant"
                modalDescription={`Permanently purge ${detail?.name ?? detail?.id}. This cannot be undone. The request will fail unless retention has expired and no legal hold remains.`}
                actionLabel="Permanently purge"
                variant="danger"
                disabled={!canPurge || !purgeReadiness?.eligible}
                onConfirm={(justification) => lifecycleMutation.run({ action: "purge", justification }).then(() => undefined)}
              />
            </div>
          </Card>
        </>
        )}
      </div>
    </DomainShell>
  );
}
