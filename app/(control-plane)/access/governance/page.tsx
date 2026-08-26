"use client";
/**
 * Users & Access → Governance.
 * Access governance surfaces: access package catalog, governance/security
 * policy knobs and platform settings, all read from the verified admin
 * endpoints. Real data only.
 */
import { useState } from "react";
import { BadgeCheck, KeyRound, Package, Plus, RefreshCw, Settings, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Select,
  Spinner,
  StatCardRow,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import DomainShell from "@/components/domain-shell";
import { useItem, useList } from "@/lib/data";
import { api } from "@/lib/api";

interface AccessPackageRow {
  id?: string;
  name?: string;
  description?: string;
  status?: string;
  approvers?: string[];
  approvalRequired?: boolean;
  period?: string;
  grantedBy?: string[];
  permissions?: string[];
  entitlements?: string[];
}

interface SettingsRow {
  id?: string;
  key?: string;
  name?: string;
  value?: string;
  type?: string;
  updatedAt?: string;
}

interface SecurityConfig {
  mfaEnabled?: boolean;
  sessionTimeoutMinutes?: number;
  passwordPolicy?: Record<string, unknown>;
  mfa?: Record<string, unknown>;
}

function statusVariant(status?: string): "success" | "warning" | "danger" | "default" {
  const s = String(status ?? "").toUpperCase();
  if (["ACTIVE", "ENABLED", "PUBLISHED", "GRANTED"].includes(s)) return "success";
  if (["PENDING", "DRAFT", "REVIEW"].includes(s)) return "warning";
  if (["DISABLED", "ARCHIVED", "REVOKED", "RETIRED"].includes(s)) return "danger";
  return "default";
}

function flag(value: unknown): "success" | "danger" | "warning" {
  if (value === true || value === "true") return "success";
  if (value === false || value === "false") return "danger";
  return "warning";
}

export default function AccessGovernance() {
  const toast = useToast();
  const canGovern = usePermission("pcc.identity-governance.access");
  const canElevate = usePermission("system.privilegeelevation.grant");

  const packages = useList<AccessPackageRow>({ path: "/platform/v1/staff-idp/access-packages" });
  const settings = useList<SettingsRow>({ path: "/admin/settings" });
  const security = useItem<SecurityConfig>("/saas/security");

  const [campaignOpen, setCampaignOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  const [elevateOpen, setElevateOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [privilegeName, setPrivilegeName] = useState("system.superadmin.access");
  const [ttlMinutes, setTtlMinutes] = useState("60");
  const [grantingElevate, setGrantingElevate] = useState(false);

  const handleCreateCampaign = async () => {
    setCreatingCampaign(true);
    try {
      await api.post("/platform/v1/staff-idp/access-reviews", {
        name: campaignName,
        description: campaignDesc,
      });
      await packages.reload();
      toast.success("Campaign Created", `Access review campaign "${campaignName}" initiated.`);
      setCampaignOpen(false);
      setCampaignName("");
      setCampaignDesc("");
    } catch (err: any) {
      toast.error("Campaign Failed", err.message || "Failed to create campaign.");
    } finally {
      setCreatingCampaign(false);
    }
  };

  const handleGrantElevation = async () => {
    setGrantingElevate(true);
    try {
      await api.post("/platform/v1/privilege-elevation", {
        userId: targetUserId,
        privilege: privilegeName,
        grantedBy: "platform-operator",
        ttlMs: (parseInt(ttlMinutes, 10) || 60) * 60 * 1000,
      });
      toast.success("Privilege Elevated", `JIT privilege "${privilegeName}" granted for ${ttlMinutes}m.`);
      setElevateOpen(false);
      setTargetUserId("");
    } catch (err: any) {
      toast.error("Elevation Denied", err.message || "Could not grant JIT privilege elevation.");
    } finally {
      setGrantingElevate(false);
    }
  };

  const published = packages.data.filter((p) => statusVariant(p.status) === "success").length;
  const review = packages.data.filter((p) => statusVariant(p.status) === "warning").length;

  const stats: StatCardItem[] = [
    { label: "Access packages", value: packages.data.length, icon: <Package size={18} /> },
    { label: "Published", value: published, icon: <BadgeCheck size={18} /> },
    { label: "In review", value: review, icon: <BadgeCheck size={18} /> },
    { label: "Settings keys", value: settings.data.length, icon: <Settings size={18} /> },
  ];

  if (packages.loading || settings.loading || security.loading) {
    return (
      <DomainShell domainId="access" title="Governance" description="Access packages, policy controls and platform governance settings.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="access"
      title="Governance"
      description="Access packages, policy controls and platform governance settings."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              packages.reload();
              settings.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setElevateOpen(true)}
            disabled={!canElevate}
          >
            <KeyRound size={14} />
            JIT Elevation
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCampaignOpen(true)}
            disabled={!canGovern}
          >
            <Plus size={14} />
            New Review Campaign
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Access packages</h3>
          {packages.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{packages.error.message}</p>
          ) : packages.data.length === 0 ? (
            <EmptyState title="No access packages" description="The access-packages endpoint returned no rows." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {packages.data.slice(0, 30).map((p) => (
                <li
                  key={p.id ?? p.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    {p.description ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}> — {p.description}</span>
                    ) : null}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    {p.approvalRequired === true ? <Badge variant="warning">Approval required</Badge> : null}
                    {p.period ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>{p.period}</span>
                    ) : null}
                    <Badge variant={statusVariant(p.status)}>{p.status ?? "ACTIVE"}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Settings size={16} /> Governance settings
              </span>
            </h3>
            {settings.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{settings.error.message}</p>
            ) : settings.data.length === 0 ? (
              <EmptyState title="No settings" description="The settings endpoint returned no rows." />
            ) : (
              <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {settings.data.slice(0, 25).map((s) => (
                  <li
                    key={s.id ?? s.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "var(--space-2) 0",
                      borderBottom: "1px solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{s.name ?? s.key}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>{s.value ?? "—"}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Package size={16} /> Policy posture
              </span>
            </h3>
            {security.error ? (
              <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>{security.error.message}</p>
            ) : !security.data ? (
              <EmptyState title="No policy data" description="The security configuration endpoint returned no data." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>MFA</span>
                  <Badge variant={security.data.mfaEnabled === true ? "success" : "danger"}>
                    {security.data.mfaEnabled === true ? "Required" : "Optional"}
                  </Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Password policy</span>
                  <Badge variant={flag(Boolean(security.data.passwordPolicy))}>
                    {security.data.passwordPolicy ? "Configured" : "Not configured"}
                  </Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", padding: "var(--space-2) 0" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Session timeout (min)</span>
                  <span style={{ fontWeight: 500 }}>{security.data.sessionTimeoutMinutes ?? "—"}</span>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={campaignOpen}
        onClose={() => setCampaignOpen(false)}
        title="Create Access Review Campaign"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Initiate a quarterly or ad-hoc access certification campaign for provider workforce principals.
          </p>
          <FormField label="Campaign Name" required>
            <Input
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. Q3 Provider Admin Privileged Access Review"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={campaignDesc}
              onChange={(e) => setCampaignDesc(e.target.value)}
              placeholder="e.g. Recertification of SRE and Platform Operator role bindings"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setCampaignOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateCampaign}
              disabled={creatingCampaign || !campaignName.trim()}
            >
              {creatingCampaign ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={elevateOpen}
        onClose={() => setElevateOpen(false)}
        title="Grant Just-In-Time Privilege Elevation"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Temporary privilege elevation with automatic time-to-live expiration and audit recording.
          </p>
          <FormField label="Target Principal / User ID" required>
            <Input
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="e.g. usr_ops_lead_01"
            />
          </FormField>
          <FormField label="Elevated Privilege Grant" required>
            <Input
              value={privilegeName}
              onChange={(e) => setPrivilegeName(e.target.value)}
              placeholder="e.g. system.superadmin.access"
            />
          </FormField>
          <FormField label="TTL Duration (Minutes)" required>
            <Input
              value={ttlMinutes}
              onChange={(e) => setTtlMinutes(e.target.value)}
              type="number"
              placeholder="60"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setElevateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleGrantElevation}
              disabled={grantingElevate || !targetUserId.trim() || !privilegeName.trim()}
            >
              {grantingElevate ? "Granting..." : "Grant Elevation"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}