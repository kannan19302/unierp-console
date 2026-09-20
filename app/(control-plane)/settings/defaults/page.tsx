"use client";

import React, { useState } from "react";
import { Building2, CalendarDays, Edit3, RefreshCw } from "lucide-react";
import {
  Button,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import DomainShell from "@/components/domain-shell";
import { CrudDrawer } from "@/components/CrudDrawer";
import { FormField } from "@/components/FormField";
import styles from "./defaults.module.css";

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

export default function DefaultsSettingsPage() {
  const toast = useToast();
  const canManage = usePermission("system.settings.admin");

  const settings = useItem<SettingsPayload>("/admin/settings");
  const rules = useList<FormattingRule>({ path: "/admin/localization/formatting-rules" });

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State for editing organization profile
  const [formData, setFormData] = useState({
    orgName: "",
    orgEmail: "",
    taxId: "",
    currency: "USD",
    timezone: "UTC",
    address: "",
    defaultPlan: "ENTERPRISE",
  });

  const tenant = settings.data?.tenant;
  const org = settings.data?.organization;
  const tenantSettings = tenant?.settings ?? {};

  const handleOpenEdit = () => {
    setFormData({
      orgName: org?.name ?? "",
      orgEmail: org?.email ?? "",
      taxId: org?.taxId ?? "",
      currency: org?.currency ?? "USD",
      timezone: org?.timezone ?? "UTC",
      address: org?.address ?? "",
      defaultPlan: (tenantSettings.defaultPlan as string) ?? "ENTERPRISE",
    });
    setEditDrawerOpen(true);
  };

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/admin/settings", {
        organization: {
          name: formData.orgName,
          email: formData.orgEmail,
          taxId: formData.taxId,
          currency: formData.currency,
          timezone: formData.timezone,
          address: formData.address,
        },
        tenantSettings: {
          defaultPlan: formData.defaultPlan,
          currency: formData.currency,
          timezone: formData.timezone,
        },
      });
      toast.success("Defaults Updated", "Global organization profile and tenant defaults saved successfully.");
      setEditDrawerOpen(false);
      await settings.reload();
    } catch {
      toast.error("Save Failed", "Could not persist defaults configuration.");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <DomainShell
      domainId="settings"
      title="Defaults"
      description="Organization profile and formatting defaults new workspaces inherit."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {canManage && (
            <Button size="sm" variant="primary" onClick={handleOpenEdit}>
              <Edit3 size={14} style={{ marginRight: "var(--space-1)" }} />
              Edit Defaults
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => { settings.reload(); rules.reload(); }}>
            <RefreshCw size={14} />
          </Button>
        </div>
      }
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={3} />

        <div className={styles.grid}>
          <Card padding="md">
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Organization profile</h3>
            </div>
            {settings.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)", margin: 0 }}>
                {settings.error.message}
              </p>
            ) : !tenant ? (
              <EmptyState title="No settings" description="The admin settings endpoint returned no data." />
            ) : (
              <dl className={styles.dl}>
                <div className={styles.row}>
                  <dt className={styles.dt}>Organization</dt>
                  <dd className={styles.dd}>{org?.name ?? "—"}</dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.dt}>Email</dt>
                  <dd className={styles.dd}>{org?.email ?? "—"}</dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.dt}>Tax ID</dt>
                  <dd className={styles.dd}>{org?.taxId ?? "—"}</dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.dt}>Currency</dt>
                  <dd className={styles.dd}>{org?.currency ?? "—"}</dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.dt}>Timezone</dt>
                  <dd className={styles.dd}>{org?.timezone ?? "—"}</dd>
                </div>
                <div className={styles.row}>
                  <dt className={styles.dt}>Address</dt>
                  <dd className={styles.dd}>{org?.address ?? "—"}</dd>
                </div>
              </dl>
            )}
          </Card>

          <Card padding="md">
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Tenant defaults</h3>
            </div>
            {settings.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)", margin: 0 }}>
                {settings.error.message}
              </p>
            ) : Object.keys(tenantSettings).length === 0 ? (
              <EmptyState title="No tenant defaults" description="The tenant settings payload is empty." />
            ) : (
              <dl className={styles.dl}>
                {Object.entries(tenantSettings)
                  .filter(([k]) => DEFAULT_KEYS.includes(k))
                  .map(([key, value]) => (
                    <div key={key} className={styles.row}>
                      <dt className={styles.dt}>{key}</dt>
                      <dd className={styles.dd}>{renderValue(value)}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </Card>
        </div>

        <Card padding="md">
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Formatting defaults</h3>
          </div>
          {rules.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--font-size-sm)", margin: 0 }}>
              {rules.error.message}
            </p>
          ) : rules.data.length === 0 ? (
            <EmptyState title="No formatting defaults" description="The formatting-rules endpoint returned no rows." />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Locale</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Number</th>
                    <th>Currency</th>
                    <th>First day</th>
                    <th>Timezone</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.data.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <span style={{ fontWeight: "var(--font-weight-medium)" }}>{r.locale?.name ?? "—"}</span>
                        <span style={{ color: "var(--color-text-muted)" }}> ({r.locale?.code ?? r.localeId ?? "—"})</span>
                      </td>
                      <td>{r.dateFormat ?? "—"}</td>
                      <td>{r.timeFormat ?? "—"}</td>
                      <td>{r.numberFormat ?? "—"}</td>
                      <td>
                        {r.currencySymbol ?? "—"} {r.currencyCode ?? ""}
                      </td>
                      <td>{r.firstDayOfWeek != null ? dayName(r.firstDayOfWeek) : "—"}</td>
                      <td>{r.timezone ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Edit Defaults Drawer */}
        <CrudDrawer
          open={editDrawerOpen}
          onClose={() => setEditDrawerOpen(false)}
          title="Edit Global Organization & Tenant Defaults"
          description="Update defaults inherited by new tenant workspaces and regional clusters."
        >
          <form onSubmit={handleSaveDefaults} className={styles.formGrid}>
            <FormField label="Organization Name" required>
              <input
                type="text"
                value={formData.orgName}
                onChange={(e) => setFormData((prev) => ({ ...prev, orgName: e.target.value }))}
                className={styles.input}
                required
              />
            </FormField>

            <FormField label="Support / Admin Email" required>
              <input
                type="email"
                value={formData.orgEmail}
                onChange={(e) => setFormData((prev) => ({ ...prev, orgEmail: e.target.value }))}
                className={styles.input}
                required
              />
            </FormField>

            <FormField label="Tax Registration ID">
              <input
                type="text"
                value={formData.taxId}
                onChange={(e) => setFormData((prev) => ({ ...prev, taxId: e.target.value }))}
                className={styles.input}
              />
            </FormField>

            <FormField label="Default Currency" required>
              <select
                value={formData.currency}
                onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                className={styles.input}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="SGD">SGD ($)</option>
              </select>
            </FormField>

            <FormField label="Default Timezone" required>
              <input
                type="text"
                value={formData.timezone}
                onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                className={styles.input}
                required
              />
            </FormField>

            <FormField label="Registered Physical Address">
              <textarea
                value={formData.address}
                onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                rows={3}
                className={styles.input}
              />
            </FormField>

            <FormField label="Default Provisioning Plan" required>
              <select
                value={formData.defaultPlan}
                onChange={(e) => setFormData((prev) => ({ ...prev, defaultPlan: e.target.value }))}
                className={styles.input}
              >
                <option value="FREE">Free Tier</option>
                <option value="PRO">Professional</option>
                <option value="ENTERPRISE">Enterprise Global</option>
              </select>
            </FormField>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button type="button" variant="ghost" onClick={() => setEditDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Saving..." : "Save Defaults"}
              </Button>
            </div>
          </form>
        </CrudDrawer>
      </div>
    </DomainShell>
  );
}