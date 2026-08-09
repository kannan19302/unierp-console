"use client";
/**
 * Settings → Branding.
 *
 * SaaS branding for workspaces (real read from `/saas/branding`): identity,
 * color palette, support contact and the linked custom domain. When the API
 * returns no branding row the page shows an honest empty state.
 */
import { Link2, Mail, Palette, ShieldCheck, Sparkles } from "lucide-react";
import {
  Badge,
  Card,
  EmptyState,
  Spinner,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
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

export default function SettingsBranding() {
  const branding = useItem<Branding>("/saas/branding");

  if (branding.loading) {
    return (
      <DomainShell domainId="settings" title="Branding">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  if (branding.error) {
    return (
      <DomainShell domainId="settings" title="Branding" description="SaaS branding for the platform.">
        <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: 0 }}>
          {branding.error.message}
        </p>
      </DomainShell>
    );
  }

  const b = branding.data;
  const empty = b == null || Object.keys(b).length === 0;

  if (empty) {
    return (
      <DomainShell domainId="settings" title="Branding" description="SaaS branding for the platform.">
        <EmptyState
          title="No branding configured"
          description="The branding endpoint returned no branding record for this workspace."
        />
      </DomainShell>
    );
  }

  const colors: StatCardItem[] = [
    { label: "Primary", value: b.primaryColor ?? "—", icon: <Palette size={18} /> },
    { label: "Accent", value: b.accentColor ?? "—", icon: <Palette size={18} /> },
    { label: "Active", value: b.isActive ? "Yes" : "No", icon: <ShieldCheck size={18} /> },
    { label: "Domain", value: b.customDomain?.domain ?? "—", icon: <Link2 size={18} /> },
  ];

  return (
    <DomainShell
      domainId="settings"
      title="Branding"
      description="SaaS branding — identity, color palette, support contact and the linked custom domain."
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-4)" }}>
          <Card padding="md">
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
              <Mail size={16} /> Support
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
              <Link2 size={16} /> Custom domain
            </h3>
            {!b.customDomain ? (
              <div style={{ margin: "var(--space-3) 0 0" }}>
                <EmptyState title="No custom domain" description="No custom domain is linked to this branding." />
              </div>
            ) : (
              <dl style={{ margin: "var(--space-3) 0 0", display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
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
            )}
          </Card>
        </div>
      </div>
    </DomainShell>
  );
}