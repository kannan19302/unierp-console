"use client";

/**
 * Settings → Templates → Email.
 * Interactive preview and configuration console for all UniERP system transactional emails.
 */
import { useState, useEffect } from "react";
import { Mail, Check, Eye, Code, Smartphone, Monitor, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, Badge, Spinner, Button } from "@kannan19302/ui";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface SystemEmailTemplate {
  key: string;
  name: string;
  description: string;
  category: string;
  sampleVariables: Record<string, any>;
  defaultSubject: string;
  previewHtml: string;
}

export default function EmailTemplatesSettingsPage() {
  const [templates, setTemplates] = useState<SystemEmailTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("verification");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeVariables, setActiveVariables] = useState<Record<string, any>>({});
  const [renderedSubject, setRenderedSubject] = useState<string>("");
  const [renderedHtml, setRenderedHtml] = useState<string>("");
  const [renderedText, setRenderedText] = useState<string>("");
  const [previewTab, setPreviewTab] = useState<"html" | "text">("html");
  const [viewportMode, setViewportMode] = useState<"desktop" | "mobile">("desktop");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    async function loadTemplates() {
      setLoading(true);
      setError(null);
      try {
        const resp = await api.get<SystemEmailTemplate[]>("/admin/email-templates");
        const list = Array.isArray(resp.data) ? resp.data : [];
        setTemplates(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedKey(first.key);
          setActiveVariables(first.sampleVariables || {});
          setRenderedSubject(first.defaultSubject);
          setRenderedHtml(first.previewHtml);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load email templates from platform.");
      } finally {
        setLoading(false);
      }
    }
    loadTemplates();
  }, []);

  const handleSelectTemplate = (template: SystemEmailTemplate) => {
    setSelectedKey(template.key);
    setActiveVariables(template.sampleVariables || {});
    setRenderedSubject(template.defaultSubject);
    setRenderedHtml(template.previewHtml);
  };

  const handleVariableChange = (key: string, value: string) => {
    setActiveVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleRefreshPreview = async () => {
    setRefreshing(true);
    try {
      const resp = await api.post<{
        subject: string;
        html: string;
        text: string;
      }>(`/admin/email-templates/${selectedKey}/preview`, {
        variables: activeVariables,
      });
      setRenderedSubject(resp.data.subject);
      setRenderedHtml(resp.data.html);
      setRenderedText(resp.data.text);
    } catch (err: any) {
      // Fallback
    } finally {
      setRefreshing(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.key === selectedKey);

  if (loading) {
    return (
      <DomainShell domainId="settings" title="System Email Templates">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="lg" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="settings"
      title="System Email Templates"
      description="Transactional, security, and onboarding email templates dispatched by UniERP."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Link
            href="/settings/templates"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              color: "var(--color-brand-primary, #2563eb)",
              fontSize: "var(--text-sm)",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} /> Back to Reporting Templates
          </Link>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", color: "#b91c1c", fontSize: "var(--text-sm)" }}>
            {error}
          </div>
        )}

        {/* Template Selector Pills */}
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          {templates.map((tpl) => {
            const isSelected = tpl.key === selectedKey;
            return (
              <button
                key={tpl.key}
                onClick={() => handleSelectTemplate(tpl)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: isSelected ? "2px solid #2563eb" : "1px solid var(--color-border, #e2e8f0)",
                  background: isSelected ? "#eff6ff" : "var(--color-bg-surface, #ffffff)",
                  color: isSelected ? "#1d4ed8" : "var(--color-text-primary, #0f172a)",
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: "var(--text-sm)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.15s ease",
                }}
              >
                <Mail size={15} />
                <span>{tpl.name}</span>
                <span
                  style={{
                    fontSize: "10px",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: isSelected ? "#dbeafe" : "#f1f5f9",
                    color: isSelected ? "#1e40af" : "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  {tpl.category}
                </span>
              </button>
            );
          })}
        </div>

        {selectedTemplate && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "var(--space-6)", alignItems: "start" }}>
            {/* Left Column: Template Metadata & Sample Variables Editor */}
            <Card padding="md">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700 }}>
                    {selectedTemplate.name}
                  </h3>
                  <p style={{ margin: "4px 0 0", color: "var(--color-text-secondary)", fontSize: "var(--text-xs)" }}>
                    {selectedTemplate.description}
                  </p>
                </div>

                <div style={{ padding: "10px 14px", background: "var(--color-bg-subtle, #f8fafc)", borderRadius: "6px", border: "1px solid var(--color-border, #e2e8f0)" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#64748b" }}>
                    Subject Line
                  </span>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "#0f172a", marginTop: "2px" }}>
                    {renderedSubject}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: "var(--text-xs)", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-secondary)", marginBottom: "var(--space-2)" }}>
                    Live Preview Variables
                  </h4>

                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                    {Object.entries(activeVariables).map(([varKey, varVal]) => (
                      <div key={varKey} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <label style={{ fontSize: "12px", fontFamily: "monospace", color: "#475569" }}>
                          {varKey}
                        </label>
                        <input
                          type="text"
                          value={String(varVal ?? "")}
                          onChange={(e) => handleVariableChange(varKey, e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            fontSize: "var(--text-xs)",
                            borderRadius: "6px",
                            border: "1px solid var(--color-border, #cbd5e1)",
                            background: "#ffffff",
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleRefreshPreview}
                      disabled={refreshing}
                    >
                      {refreshing ? <Spinner size="sm" /> : "Update Preview"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Right Column: Sandboxed Live Preview */}
            <Card padding="md">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {/* Viewport & View Mode Bar */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border, #e2e8f0)", paddingBottom: "var(--space-2)" }}>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => setPreviewTab("html")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: previewTab === "html" ? 600 : 400,
                        border: "none",
                        background: previewTab === "html" ? "#dbeafe" : "transparent",
                        color: previewTab === "html" ? "#1d4ed8" : "#64748b",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      HTML Preview
                    </button>
                    <button
                      onClick={() => setPreviewTab("text")}
                      style={{
                        padding: "4px 10px",
                        fontSize: "12px",
                        fontWeight: previewTab === "text" ? 600 : 400,
                        border: "none",
                        background: previewTab === "text" ? "#dbeafe" : "transparent",
                        color: previewTab === "text" ? "#1d4ed8" : "#64748b",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Plain Text
                    </button>
                  </div>

                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      onClick={() => setViewportMode("desktop")}
                      style={{
                        padding: "4px",
                        border: "none",
                        background: viewportMode === "desktop" ? "#e2e8f0" : "transparent",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#475569",
                      }}
                      title="Desktop View (600px)"
                    >
                      <Monitor size={15} />
                    </button>
                    <button
                      onClick={() => setViewportMode("mobile")}
                      style={{
                        padding: "4px",
                        border: "none",
                        background: viewportMode === "mobile" ? "#e2e8f0" : "transparent",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "#475569",
                      }}
                      title="Mobile View (360px)"
                    >
                      <Smartphone size={15} />
                    </button>
                  </div>
                </div>

                {/* Render Frame */}
                {previewTab === "html" ? (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      background: "#f1f5f9",
                      padding: "16px",
                      borderRadius: "8px",
                      minHeight: "520px",
                    }}
                  >
                    <iframe
                      srcDoc={renderedHtml}
                      title="Email Preview"
                      style={{
                        width: viewportMode === "desktop" ? "100%" : "360px",
                        maxWidth: "600px",
                        height: "580px",
                        border: "1px solid #cbd5e1",
                        borderRadius: "8px",
                        backgroundColor: "#ffffff",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        transition: "width 0.2s ease",
                      }}
                    />
                  </div>
                ) : (
                  <pre
                    style={{
                      margin: 0,
                      padding: "16px",
                      background: "#0f172a",
                      color: "#f8fafc",
                      borderRadius: "8px",
                      fontSize: "12px",
                      lineHeight: 1.5,
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                      minHeight: "400px",
                    }}
                  >
                    {renderedText || "Plain text view will generate upon preview update."}
                  </pre>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </DomainShell>
  );
}
