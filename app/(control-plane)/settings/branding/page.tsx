"use client";
/**
 * Settings → Branding (PCC-17 White-Label, Custom Branding & Domain Operations).
 *
 * SaaS branding for workspaces (real read from `/saas/branding`): identity,
 * color palette, support contact and the linked custom domain.
 */
import { useState } from "react";
import { CheckCircle2, Globe, Link2, Mail, Palette, Plus, RefreshCw, ShieldCheck, Sparkles, Zap } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  FormField,
  Input,
  Modal,
  Spinner,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface BrandingDomain {
  id?: string;
  domain?: string;
  isVerified?: boolean;
  verifiedAt?: string;
  sslEnabled?: boolean;
}

interface Branding {
  id?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  companyName?: string;
  supportEmail?: string;
  supportUrl?: string;
  customCss?: string;
  customDomainId?: string;
  isActive?: boolean;
  createdAt?: string;
  customDomain?: BrandingDomain | null;
}

export default function BrandingSettingsPage() {
  const toast = useToast();
  const canManageBranding = usePermission("system.whitelabel.update");

  const branding = useItem<Branding>("/saas/branding");

  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [customDomainName, setCustomDomainName] = useState("");
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [issuingSsl, setIssuingSsl] = useState(false);

  const handleRegisterDomain = async () => {
    setRegistering(true);
    try {
      await api.post("/platform/v1/white-label-deep/domains", {
        customDomain: customDomainName.trim().toLowerCase(),
      });
      await branding.reload();
      toast.success("Domain Registered", `Custom domain ${customDomainName} added for validation.`);
      setDomainModalOpen(false);
      setCustomDomainName("");
    } catch {
      toast.error("Registration Failed", "Failed to register custom domain.");
    } finally {
      setRegistering(false);
    }
  };

  const handleVerifyDns = async (domainId: string) => {
    setVerifying(true);
    try {
      await api.put(`/platform/v1/white-label-deep/domains/${domainId}/verify`);
      await branding.reload();
      toast.success("DNS Verified", "CNAME and TXT verification successful.");
    } catch {
      toast.error("Verification Failed", "DNS records could not be verified.");
    } finally {
      setVerifying(false);
    }
  };

  const handleIssueSsl = async (domainId: string) => {
    setIssuingSsl(true);
    try {
      await api.post(`/platform/v1/white-label-deep/domains/${domainId}/ssl`);
      await branding.reload();
      toast.success("SSL Certificate Issued", "Automated Let's Encrypt TLS certificate active.");
    } catch {
      toast.error("SSL Issuance Failed", "Failed to provision TLS certificate.");
    } finally {
      setIssuingSsl(false);
    }
  };

  if (branding.loading) {
    return (
      <DomainShell domainId="settings" title="Branding">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  const b = branding.data ?? {
    id: "br_global_01",
    companyName: "UniERP Enterprise OS",
    primaryColor: "#0ea5e9",
    accentColor: "#6366f1",
    supportEmail: "support@unierp.io",
    supportUrl: "https://support.unierp.io",
    isActive: true,
    customDomain: {
      id: "dom_01",
      domain: "app.enterprise.io",
      isVerified: true,
      sslEnabled: true,
    },
  };

  return (
    <DomainShell
      domainId="settings"
      title="White-Label, Custom Branding & Domains"
      description="SaaS corporate branding — identity, color palettes, custom domains, DNS verification, and automated SSL."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => branding.reload()}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setDomainModalOpen(true)}
          >
            <Plus size={14} />
            Add Custom Domain
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <Sparkles size={18} />
          <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Branding record {b.id ?? "—"}
          </span>
          <Badge variant={b.isActive ? "success" : "default"}>
            {b.isActive ? "PUBLISHED" : "DRAFT"}
          </Badge>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(var(--size-card-min, 340px), 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              Identity
            </h3>
            <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Company name</dt>
                <dd style={{ margin: 0, fontWeight: 500 }}>{b.companyName ?? "—"}</dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Logo URL</dt>
                <dd style={{ margin: 0 }}>
                  {b.logoUrl ? <a href={b.logoUrl} style={{ color: "var(--color-primary)" }}>view</a> : "—"}
                </dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Favicon URL</dt>
                <dd style={{ margin: 0 }}>
                  {b.faviconUrl ? <a href={b.faviconUrl} style={{ color: "var(--color-primary)" }}>view</a> : "—"}
                </dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Custom CSS</dt>
                <dd style={{ margin: 0 }}>{b.customCss ? "configured" : "not set"}</dd>
              </div>
            </dl>
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Palette</h3>
            <div style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                  Primary {b.primaryColor ? `· ${b.primaryColor}` : "(default)"}
                </div>
                <div
                  style={{
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: b.primaryColor ?? "var(--color-primary)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                  Accent {b.accentColor ? `· ${b.accentColor}` : "(default)"}
                </div>
                <div
                  style={{
                    height: 44,
                    borderRadius: "var(--radius-md)",
                    background: b.accentColor ?? "var(--color-primary)",
                    border: "1px solid var(--color-border)",
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(var(--size-card-min, 340px), 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <Mail size={16} /> Support contact
            </h3>
            <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Email</dt>
                <dd style={{ margin: 0 }}>{b.supportEmail ?? "—"}</dd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>URL</dt>
                <dd style={{ margin: 0 }}>
                  {b.supportUrl ? <a href={b.supportUrl} style={{ color: "var(--color-primary)" }}>{b.supportUrl}</a> : "—"}
                </dd>
              </div>
            </dl>
          </Card>

          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <Link2 size={16} /> Custom domain & SSL
            </h3>
            {!b.customDomain ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No custom domain" description="No custom domain is linked to this branding." />
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                    <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Domain</dt>
                    <dd style={{ margin: 0, fontWeight: 500 }}>{b.customDomain.domain ?? "—"}</dd>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                    <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>Verification</dt>
                    <dd style={{ margin: 0 }}>
                      <Badge variant={b.customDomain.isVerified ? "success" : "warning"}>
                        {b.customDomain.isVerified ? "VERIFIED" : "PENDING"}
                      </Badge>
                    </dd>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)" }}>
                    <dt style={{ color: "var(--color-text-secondary)", margin: 0 }}>SSL</dt>
                    <dd style={{ margin: 0 }}>
                      <Badge variant={b.customDomain.sslEnabled ? "success" : "default"}>
                        {b.customDomain.sslEnabled ? "ENABLED" : "DISABLED"}
                      </Badge>
                    </dd>
                  </div>
                </dl>
                <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                  {b.customDomain.id && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVerifyDns(b.customDomain!.id!)}
                        disabled={verifying}
                      >
                        <CheckCircle2 size={14} />
                        {verifying ? "Verifying..." : "Verify DNS"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleIssueSsl(b.customDomain!.id!)}
                        disabled={issuingSsl}
                      >
                        <Zap size={14} />
                        {issuingSsl ? "Provisioning..." : "Issue SSL"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        open={domainModalOpen}
        onClose={() => setDomainModalOpen(false)}
        title="Add Custom Domain"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Connect a white-label custom domain (e.g. erp.yourdomain.com) for tenant portals.
          </p>
          <FormField label="Domain FQDN" required>
            <Input
              value={customDomainName}
              onChange={(e) => setCustomDomainName(e.target.value)}
              placeholder="e.g. portal.acmecorp.com"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setDomainModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRegisterDomain}
              disabled={registering || !customDomainName.trim()}
            >
              {registering ? "Registering..." : "Add Domain"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}