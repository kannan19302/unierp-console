"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle2, AlertCircle, RefreshCw, Zap, ShieldCheck } from "lucide-react";
import { Card, Badge, Button, Spinner } from "@kannan19302/ui";
import { api } from "@/lib/api";
import { CredentialProvider } from "./credential-edit-card";

interface EmailProviderSelectorProps {
  providers: CredentialProvider[];
  canEdit: boolean;
  onUpdated: () => void;
}

const SUPPORTED_EMAIL_PROVIDERS = [
  {
    id: "resend",
    name: "Resend",
    desc: "API-first transactional email with real-time delivery logs",
    tag: "Recommended",
  },
  {
    id: "brevo",
    name: "Brevo",
    desc: "Sendinblue transactional API with high delivery quotas",
    tag: "Scale",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    desc: "Twilio SendGrid transactional v3 mail API",
    tag: "Enterprise",
  },
  {
    id: "postmark",
    name: "Postmark",
    desc: "High deliverability transactional email service",
    tag: "Fast",
  },
  {
    id: "smtp",
    name: "Custom SMTP",
    desc: "Mailpit (dev), Postfix, AWS SES SMTP, or corporate mail server",
    tag: "Standard",
  },
  {
    id: "auto",
    name: "Automatic Fallback",
    desc: "Tries configured providers in order (Resend → Brevo → SendGrid → Postmark → SMTP)",
    tag: "Multi-Cloud",
  },
];

