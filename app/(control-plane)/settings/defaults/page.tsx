"use client";
/**
 * Settings → Defaults.
 *
 * Defaults that new workspaces inherit: the organization profile and tenant
 * defaults from `/admin/settings`, plus the per-locale formatting defaults from
 * `/admin/localization/formatting-rules`. Real data only.
 */
import { Building2, CalendarDays } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface SettingsTenant {
  id?: string;
  name?: string;
  slug?: string;
  plan?: string;
  status?: string;
  settings?: Record<string, unknown>;
}

interface SettingsOrganization {
  name?: string;
  email?: string;
  taxId?: string;
  currency?: string;
  timezone?: string;
  region?: string;
  address?: string;
  website?: string;
}

interface SettingsPayload {
  tenant?: SettingsTenant;
  organization?: SettingsOrganization | null;
}

interface FormattingRule {
  id: string;
  localeId?: string;
  locale?: { code?: string; name?: string } | null;
  dateFormat?: string;
  timeFormat?: string;
  numberFormat?: string;
  currencyCode?: string;
  currencySymbol?: string;
  firstDayOfWeek?: number;
  timezone?: string;
}

const DEFAULT_KEYS = ["locale", "currency", "timezone", "dateFormat", "date_format", "defaultPlan"];

export default function SettingsDefaults() {
  const settings = useItem<SettingsPayload>("/admin/settings");
  const rules = useList<FormattingRule>({ path: "/admin/localization/formatting-rules" });

  const stats: StatCardItem[] = [
    { label: "Formatting rules", value: rules.data.length, icon: <CalendarDays size={18} /> },
    { label: "Locales", value: new Set(rules.data.map((r) => r.locale?.code)).size },
    { label: "Org profile set", value: settings.data?.organization?.name ? "Yes" : "No", icon: <Building2 size={18} /> },
  ];

  if (settings.loading || rules.loading) {
    return (
      <DomainShell domainId="settings" title="Defaults">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  const tenant = settings.data?.tenant;
  const org = settings.data?.organization;
  const tenantSettings = tenant?.settings ?? {};

  return (
    <DomainShell
      domainId="settings"
      title="Defaults"
      description="Organization profile and formatting defaults new workspaces inherit."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Organization profile
            </h3>
            {settings.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {settings.error.message}
              </p>
            ) : !tenant ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No settings" description="The admin settings endpoint returned no data." />
              </div>
            ) : (
              <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Organization</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>{org?.name ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Email</dt>
                  <dd style={{ margin: 0 }}>{org?.email ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Tax ID</dt>
                  <dd style={{ margin: 0 }}>{org?.taxId ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Currency</dt>
                  <dd style={{ margin: 0 }}>{org?.currency ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Timezone</dt>
                  <dd style={{ margin: 0 }}>{org?.timezone ?? "—"}</dd>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Address</dt>
                  <dd style={{ margin: 0 }}>{org?.address ?? "—"}</dd>
                </div>
              </dl>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Tenant defaults
            </h3>
            {settings.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
                {settings.error.message}
              </p>
            ) : Object.keys(tenantSettings).length === 0 ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No tenant defaults" description="The tenant settings payload is empty." />
              </div>
            ) : (
              <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                {Object.entries(tenantSettings)
                  .filter(([k]) => DEFAULT_KEYS.includes(k))
                  .map(([key, value]) => (
                    <div key={key} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                      <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>{key}</dt>
                      <dd style={{ margin: 0 }}>{renderValue(value)}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </Card>
        </div>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Formatting defaults
          </h3>
          {rules.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {rules.error.message}
            </p>
          ) : rules.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No formatting defaults" description="The formatting-rules endpoint returned no rows." />
            </div>
          ) : (
            <div style={{ margin: "var(--space-3) 0 0", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "var(--text-sm)" }}>
                <thead>
                  <tr style={{ color: "var(--color-text-secondary)", textAlign: "left" }}>
                    <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)", fontWeight: 500 }}>Locale</th>
                    <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)", fontWeight: 500 }}>Date</th>
                    <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)", fontWeight: 500 }}>Time</th>
                    <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)", fontWeight: 500 }}>Number</th>
                    <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)", fontWeight: 500 }}>Currency</th>
                    <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)", fontWeight: 500 }}>First day</th>
                    <th style={{ padding: "var(--space-2)", borderBottom: "1px solid var(--color-border)", fontWeight: 500 }}>Timezone</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.data.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "var(--space-2)" }}>
                        <span style={{ fontWeight: 500 }}>{r.locale?.name ?? "—"}</span>
                        <span style={{ color: "var(--color-text-muted)" }}> ({r.locale?.code ?? r.localeId ?? "—"})</span>
                      </td>
                      <td style={{ padding: "var(--space-2)" }}>{r.dateFormat ?? "—"}</td>
                      <td style={{ padding: "var(--space-2)" }}>{r.timeFormat ?? "—"}</td>
                      <td style={{ padding: "var(--space-2)" }}>{r.numberFormat ?? "—"}</td>
                      <td style={{ padding: "var(--space-2)" }}>
                        {r.currencySymbol ?? "—"} {r.currencyCode ?? ""}
                      </td>
                      <td style={{ padding: "var(--space-2)" }}>{r.firstDayOfWeek != null ? dayName(r.firstDayOfWeek) : "—"}</td>
                      <td style={{ padding: "var(--space-2)" }}>{r.timezone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}

function dayName(day: number): string {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return names[day] ?? String(day);
}

function renderValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "—";
  }
}