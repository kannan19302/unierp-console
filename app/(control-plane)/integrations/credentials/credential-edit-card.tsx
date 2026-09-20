"use client";

import { useState } from "react";
import { Edit2, Eye, EyeOff, Check, X, Lock } from "lucide-react";
import { Card, Badge, Spinner, Button } from "@kannan19302/ui";
import { api } from "@/lib/api";

export interface CredentialField {
  key: string;
  label?: string;
  value?: string;
  isSet?: boolean;
  sensitive?: boolean;
}

export interface CredentialProvider {
  provider: string;
  label?: string;
  fields?: CredentialField[];
}

interface CredentialEditCardProps {
  provider: CredentialProvider;
  canEdit: boolean;
  onSaved: () => void;
}

export function CredentialEditCard({
  provider,
  canEdit,
  onSaved,
}: CredentialEditCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const startEdit = () => {
    const initial: Record<string, string> = {};
    (provider.fields ?? []).forEach((f) => {
      initial[f.key] = f.sensitive ? "" : f.value || "";
    });
    setFormValues(initial);
    setError(null);
    setSuccess(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    setFormValues({});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Only send values that were entered or changed
      const payload: Record<string, string> = {};
      Object.entries(formValues).forEach(([k, v]) => {
        if (v.trim() !== "") {
          payload[k] = v.trim();
        }
      });

      if (Object.keys(payload).length === 0) {
        setIsEditing(false);
        setSaving(false);
        return;
      }

      await api.put(`/admin/platform-credentials/${provider.provider}`, {
        values: payload,
      });

      setSuccess(true);
      setTimeout(() => {
        setIsEditing(false);
        setSuccess(false);
        onSaved();
      }, 800);
    } catch (err: any) {
      setError(err?.message || "Failed to update credentials.");
    } finally {
      setSaving(false);
    }
  };

  const isConfigured = (provider.fields ?? []).some((f) => f.isSet);

  return (
    <Card padding="md">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            {provider.label ?? provider.provider}
          </h3>
          <Badge variant={isConfigured ? "success" : "warning"}>
            {isConfigured ? "Configured" : "Not Set"}
          </Badge>
        </div>

        {canEdit && !isEditing && (
          <button
            onClick={startEdit}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-1, 4px)",
              background: "transparent",
              border: "1px solid var(--color-border, #e2e8f0)",
              borderRadius: "var(--radius-md, 6px)",
              padding: "var(--space-1, 4px) var(--space-2, 8px)",
              fontSize: "var(--text-xs)",
              color: "var(--color-text-secondary, #64748b)",
              cursor: "pointer",
            }}
            aria-label={`Edit ${provider.label || provider.provider} credentials`}
          >
            <Edit2 size={13} />
            <span>Configure</span>
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: "var(--space-2, 8px) var(--space-3, 12px)", background: "var(--color-danger-bg, #fef2f2)", border: "1px solid var(--color-danger-border, #fecaca)", borderRadius: "var(--radius-md, 6px)", color: "var(--color-danger, #ef4444)", fontSize: "var(--text-xs)", marginBottom: "var(--space-3)" }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ padding: "var(--space-2, 8px) var(--space-3, 12px)", background: "var(--color-success-bg, #ecfdf5)", border: "1px solid var(--color-success-border, #a7f3d0)", borderRadius: "var(--radius-md, 6px)", color: "var(--color-success, #10b981)", fontSize: "var(--text-xs)", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "var(--space-1-5, 6px)" }}>
          <Check size={14} /> Credentials saved securely.
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {(provider.fields ?? []).map((f) => {
            const isVisible = showSensitive[f.key] || false;
            return (
              <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "var(--space-1, 4px)" }}>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--color-text-primary, #0f172a)" }}>
                  {f.label ?? f.key}
                  {f.sensitive && (
                    <span style={{ marginLeft: "var(--space-1, 4px)", color: "var(--color-text-muted, #94a3b8)", fontWeight: 400 }}>
                      (encrypted at rest)
                    </span>
                  )}
                </label>

                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={f.sensitive && !isVisible ? "password" : "text"}
                    value={formValues[f.key] ?? ""}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                    }
                    placeholder={
                      f.isSet
                        ? "(leave blank to keep existing value)"
                        : `Enter ${f.label ?? f.key}`
                    }
                    style={{
                      width: "100%",
                      padding: "var(--space-2, 8px) var(--space-3, 12px)",
                      paddingRight: f.sensitive ? "var(--space-9, 36px)" : "var(--space-3, 12px)",
                      fontSize: "var(--text-sm)",
                      borderRadius: "var(--radius-md, 6px)",
                      border: "1px solid var(--color-border, #cbd5e1)",
                      background: "var(--color-bg-surface, #ffffff)",
                      color: "var(--color-text-primary, #0f172a)",
                    }}
                  />

                  {f.sensitive && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowSensitive((prev) => ({ ...prev, [f.key]: !isVisible }))
                      }
                      style={{
                        position: "absolute",
                        right: "var(--space-2, 8px)",
                        background: "none",
                        border: "none",
                        color: "var(--color-text-secondary, #64748b)",
                        cursor: "pointer",
                        padding: "var(--space-1, 4px)",
                      }}
                      aria-label={isVisible ? "Hide secret" : "Show secret"}
                    >
                      {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={saving}
            >
              {saving ? <Spinner size="sm" /> : "Save Changes"}
            </Button>
          </div>
        </form>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column" }}>
          {(provider.fields ?? []).map((f) => (
            <li
              key={f.key}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "var(--space-2) 0",
                borderBottom: "1px solid var(--color-border, #f1f5f9)",
              }}
            >
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-primary)" }}>
                {f.label ?? f.key}
              </span>
              <span
                style={{
                  fontSize: "var(--text-xs)",
                  fontFamily: f.sensitive ? "monospace" : "inherit",
                  color: f.isSet ? "var(--color-text-primary)" : "var(--color-text-muted, #94a3b8)",
                }}
              >
                {f.value ? f.value : f.isSet ? "••••••••" : "Not configured"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
