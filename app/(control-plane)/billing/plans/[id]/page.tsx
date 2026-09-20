"use client";
/**
 * Billing → Plan Detail & Pricing Tier Builder.
 * Interactive price tier editor, entitlement matrix, and packaging workbench.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  DollarSign,
  Edit2,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Users,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ForbiddenState,
  Spinner,
  usePermission,
} from "@kannan19302/ui";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import DomainShell from "@/components/domain-shell";
import {
  type BillingPlan,
  type PlanPriceTier,
  AVAILABLE_MODULES,
} from "@/lib/billing-schema";
import styles from "./plan-detail.module.css";

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();

  const canAccess = usePermission("pcc.billing.view");
  const canWrite = usePermission("system.plan.write");

  const [plan, setPlan] = useState<BillingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable state
  const [prices, setPrices] = useState<PlanPriceTier[]>([]);
  const [features, setFeatures] = useState<Record<string, boolean>>({});

  const fetchPlan = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await api.get<BillingPlan>(`/platform/v1/plans/${id}`);
      setPlan(res.data);
      setPrices(res.data.prices || []);
      setFeatures(res.data.features || {});
    } catch (err: any) {
      toast.error("Failed to load plan", err.message || "Plan details could not be retrieved.");
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Real-time updates
  useDomainRealtime("billing", fetchPlan);

  const isDirty = useMemo(() => {
    if (!plan) return false;
    const initialPriceStr = JSON.stringify(plan.prices || []);
    const currentPriceStr = JSON.stringify(prices);
    if (initialPriceStr !== currentPriceStr) return true;

    const initialFeatStr = JSON.stringify(plan.features || {});
    const currentFeatStr = JSON.stringify(features);
    return initialFeatStr !== currentFeatStr;
  }, [plan, prices, features]);

  const handleAddTier = () => {
    setPrices((prev) => [
      ...prev,
      {
        currency: "USD",
        region: "us-east-1",
        monthly: 99,
        yearly: 990,
      },
    ]);
  };

  const handleRemoveTier = (index: number) => {
    setPrices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTierChange = (index: number, field: keyof PlanPriceTier, value: any) => {
    setPrices((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const toggleFeature = (key: string) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveChanges = async () => {
    if (!plan) return;
    try {
      setSaving(true);
      // Save updated prices
      await api.post(`/platform/v1/plans/${plan.id}/prices`, {
        prices,
        reason: "Updated pricing tiers from control plane workbench",
      });
      // Save feature entitlements
      await api.put(`/platform/v1/plans/${plan.id}`, {
        data: { features },
        reason: "Updated plan feature entitlements",
      });

      toast.success("Plan Updated", `Successfully saved pricing and entitlements for "${plan.name}".`);
      fetchPlan();
    } catch (err: any) {
      toast.error("Save Failed", err.message || "Failed to update plan pricing.");
    } finally {
      setSaving(false);
    }
  };

  if (!canAccess) {
    return (
      <DomainShell domainId="billing" title="Plan Builder">
        <ForbiddenState
          title="Access Restricted"
          description="You do not have permission (pcc.billing.view) to inspect or modify pricing tiers."
        />
      </DomainShell>
    );
  }

  if (loading && !plan) {
    return (
      <DomainShell domainId="billing" title="Plan Builder">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  if (!plan) {
    return (
      <DomainShell domainId="billing" title="Plan Builder">
        <EmptyState
          title="Plan Not Found"
          description="The requested plan does not exist or has been removed."
          action={
            <Link href="/billing/plans" style={{ textDecoration: "none" }}>
              <Button variant="outline">Back to Plans</Button>
            </Link>
          }
        />
      </DomainShell>
    );
  }

  const primaryPrice = prices[0] || { monthly: 0, yearly: 0, currency: "USD" };

  return (
    <DomainShell
      domainId="billing"
      title={`Plan: ${plan.name}`}
      description="Pricing tier configuration, packaging bounds, and tenant entitlement rules."
    >
      <div className={styles.container}>
        <div>
          <Link href="/billing/plans" className={styles.backLink}>
            <ArrowLeft size={14} />
            <span>Back to Plans Directory</span>
          </Link>
        </div>

        {/* Header Card */}
        <Card padding="lg">
          <div className={styles.headerCard}>
            <div className={styles.titleArea}>
              <div className={styles.titleRow}>
                <h2 className={styles.title}>{plan.name}</h2>
                <Badge variant={plan.status === "ACTIVE" ? "success" : "default"}>
                  {plan.status}
                </Badge>
                <Badge variant="info">v{plan.version}</Badge>
                <Badge variant="default">{plan.isPublic ? "Marketplace Visible" : "Private Tier"}</Badge>
              </div>
              <p className={styles.description}>
                {plan.description || "No description provided for this plan."}
              </p>
            </div>

            <div className={styles.actions}>
              <Button variant="outline" size="sm" onClick={fetchPlan}>
                <RefreshCw size={13} />
                Refresh
              </Button>
            </div>
          </div>
        </Card>

        {/* Two-Column Workbench */}
        <div className={styles.grid}>
          {/* Left Column: Pricing Tiers & Entitlements */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Pricing Tiers Builder */}
            <Card padding="md">
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Regional Pricing Tiers</h3>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    Configure multi-currency rates and deployment regional pricing.
                  </span>
                </div>
                {canWrite && (
                  <Button variant="outline" size="sm" onClick={handleAddTier}>
                    <Plus size={13} />
                    Add Tier
                  </Button>
                )}
              </div>

              <div style={{ overflowX: "auto" }}>
                <table className={styles.tiersTable}>
                  <thead>
                    <tr>
                      <th>Currency</th>
                      <th>Region</th>
                      <th>Monthly ($)</th>
                      <th>Yearly ($)</th>
                      {canWrite && <th style={{ width: "3rem" }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {prices.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-secondary)", padding: "var(--space-4)" }}>
                          No regional pricing tiers configured. Click &quot;Add Tier&quot; to establish pricing.
                        </td>
                      </tr>
                    ) : (
                      prices.map((tier, idx) => (
                        <tr key={idx}>
                          <td>
                            <input
                              className={styles.tierInputText}
                              value={tier.currency}
                              disabled={!canWrite}
                              onChange={(e) => handleTierChange(idx, "currency", e.target.value.toUpperCase())}
                            />
                          </td>
                          <td>
                            <input
                              className={styles.tierInputText}
                              value={tier.region}
                              disabled={!canWrite}
                              onChange={(e) => handleTierChange(idx, "region", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className={styles.tierInput}
                              value={tier.monthly}
                              disabled={!canWrite}
                              onChange={(e) => handleTierChange(idx, "monthly", Number(e.target.value))}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className={styles.tierInput}
                              value={tier.yearly}
                              disabled={!canWrite}
                              onChange={(e) => handleTierChange(idx, "yearly", Number(e.target.value))}
                            />
                          </td>
                          {canWrite && (
                            <td>
                              <button
                                className={styles.actionButton}
                                title="Remove Tier"
                                onClick={() => handleRemoveTier(idx)}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--color-danger)",
                                  cursor: "pointer",
                                }}
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Feature Entitlements Checklist */}
            <Card padding="md">
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Feature Entitlements</h3>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    Select functional application suites granted under this plan tier.
                  </span>
                </div>
              </div>

              <div className={styles.modulesList}>
                {AVAILABLE_MODULES.map((mod) => {
                  const isEnabled = Boolean(features[mod.key]);
                  return (
                    <div
                      key={mod.key}
                      className={styles.moduleItem}
                      onClick={() => canWrite && toggleFeature(mod.key)}
                    >
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        disabled={!canWrite}
                        onChange={() => {}} // Controlled by parent container onClick
                      />
                      <span className={styles.moduleLabel}>{mod.label}</span>
                      <Badge variant={isEnabled ? "success" : "default"}>
                        {isEnabled ? "Included" : "Disabled"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right Column: Customer Card Preview & Resource Limits */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {/* Live Card Preview */}
            <Card padding="md">
              <h3 className={styles.sectionTitle} style={{ marginBottom: "var(--space-3)" }}>
                Customer Pricing Preview
              </h3>
              <div className={styles.previewCard}>
                <div className={styles.previewHeader}>
                  <span style={{ fontWeight: 700, fontSize: "var(--text-lg)" }}>{plan.name}</span>
                  <Badge variant="primary">Most Popular</Badge>
                </div>
                <div>
                  <span className={styles.previewPrice}>${primaryPrice.monthly}</span>
                  <span className={styles.previewCadence}> / month billed monthly</span>
                </div>
                <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", margin: 0 }}>
                  {plan.description || "Comprehensive platform plan for scaling organizations."}
                </p>
                <hr style={{ border: "none", borderTop: "1px solid var(--color-border)", margin: 0 }} />
                <ul className={styles.previewFeatures}>
                  <li className={styles.previewFeatureItem}>
                    <CheckCircle2 size={13} color="var(--color-success)" />
                    <span>Up to {plan.maxUsers} operator seats</span>
                  </li>
                  <li className={styles.previewFeatureItem}>
                    <CheckCircle2 size={13} color="var(--color-success)" />
                    <span>{plan.maxStorage} GB high-speed persistence</span>
                  </li>
                  <li className={styles.previewFeatureItem}>
                    <CheckCircle2 size={13} color="var(--color-success)" />
                    <span>{(plan.maxApiCalls / 1000).toFixed(0)}k API requests / day</span>
                  </li>
                  {AVAILABLE_MODULES.filter((m) => features[m.key]).map((m) => (
                    <li key={m.key} className={styles.previewFeatureItem}>
                      <CheckCircle2 size={13} color="var(--color-success)" />
                      <span>{m.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* Quota Limits Card */}
            <Card padding="md">
              <h3 className={styles.sectionTitle} style={{ marginBottom: "var(--space-3)" }}>
                Resource Quota Bounds
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Seat Quota</span>
                  <span style={{ fontWeight: 600 }}>{plan.maxUsers} Users</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Storage Quota</span>
                  <span style={{ fontWeight: 600 }}>{plan.maxStorage} GB</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>API Burst Limit</span>
                  <span style={{ fontWeight: 600 }}>{plan.maxApiCalls.toLocaleString()} calls/day</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Sticky Save Bar */}
        {isDirty && canWrite && (
          <div className={styles.stickyFooter}>
            <div>
              <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>
                Unsaved Pricing &amp; Entitlement Changes
              </span>
              <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                You have modified regional rates or module entitlements for this plan.
              </span>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPrices(plan.prices || []);
                  setFeatures(plan.features || {});
                }}
              >
                Discard
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveChanges} disabled={saving}>
                <Save size={14} />
                Save Plan Changes
              </Button>
            </div>
          </div>
        )}
      </div>
    </DomainShell>
  );
}