export function EmailProviderSelector({
  providers,
  canEdit,
  onUpdated,
}: EmailProviderSelectorProps) {
  const emailConfig = providers.find((p) => p.provider === "email-config");
  const preferredField = emailConfig?.fields?.find((f) => f.key === "preferredProvider");
  const defaultFromField = emailConfig?.fields?.find((f) => f.key === "defaultFrom");

  const [selectedProvider, setSelectedProvider] = useState<string>(
    preferredField?.value || "auto"
  );
  const [defaultFrom, setDefaultFrom] = useState<string>(
    defaultFromField?.value || ""
  );
  const [savingRouting, setSavingRouting] = useState(false);
  const [routingSaved, setRoutingSaved] = useState(false);
  const [routingError, setRoutingError] = useState<string | null>(null);

  // Test Email State
  const [testEmailTo, setTestEmailTo] = useState("test.agent@unierp.com");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  const handleSaveRouting = async () => {
    setSavingRouting(true);
    setRoutingError(null);
    try {
      await api.put("/admin/platform-credentials/email-config", {
        values: {
          preferredProvider: selectedProvider,
          defaultFrom: defaultFrom.trim(),
        },
      });
      setRoutingSaved(true);
      setTimeout(() => setRoutingSaved(false), 2500);
      onUpdated();
    } catch (err: any) {
      setRoutingError(err?.message || "Failed to update email routing.");
    } finally {
      setSavingRouting(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo.trim()) return;
    setSendingTest(true);
    setTestResult(null);

    try {
      const resp = await api.post<{ success: boolean; message: string; jobId?: string }>(
        "/admin/test-email",
        { to: testEmailTo.trim() }
      );
      setTestResult({
        success: true,
        message: resp.data.message || `Test email dispatched to ${testEmailTo}`,
        details: resp.data.jobId ? `Job ID: ${resp.data.jobId}` : undefined,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || "Failed to send test email.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Helper to check if a provider has its credentials configured
  const isProviderConfigured = (providerId: string) => {
    if (providerId === "auto") return true;
    const match = providers.find((p) => p.provider === providerId);
    return Boolean(match?.fields?.some((f) => f.isSet));
  };

  return (
    <Card padding="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <div style={{ width: "var(--space-10, 40px)", height: "var(--space-10, 40px)", borderRadius: "var(--radius-md, 8px)", background: "linear-gradient(135deg, var(--color-brand-primary, #2563eb) 0%, var(--color-brand-emphasis, #1d4ed8) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-inverse, #ffffff)" }}>
              <Mail size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 700 }}>
                Active Email Provider & Routing
              </h3>
              <p style={{ margin: "var(--space-0-5, 2px) 0 0", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>
                Select the primary outbound delivery provider across all UniERP transactional and auth flows.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Badge variant="info">
              Active: {selectedProvider.toUpperCase()}
            </Badge>
          </div>
        </div>

        {routingError && (
          <div style={{ padding: "var(--space-2-5, 10px) var(--space-3-5, 14px)", background: "var(--color-danger-bg, #fef2f2)", border: "1px solid var(--color-danger-border, #fecaca)", borderRadius: "var(--radius-md, 6px)", color: "var(--color-danger, #ef4444)", fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: "var(--space-2, 8px)" }}>
            <AlertCircle size={16} />
            <span>{routingError}</span>
          </div>
        )}

        {routingSaved && (
          <div style={{ padding: "var(--space-2-5, 10px) var(--space-3-5, 14px)", background: "var(--color-success-bg, #ecfdf5)", border: "1px solid var(--color-success-border, #a7f3d0)", borderRadius: "var(--radius-md, 6px)", color: "var(--color-success, #10b981)", fontSize: "var(--text-sm)", display: "flex", alignItems: "center", gap: "var(--space-2, 8px)" }}>
            <CheckCircle2 size={16} />
            <span>Active email provider and routing saved successfully.</span>
          </div>
        )}

        {/* Provider Cards Selection Grid */}
        <div>
          <label style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "var(--letter-spacing-wide, 0.05em)", color: "var(--color-text-secondary)", marginBottom: "var(--space-3)", display: "block" }}>
            Select Preferred Provider
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(15rem, 1fr))", gap: "var(--space-3)" }}>
            {SUPPORTED_EMAIL_PROVIDERS.map((ep) => {
              const isSelected = selectedProvider === ep.id;
              const isConfigured = isProviderConfigured(ep.id);

              return (
                <div
                  key={ep.id}
                  onClick={() => canEdit && setSelectedProvider(ep.id)}
                  style={{
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius-md, 8px)",
                    border: `2px solid ${
                      isSelected ? "var(--color-brand-primary, #2563eb)" : "var(--color-border, #e2e8f0)"
                    }`,
                    background: isSelected ? "var(--color-brand-surface, #eff6ff)" : "var(--color-bg-surface, #ffffff)",
                    cursor: canEdit ? "pointer" : "default",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-1-5, 6px)" }}>
                      <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                        {ep.name}
                      </span>
                      <div style={{ display: "flex", gap: "var(--space-1, 4px)" }}>
                        <span style={{ fontSize: "var(--text-xs, 10px)", padding: "var(--space-0-5, 2px) var(--space-1-5, 6px)", borderRadius: "var(--radius-sm, 4px)", background: "var(--color-bg-subtle, #f1f5f9)", color: "var(--color-text-secondary)" }}>
                          {ep.tag}
                        </span>
                        {ep.id !== "auto" && (
                          <span style={{ fontSize: "var(--text-xs, 10px)", padding: "var(--space-0-5, 2px) var(--space-1-5, 6px)", borderRadius: "var(--radius-sm, 4px)", background: isConfigured ? "var(--color-success-bg, #dcfce7)" : "var(--color-danger-bg, #fee2e2)", color: isConfigured ? "var(--color-success, #15803d)" : "var(--color-danger, #b91c1c)" }}>
                            {isConfigured ? "Keys Set" : "Missing Keys"}
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", lineHeight: 1.4 }}>
                      {ep.desc}
                    </p>
                  </div>

                  <div style={{ marginTop: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-1-5, 6px)" }}>
                    <div style={{ width: "var(--space-4, 16px)", height: "var(--space-4, 16px)", borderRadius: "50%", border: `2px solid ${isSelected ? "var(--color-brand-primary, #2563eb)" : "var(--color-border, #cbd5e1)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isSelected && <div style={{ width: "var(--space-2, 8px)", height: "var(--space-2, 8px)", borderRadius: "50%", background: "var(--color-brand-primary, #2563eb)" }} />}
                    </div>
                    <span style={{ fontSize: "var(--text-xs)", fontWeight: isSelected ? 600 : 400, color: isSelected ? "var(--color-brand-primary, #2563eb)" : "var(--color-text-secondary)" }}>
                      {isSelected ? "Selected Provider" : "Click to Select"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global From Address & Save Button */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--space-4)", flexWrap: "wrap", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border, #f1f5f9)" }}>
          <div style={{ flex: "1 1 18rem" }}>
            <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-primary)", display: "block", marginBottom: "var(--space-1, 4px)" }}>
              Default "From" Address
            </label>
            <input
              type="email"
              value={defaultFrom}
              onChange={(e) => setDefaultFrom(e.target.value)}
              placeholder="notifications@unierp.com"
              disabled={!canEdit}
              style={{
                width: "100%",
                padding: "var(--space-2, 8px) var(--space-3, 12px)",
                fontSize: "var(--text-sm)",
                borderRadius: "var(--radius-md, 6px)",
                border: "1px solid var(--color-border, #cbd5e1)",
                background: "var(--color-bg-surface, #ffffff)",
              }}
            />
          </div>

          {canEdit && (
            <Button
              variant="primary"
              onClick={handleSaveRouting}
              disabled={savingRouting}
            >
              {savingRouting ? <Spinner size="sm" /> : "Save Email Routing"}
            </Button>
          )}
        </div>

        {/* Send Test Email Console */}
        <div style={{ background: "var(--color-bg-subtle, #f8fafc)", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--color-border, #e2e8f0)", padding: "var(--space-4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-2)" }}>
            <Zap size={16} style={{ color: "var(--color-warning, #f59e0b)" }} />
            <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700 }}>
              Live Delivery Test Console
            </h4>
          </div>
          <p style={{ margin: "0 0 var(--space-3) 0", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Send an instant test email using the currently configured provider to verify API keys and network connectivity.
          </p>

          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="email"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              placeholder="recipient@company.com"
              style={{
                flex: "1 1 15rem",
                padding: "var(--space-2, 8px) var(--space-3, 12px)",
                fontSize: "var(--text-sm)",
                borderRadius: "var(--radius-md, 6px)",
                border: "1px solid var(--color-border, #cbd5e1)",
                background: "var(--color-bg-surface, #ffffff)",
              }}
            />
            <Button
              variant="secondary"
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmailTo}
              style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1-5, 6px)" }}
            >
              {sendingTest ? <Spinner size="sm" /> : <Send size={14} />}
              <span>Send Test Email</span>
            </Button>
          </div>

          {testResult && (
            <div
              style={{
                marginTop: "var(--space-3)",
                padding: "var(--space-2-5, 10px) var(--space-3-5, 14px)",
                borderRadius: "var(--radius-md, 6px)",
                fontSize: "var(--text-xs)",
                background: testResult.success ? "var(--color-success-bg, #ecfdf5)" : "var(--color-danger-bg, #fef2f2)",
                border: `1px solid ${testResult.success ? "var(--color-success-border, #a7f3d0)" : "var(--color-danger-border, #fecaca)"}`,
                color: testResult.success ? "var(--color-success, #065f46)" : "var(--color-danger, #991b1b)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2, 8px)",
              }}
            >
              {testResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <div>
                <strong>{testResult.message}</strong>
                {testResult.details && <span style={{ marginLeft: "var(--space-2, 8px)" }}>({testResult.details})</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
