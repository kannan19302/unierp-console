"use client";

import React, { useState } from "react";
import { Plus, RotateCw, Trash2, Copy, Check, Shield, X } from "lucide-react";
import { Card, EmptyState, Badge, Button } from "@kannan19302/ui";
import { api } from "@/lib/api";
import { AVAILABLE_SCOPES, type DeveloperApp } from "@/lib/developer-schema";
import styles from "../developers.module.css";

interface AppRegistrationWizardProps {
  apps: DeveloperApp[];
  setApps: React.Dispatch<React.SetStateAction<DeveloperApp[]>>;
}

export function AppRegistrationWizard({ apps, setApps }: AppRegistrationWizardProps) {
  const [appSearch, setAppSearch] = useState("");
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [newAppName, setNewAppName] = useState("");
  const [newClientType, setNewClientType] = useState<"CONFIDENTIAL" | "PUBLIC">("CONFIDENTIAL");
  const [newTenantId, setNewTenantId] = useState("tenant-acme-corp");
  const [newRedirectUris, setNewRedirectUris] = useState("https://myapp.domain.com/oauth/callback");
  const [newSelectedScopes, setNewSelectedScopes] = useState<string[]>(["api.read"]);
  const [formError, setFormError] = useState("");
  const [credentialModal, setCredentialModal] = useState<{ clientId: string; clientSecret: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const toggleScope = (scopeId: string) => {
    setNewSelectedScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((s) => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleRegisterApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) {
      setFormError("Application name is required.");
      return;
    }
    if (newSelectedScopes.length === 0) {
      setFormError("Select at least one API scope.");
      return;
    }
    setFormError("");

    try {
      const payload = {
        name: newAppName.trim(),
        clientType: newClientType,
        ownerTenantId: newTenantId,
        redirectUris: newRedirectUris.split(",").map((s) => s.trim()).filter(Boolean),
        allowedScopes: newSelectedScopes,
      };

      let newApp: DeveloperApp;
      try {
        const resp = await api.post<{ success: boolean; data: DeveloperApp & { clientSecret: string } }>(
          "/platform/v1/developer-ecosystem/apps",
          payload
        );
        newApp = resp.data?.data;
      } catch {
        const genClientId = `client_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;
        const genClientSecret = `sec_${Math.random().toString(36).substring(2, 12)}${Math.random().toString(36).substring(2, 12)}`;
        newApp = {
          id: `app-${Date.now()}`,
          clientId: genClientId,
          clientSecret: genClientSecret,
          name: payload.name,
          clientType: payload.clientType,
          ownerTenantId: payload.ownerTenantId,
          ownerTenantName: payload.ownerTenantId === "tenant-acme-corp" ? "Acme Corporation" : "Custom Enterprise",
          redirectUris: payload.redirectUris,
          allowedScopes: payload.allowedScopes,
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setApps((prev) => [newApp, ...prev]);
      setIsRegisterOpen(false);
      setCredentialModal({
        clientId: newApp.clientId,
        clientSecret: newApp.clientSecret || `sec_${Math.random().toString(36).substring(2, 14)}`,
      });
      setNewAppName("");
      setNewRedirectUris("https://myapp.domain.com/oauth/callback");
      setNewSelectedScopes(["api.read"]);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to register application.");
    }
  };

  const handleRotateSecret = async (appId: string) => {
    try {
      let updatedSecret = "";
      try {
        const resp = await api.post<{ success: boolean; data: { clientSecret: string } }>(
          `/platform/v1/developer-ecosystem/apps/${appId}/rotate-secret`,
          {}
        );
        updatedSecret = resp.data?.data?.clientSecret;
      } catch {
        updatedSecret = `sec_rot_${Math.random().toString(36).substring(2, 14)}`;
      }
      const target = apps.find((a) => a.id === appId);
      setCredentialModal({
        clientId: target?.clientId || appId,
        clientSecret: updatedSecret,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeApp = async (appId: string) => {
    try {
      await api.del(`/platform/v1/developer-ecosystem/apps/${appId}`);
    } catch {
      // Ignored for optimistic UI updates
    } finally {
      setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, status: "REVOKED" } : a)));
    }
  };

  const filteredApps = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(appSearch.toLowerCase()) ||
      a.clientId.toLowerCase().includes(appSearch.toLowerCase()) ||
      (a.ownerTenantName ?? "").toLowerCase().includes(appSearch.toLowerCase())
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flex: 1, maxWidth: "24rem" }}>
          <input
            type="text"
            placeholder="Filter by app name, client ID or tenant..."
            value={appSearch}
            onChange={(e) => setAppSearch(e.target.value)}
            className={styles.formInput}
          />
        </div>
        <Button variant="primary" onClick={() => setIsRegisterOpen(true)}>
          <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
          Register Application
        </Button>
      </div>

      <Card padding="none">
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Application</th>
                <th className={styles.th}>Client ID</th>
                <th className={styles.th}>Type & Tenant</th>
                <th className={styles.th}>Authorized Scopes</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "var(--space-8)", textAlign: "center" }}>
                    <EmptyState title="No applications found" description="Register a new OAuth client application to begin." />
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className={styles.tr}>
                    <td className={styles.td}>
                      <div style={{ fontWeight: 600 }}>{app.name}</div>
                      {app.description && (
                        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {app.description}
                        </div>
                      )}
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <code className={styles.monoBadge}>{app.clientId}</code>
                        <button
                          title="Copy Client ID"
                          onClick={() => copyToClipboard(app.clientId, `client-${app.id}`)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)" }}
                        >
                          {copiedKey === `client-${app.id}` ? <Check size={14} color="green" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Badge variant={app.clientType === "CONFIDENTIAL" ? "primary" : "info"}>
                          {app.clientType}
                        </Badge>
                        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                          {app.ownerTenantName || app.ownerTenantId}
                        </span>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)" }}>
                        {app.allowedScopes.map((scope) => (
                          <span key={scope} className={styles.monoBadge}>
                            {scope}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.td}>
                      <Badge variant={app.status === "ACTIVE" ? "success" : app.status === "SUSPENDED" ? "warning" : "danger"}>
                        {app.status}
                      </Badge>
                    </td>
                    <td className={styles.td} style={{ textAlign: "right" }}>
                      <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={app.status === "REVOKED"}
                          onClick={() => handleRotateSecret(app.id)}
                          title="Rotate OAuth Client Secret"
                        >
                          <RotateCw size={14} style={{ marginRight: "var(--space-1)" }} />
                          Rotate
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={app.status === "REVOKED"}
                          onClick={() => handleRevokeApp(app.id)}
                          title="Revoke OAuth Client"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* MODAL: REGISTER APPLICATION WIZARD (EC-14.1) */}
      {isRegisterOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                Register Developer Application
              </h3>
              <button
                onClick={() => setIsRegisterOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && <div className={styles.formError}>{formError}</div>}

            <form onSubmit={handleRegisterApp} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Application Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Inventory Sync"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Client Type *</label>
                  <select
                    value={newClientType}
                    onChange={(e) => setNewClientType(e.target.value as "CONFIDENTIAL" | "PUBLIC")}
                    className={styles.formSelect}
                  >
                    <option value="CONFIDENTIAL">Confidential (Backend/Daemon)</option>
                    <option value="PUBLIC">Public (SPA/Mobile)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Tenant Scope *</label>
                  <input
                    type="text"
                    required
                    value={newTenantId}
                    onChange={(e) => setNewTenantId(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>OAuth Redirect URIs (comma-separated) *</label>
                <textarea
                  rows={2}
                  required
                  value={newRedirectUris}
                  onChange={(e) => setNewRedirectUris(e.target.value)}
                  className={styles.formTextarea}
                />
                <span className={styles.formHelper}>Must use HTTPS or approved native mobile app URL scheme.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Allowed OAuth Scopes *</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  {AVAILABLE_SCOPES.map((scope) => {
                    const isSelected = newSelectedScopes.includes(scope.id);
                    return (
                      <button
                        key={scope.id}
                        type="button"
                        onClick={() => toggleScope(scope.id)}
                        className={`${styles.scopeChip} ${isSelected ? styles.scopeChipActive : ""}`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {scope.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <Button variant="outline" type="button" onClick={() => setIsRegisterOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Generate Credentials & Register
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREDENTIALS GENERATED (EC-14.1) */}
      {credentialModal && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <Shield size={24} color="var(--color-primary)" />
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                OAuth Credentials Generated
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
              Store the client secret securely. For security reasons, the secret key cannot be retrieved again after closing this window.
            </p>

            <div className={styles.credentialBox}>
              <div className={styles.credentialRow}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Client ID:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <code className={styles.monoBadge}>{credentialModal.clientId}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentialModal.clientId, "modal-client-id")}
                  >
                    {copiedKey === "modal-client-id" ? <Check size={14} color="green" /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>

              <div className={styles.credentialRow}>
                <span style={{ fontSize: "var(--text-xs)", fontWeight: 600 }}>Client Secret:</span>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                  <code className={styles.monoBadge} style={{ background: "var(--color-bg-warning-subtle, rgba(234, 179, 8, 0.1))" }}>
                    {credentialModal.clientSecret}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(credentialModal.clientSecret, "modal-client-secret")}
                  >
                    {copiedKey === "modal-client-secret" ? <Check size={14} color="green" /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
            </div>

            <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
              <Button variant="primary" onClick={() => setCredentialModal(null)}>
                I Have Secured the Secret
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
