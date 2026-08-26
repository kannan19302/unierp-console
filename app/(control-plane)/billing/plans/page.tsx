"use client";
/**
 * Billing → Plans (PCC-04 Subscription & Plan Engineering).
 * Published billing plans, their pricing, billing cycle and how many
 * tenants are subscribed to each — read from the plans control-plane API.
 */
import { useState } from "react";
import { Layers, Package, Plus, RefreshCw, Users } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  Select,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

const fmtMoney = (v?: number | string | null): string =>
  typeof v === "number"
    ? `$${v.toLocaleString()}`
    : typeof v === "string" && v.length > 0
      ? v
      : "—";

interface PlanRow {
  id?: string;
  code?: string;
  name?: string;
  description?: string;
  status?: string;
  price?: number | string;
  currency?: string;
  billingCycle?: string;
  interval?: string;
  period?: string;
  tenantCount?: number;
  subscribers?: number;
  createdAt?: string;
}

export default function BillingPlans() {
  const toast = useToast();
  const canWritePlan = usePermission("system.plan.write");

  const plans = useList<PlanRow>({ path: "/platform/v1/plans" });

  const [createOpen, setCreateOpen] = useState(false);
  const [planCode, setPlanCode] = useState("");
  const [planName, setPlanName] = useState("");
  const [planDesc, setPlanDesc] = useState("");
  const [planTier, setPlanTier] = useState("GROWTH");
  const [monthlyPrice, setMonthlyPrice] = useState("299");
  const [creating, setCreating] = useState(false);

  const handleCreatePlan = async () => {
    setCreating(true);
    try {
      await api.post("/platform/v1/plans", {
        code: planCode.toUpperCase().trim(),
        name: planName.trim(),
        description: planDesc.trim(),
        tier: planTier,
        prices: [
          {
            currency: "USD",
            amount: parseFloat(monthlyPrice) || 0,
            interval: "MONTHLY",
          },
        ],
      });
      await plans.reload();
      toast.success("Plan Created", `Commercial plan "${planName}" published.`);
      setCreateOpen(false);
      setPlanCode("");
      setPlanName("");
      setPlanDesc("");
    } catch {
      toast.error("Creation Failed", "Could not create commercial plan.");
    } finally {
      setCreating(false);
    }
  };

  const activeCount = plans.data.filter(
    (p) => (p.status ?? "").toUpperCase() === "ACTIVE",
  ).length;
  const subscriberCount = plans.data.reduce(
    (sum, p) => sum + (typeof p.tenantCount === "number" ? p.tenantCount : 0),
    0,
  );

  const stats: StatCardItem[] = [
    { label: "Plans", value: plans.data.length, icon: <Layers size={18} /> },
    { label: "Active plans", value: activeCount, icon: <Package size={18} /> },
    { label: "Subscribed tenants", value: subscriberCount, icon: <Users size={18} /> },
  ];

  return (
    <DomainShell
      domainId="billing"
      title="Commercial Plans & Price Books"
      description="Define subscription plans, tier entitlements, multi-currency price points, and quota allocations."
      breadcrumb={[{ label: "Billing", href: "/billing" }, { label: "Plans" }]}
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => plans.reload()}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
            disabled={!canWritePlan}
          >
            <Plus size={14} />
            Create Plan
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={3} />

        {plans.loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
            <Spinner size="md" />
          </div>
        ) : plans.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {plans.error.message}
          </p>
        ) : plans.data.length === 0 ? (
          <EmptyState title="No plans published" description="The plans endpoint returned no rows." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
            {plans.data.map((p) => (
              <Card key={p.id ?? p.code ?? p.name ?? "?"} padding="md">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                      {p.name ?? p.code ?? "—"}
                    </h3>
                    {p.description ? (
                      <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {p.description}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant={planVariant(p.status)}>{p.status ?? "ACTIVE"}</Badge>
                </div>
                <div style={{ marginTop: "var(--space-4)", fontSize: "var(--text-xl)", fontWeight: 700 }}>
                  {fmtMoney(p.price)}
                  {p.billingCycle ?? p.interval ?? p.period ? (
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 400, color: "var(--color-text-muted)" }}>
                      {" "}
                      / {p.billingCycle ?? p.interval ?? p.period}
                    </span>
                  ) : null}
                </div>
                <dl style={{ margin: "var(--space-4) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Subscribed tenants</dt>
                    <dd style={{ margin: 0, fontWeight: 500 }}>{p.tenantCount ?? p.subscribers ?? "—"}</dd>
                  </div>
                  {p.code ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Plan Code</dt>
                      <dd style={{ margin: 0, fontWeight: 500 }}>{p.code}</dd>
                    </div>
                  ) : null}
                  {p.createdAt ? (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Created</dt>
                      <dd style={{ margin: 0, fontWeight: 500 }}>{p.createdAt}</dd>
                    </div>
                  ) : null}
                </dl>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Author Commercial Plan"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Publish a new plan tier to the platform price book and enable tenant provisioning.
          </p>
          <FormField label="Plan Code" required>
            <Input
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              placeholder="e.g. ENTERPRISE_PLUS"
            />
          </FormField>
          <FormField label="Plan Name" required>
            <Input
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="e.g. Enterprise Plus (Dedicated SLA)"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={planDesc}
              onChange={(e) => setPlanDesc(e.target.value)}
              placeholder="e.g. Dedicated infrastructure, custom SSO, 99.99% uptime SLA"
            />
          </FormField>
          <FormField label="Plan Tier" required>
            <Select
              value={planTier}
              onChange={(e) => setPlanTier(e.target.value)}
            >
              <option value="STARTER">Starter</option>
              <option value="GROWTH">Growth</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="SCALE">Scale</option>
            </Select>
          </FormField>
          <FormField label="Monthly Price (USD)" required>
            <Input
              value={monthlyPrice}
              onChange={(e) => setMonthlyPrice(e.target.value)}
              type="number"
              placeholder="299"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePlan}
              disabled={creating || !planCode.trim() || !planName.trim()}
            >
              {creating ? "Publishing..." : "Publish Plan"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}

function planVariant(
  status?: string,
): "success" | "default" | "primary" | "warning" | "danger" | "info" {
  switch ((status ?? "").toUpperCase()) {
    case "ACTIVE":
    case "PUBLISHED":
      return "success";
    case "DRAFT":
    case "ARCHIVED":
    case "RETIRED":
    case "INACTIVE":
      return "default";
    default:
      return "default";
  }
}