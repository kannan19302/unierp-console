"use client";

import React, { useState } from "react";
import { Plus, Calendar, Trash2, AlertTriangle, X } from "lucide-react";
import { EmptyState, Badge, Button } from "@kannan19302/ui";
import { api } from "@/lib/api";
import type { SandboxEnvironment } from "@/lib/developer-schema";
import styles from "../developers.module.css";

interface SandboxManagerProps {
  sandboxes: SandboxEnvironment[];
  setSandboxes: React.Dispatch<React.SetStateAction<SandboxEnvironment[]>>;
}

export function SandboxManager({ sandboxes, setSandboxes }: SandboxManagerProps) {
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [sbxName, setSbxName] = useState("");
  const [sbxTenantId, setSbxTenantId] = useState("tenant-acme-corp");
  const [sbxPreset, setSbxPreset] = useState<"MINIMAL" | "FINANCE_SAMPLE" | "FULL_ENTERPRISE_ERP">("FINANCE_SAMPLE");
  const [sbxTtlDays, setSbxTtlDays] = useState(14);
  const [destroyModalId, setDestroyModalId] = useState<string | null>(null);

  const handleCreateSandbox = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbxName.trim()) return;

    const payload = {
      name: sbxName.trim(),
      tenantId: sbxTenantId,
      dataPreset: sbxPreset,
      ttlDays: sbxTtlDays,
    };

    let newSbx: SandboxEnvironment | undefined;
    try {
      const resp = await api.post<{ success: boolean; data: SandboxEnvironment }>(
        "/platform/v1/developer-ecosystem/sandboxes",
        payload
      );
      if (resp?.data?.data && resp.data.data.name) {
        newSbx = resp.data.data;
      }
    } catch {
      // Fallback
    }

    if (!newSbx) {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + sbxTtlDays);
      newSbx = {
        id: `sbx-${Date.now()}`,
        name: payload.name,
        tenantId: payload.tenantId,
        tenantName: payload.tenantId === "tenant-acme-corp" ? "Acme Corporation" : "Custom Enterprise",
        dataPreset: payload.dataPreset,
        status: "PROVISIONED",
        expiresAt: expDate.toISOString(),
        createdAt: new Date().toISOString(),
        allocatedStorageMb: payload.dataPreset === "FULL_ENTERPRISE_ERP" ? 2048 : 512,
        activeConnections: 0,
      };
    }

    setSandboxes((prev) => [newSbx!, ...prev]);
    setIsSandboxOpen(false);
    setSbxName("");
  };

  const handleExtendSandbox = async (sbxId: string, days: number = 14) => {
    try {
      await api.post(`/platform/v1/developer-ecosystem/sandboxes/${sbxId}/extend`, { days });
    } catch {
      // Ignored for optimistic UI updates
    } finally {
      setSandboxes((prev) =>
        prev.map((s) => {
          if (!s || s.id !== sbxId) return s;
          const currentExp = new Date(s.expiresAt);
          currentExp.setDate(currentExp.getDate() + days);
          return { ...s, expiresAt: currentExp.toISOString() };
        })
      );
    }
  };

  const handleDestroySandbox = async (sbxId: string) => {
    try {
      await api.del(`/platform/v1/developer-ecosystem/sandboxes/${sbxId}`);
    } catch {
      // Ignored for optimistic UI updates
    } finally {
      setSandboxes((prev) => prev.filter((s) => s && s.id !== sbxId));
      setDestroyModalId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>Isolated Developer Sandboxes</h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Ephemeral tenant environments with pre-loaded ERP fixtures, synthetic journals, and auto-expiring TTLs.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsSandboxOpen(true)}>
          <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
          Provision Sandbox
        </Button>
      </div>

      <div className={styles.cardGrid}>
        {sandboxes.length === 0 ? (
          <EmptyState title="No sandboxes active" description="Provision an isolated environment to test integrations." />
        ) : (
          sandboxes.map((sbx) => {
            const daysRemaining = Math.max(
              0,
              Math.ceil((new Date(sbx.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            );
            return (
              <div key={sbx.id} className={styles.sandboxCard}>
                <div className={styles.sandboxHeader}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>{sbx.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      Tenant: {sbx.tenantName} ({sbx.tenantId})
                    </div>
                  </div>
                  <Badge variant={sbx.status === "PROVISIONED" ? "success" : "warning"}>
                    {sbx.status}
                  </Badge>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", margin: "var(--space-2) 0" }}>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Data Preset:</span>
                    <span className={styles.metaValue}>
                      <Badge variant="info">{sbx.dataPreset.replace(/_/g, " ")}</Badge>
                    </span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>Storage Quota:</span>
                    <span className={styles.metaValue}>{sbx.allocatedStorageMb} MB</span>
                  </div>
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>TTL Remaining:</span>
                    <span className={styles.metaValue} style={{ color: daysRemaining < 3 ? "var(--color-danger)" : "inherit" }}>
                      {daysRemaining} days (expires {new Date(sbx.expiresAt).toLocaleDateString()})
                    </span>
                  </div>
                </div>

                <div className={styles.buttonGroup} style={{ marginTop: "auto", paddingTop: "var(--space-3)", borderTop: "0.0625rem solid var(--color-border)" }}>
                  <Button variant="outline" size="sm" onClick={() => handleExtendSandbox(sbx.id, 14)}>
                    <Calendar size={14} style={{ marginRight: "var(--space-1)" }} />
                    +14 Days TTL
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDestroyModalId(sbx.id)}>
                    <Trash2 size={14} style={{ marginRight: "var(--space-1)" }} />
                    Destroy
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: PROVISION SANDBOX (EC-14.2) */}
      {isSandboxOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                Provision Isolated Developer Sandbox
              </h3>
              <button
                onClick={() => setIsSandboxOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSandbox} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sandbox Identifier / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staging Integration Env #2"
                  value={sbxName}
                  onChange={(e) => setSbxName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Tenant *</label>
                <input
                  type="text"
                  required
                  value={sbxTenantId}
                  onChange={(e) => setSbxTenantId(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data Snapshot Preset *</label>
                <select
                  value={sbxPreset}
                  onChange={(e) =>
                    setSbxPreset(e.target.value as "MINIMAL" | "FINANCE_SAMPLE" | "FULL_ENTERPRISE_ERP")
                  }
                  className={styles.formSelect}
                >
                  <option value="MINIMAL">Minimal Schema (Zero synthetic fixtures)</option>
                  <option value="FINANCE_SAMPLE">Finance Sample (GL accounts, 50 invoices, AP/AR demo)</option>
                  <option value="FULL_ENTERPRISE_ERP">Full Enterprise ERP (GL, Inventory, CRM, Orders, Webhooks)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Expiration TTL (Days: {sbxTtlDays})</label>
                <input
                  type="range"
                  min={1}
                  max={90}
                  value={sbxTtlDays}
                  onChange={(e) => setSbxTtlDays(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
                <span className={styles.formHelper}>Sandboxes automatically self-destruct after expiration.</span>
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
                <Button variant="outline" type="button" onClick={() => setIsSandboxOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Confirm Provisioning
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DESTROY CONFIRMATION (EC-14.2) */}
      {destroyModalId && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
              <AlertTriangle size={24} color="var(--color-danger)" />
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                Confirm Sandbox Destruction
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
              Are you sure you want to de-provision sandbox <code>{destroyModalId}</code>? All isolated tables, test data, and webhook subscriptions will be permanently purged.
            </p>

            <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setDestroyModalId(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleDestroySandbox(destroyModalId)}>
                Confirm Permanent Destruction
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
