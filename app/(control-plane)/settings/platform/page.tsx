"use client";
/**
 * Settings → Platform.
 *
 * The platform runtime surface (real `admin/platform/*` reads): feature flags,
 * ERP modules, environments, maintenance mode, white-label and update system.
 * Every section renders honest loading/error/empty states.
 */
import {
  Boxes,
  CheckCircle2,
  Package,
  RefreshCw,
  Server,
  ToggleLeft,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface PlatformModule {
  name: string;
  label?: string;
  description?: string;
  isActive?: boolean;
}

interface PlatformFlag {
  key: string;
  name?: string;
  enabled?: boolean;
  description?: string;
}

interface PlatformEnvironment {
  name?: string;
  type?: string;
  status?: string;
  url?: string;
  lastSyncAt?: string;
}

interface MaintenanceSettings {
  enabled?: boolean;
  message?: string;
}

interface SystemUpdates {
  currentVersion?: string;
  latestVersion?: string;
  updateAvailable?: boolean;
  lastCheckedAt?: string | null;
}

interface WhiteLabel {
  appName?: string;
  theme?: string;
  fontFamily?: string;
  borderRadius?: string;
  enablePWA?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

function envStatus(status: string | undefined): "success" | "warning" | "danger" | "default" {
  const s = status?.toUpperCase();
  if (s === "ACTIVE" || s === "READY" || s === "SYNCED") return "success";
  if (s === "PROVISIONING" || s === "PENDING" || s === "MAINTENANCE") return "warning";
  if (s === "FAILED" || s === "DEPROVISIONED") return "danger";
  return "default";
}

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

export default function SettingsPlatform() {
  const modules = useList<PlatformModule>({ path: "/admin/platform/modules" });
  const flags = useList<PlatformFlag>({ path: "/admin/platform/feature-flags" });
  const environments = useList<PlatformEnvironment>({ path: "/admin/platform/environments" });
  const maintenance = useItem<MaintenanceSettings>("/admin/platform/maintenance");
  const updates = useItem<SystemUpdates>("/admin/platform/updates");
  const whiteLabel = useItem<WhiteLabel>("/admin/platform/white-label");

  const activeModules = modules.data.filter((m) => m.isActive).length;
  const enabledFlags = flags.data.filter((f) => f.enabled).length;

  const stats: StatCardItem[] = [
    { label: "Modules", value: `${activeModules}/${modules.data.length}`, icon: <Boxes size={18} /> },
    { label: "Feature flags", value: `${enabledFlags}/${flags.data.length}`, icon: <ToggleLeft size={18} /> },
    { label: "Environments", value: environments.data.length, icon: <Server size={18} /> },
    { label: "Current version", value: updates.data?.currentVersion ?? "—", icon: <RefreshCw size={18} /> },
    {
      label: "Update available",
      value: updates.data?.updateAvailable ? "Yes" : "No",
      icon: updates.data?.updateAvailable ? <RefreshCw size={18} /> : <CheckCircle2 size={18} />,
    },
  ];

  if (
    modules.loading ||
    flags.loading ||
    environments.loading ||
    maintenance.loading ||
    updates.loading ||
    whiteLabel.loading
  ) {
    return (
      <DomainShell domainId="settings" title="Platform">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  const wl = whiteLabel.data;
  const hasWhiteLabel = wl != null && Object.keys(wl).length > 0;
  const upd = updates.data;

  return (
    <DomainShell
      domainId="settings"
      title="Platform"
      description="Runtime configuration — modules, feature flags, environments, maintenance, white-label and releases."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={5} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>System updates</h3>
            {updates.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {updates.error.message}
              </p>
            ) : (
              <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Current</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>{upd?.currentVersion ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Latest</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>{upd?.latestVersion ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Status</dt>
                  <dd style={{ margin: 0 }}>
                    <Badge variant={upd?.updateAvailable ? "warning" : "success"}>
                      {upd?.updateAvailable ? "UPGRADE AVAILABLE" : "UP TO DATE"}
                    </Badge>
                  </dd>
                </div>
                {upd?.lastCheckedAt && (
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                    <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Checked at</dt>
                    <dd style={{ margin: 0 }}>{formatDate(upd.lastCheckedAt)}</dd>
                  </div>
                )}
              </dl>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Maintenance mode</h3>
            {maintenance.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {maintenance.error.message}
              </p>
            ) : (
              <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Enabled</dt>
                  <dd style={{ margin: 0 }}>
                    {maintenance.data?.enabled ? (
                      <Badge variant="danger">
                        <XCircle size={12} /> ENABLED
                      </Badge>
                    ) : (
                      <Badge variant="success">
                        <CheckCircle2 size={12} /> DISABLED
                      </Badge>
                    )}
                  </dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Message</dt>
                  <dd style={{ margin: 0 }}>{maintenance.data?.message ?? "—"}</dd>
                </div>
              </dl>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Modules</h3>
          {modules.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {modules.error.message}
            </p>
          ) : modules.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No modules" description="The platform modules endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {modules.data.slice(0, 20).map((m) => (
                <li key={m.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span>
                    <span style={{ fontWeight: 500 }}>{m.label ?? m.name}</span>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "var(--space-2)" }}>
                      {m.name}
                    </span>
                  </span>
                  <Badge variant={m.isActive ? "success" : "default"}>
                    {m.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Feature flags</h3>
            {flags.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {flags.error.message}
              </p>
            ) : flags.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No feature flags" description="The platform feature-flags endpoint returned no rows." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {flags.data.slice(0, 20).map((f) => (
                  <li key={f.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span>
                      <span style={{ fontWeight: 500 }}>{f.name ?? f.key}</span>
                      <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {f.key}
                      </span>
                    </span>
                    <Badge variant={f.enabled ? "success" : "default"}>
                      {f.enabled ? "ON" : "OFF"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Environments</h3>
            {environments.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {environments.error.message}
              </p>
            ) : environments.data.length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No environments" description="The platform environments endpoint returned no rows." />
              </div>
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {environments.data.slice(0, 20).map((e) => (
                  <li key={e.name ?? e.type ?? "?"} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                    <span>
                      <span style={{ fontWeight: 500 }}>{e.name ?? e.type}</span>
                      <span style={{ display: "block", fontSize: "var(--text-xs)", color: "var(--color-text-muted)" }}>
                        {e.type ?? "—"} · {e.url ?? "—"}
                      </span>
                    </span>
                    <Badge variant={envStatus(e.status)}>{e.status ?? "UNKNOWN"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>White label</h3>
          {whiteLabel.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {whiteLabel.error.message}
            </p>
          ) : !hasWhiteLabel ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No white-label settings" description="The white-label endpoint returned no data." />
            </div>
          ) : (
            <div style={{ margin: "var(--space-3) 0 0", display: "flex", flexWrap: "wrap", gap: "var(--space-4)" }}>
              <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)", flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>App name</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>{wl.appName ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Theme</dt>
                  <dd style={{ margin: 0 }}>{wl.theme ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Font</dt>
                  <dd style={{ margin: 0 }}>{wl.fontFamily ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>PWA</dt>
                  <dd style={{ margin: 0 }}>
                    <Badge variant={wl.enablePWA ? "success" : "default"}>
                      {wl.enablePWA ? "ENABLED" : "DISABLED"}
                    </Badge>
                  </dd>
                </div>
              </dl>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                  Primary color
                </div>
                <div
                  style={{
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    background: wl.primaryColor ?? "var(--color-primary)",
                    border: "1px solid var(--color-border)",
                  }}
                  title={wl.primaryColor ?? "default"}
                />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                  Secondary color
                </div>
                <div
                  style={{
                    height: 40,
                    borderRadius: "var(--radius-md)",
                    background: wl.secondaryColor ?? "var(--color-primary)",
                    border: "1px solid var(--color-border)",
                  }}
                  title={wl.secondaryColor ?? "default"}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Package size={16} />
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>Logo:</span>
                {wl.logoUrl ? (
                  <a href={wl.logoUrl} style={{ color: "var(--color-primary)", fontSize: "var(--text-sm)" }}>view</a>
                ) : (
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>not set</span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}