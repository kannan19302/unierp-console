"use client";

import React, { useState } from "react";
import { Plus, AlertTriangle, X } from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import { api } from "@/lib/api";
import type { SdkPackage } from "@/lib/developer-schema";
import styles from "../developers.module.css";

interface SdkRegistryProps {
  sdks: SdkPackage[];
  setSdks: React.Dispatch<React.SetStateAction<SdkPackage[]>>;
}

export function SdkRegistry({ sdks, setSdks }: SdkRegistryProps) {
  const [isSdkOpen, setIsSdkOpen] = useState(false);
  const [sdkName, setSdkName] = useState("");
  const [sdkLang, setSdkLang] = useState<"TYPESCRIPT" | "PYTHON" | "GO" | "JAVA" | "CSHARP">("TYPESCRIPT");
  const [sdkVersion, setSdkVersion] = useState("");
  const [sdkMinApi, setSdkMinApi] = useState("2026-01-01");
  const [sdkNotes, setSdkNotes] = useState("");

  const handlePublishSdk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sdkName.trim() || !sdkVersion.trim()) return;

    const payload = {
      name: sdkName.trim(),
      language: sdkLang,
      version: sdkVersion.trim(),
      minApiVersion: sdkMinApi,
      releaseNotes: sdkNotes.trim() || "Routine security and performance improvements.",
    };

    let newPkg: SdkPackage | undefined;
    try {
      const resp = await api.post<{ success: boolean; data: SdkPackage }>(
        "/platform/v1/developer-ecosystem/sdks",
        payload
      );
      if (resp?.data?.data && resp.data.data.name) {
        newPkg = resp.data.data;
      }
    } catch {
      // Fallback
    }

    if (!newPkg) {
      newPkg = {
        id: `sdk-${Date.now()}`,
        name: payload.name,
        language: payload.language,
        latestVersion: payload.version,
        minApiVersion: payload.minApiVersion,
        downloadCount: 0,
        status: "ACTIVE",
        releaseNotes: payload.releaseNotes,
        releasedAt: new Date().toISOString(),
      };
    }

    setSdks((prev) => [newPkg!, ...prev]);
    setIsSdkOpen(false);
    setSdkName("");
    setSdkVersion("");
    setSdkNotes("");
  };

  const handleDeprecateSdk = async (sdkId: string) => {
    try {
      await api.post(`/platform/v1/developer-ecosystem/sdks/${sdkId}/deprecate`, { sunsetDays: 90 });
    } catch {
      // Ignored for optimistic UI updates
    } finally {
      const sunset = new Date();
      sunset.setDate(sunset.getDate() + 90);
      setSdks((prev) =>
        prev.map((s) => (s && s.id === sdkId ? { ...s, status: "DEPRECATED", sunsetAt: sunset.toISOString() } : s))
      );
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>Multi-Language SDK Registry</h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Official client distribution channels, semantic version release notes, and planned deprecation sunsets.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsSdkOpen(true)}>
          <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
          Publish SDK Release
        </Button>
      </div>

      <div className={styles.sdkList}>
        {sdks.map((pkg) => (
          <div key={pkg.id} className={styles.sdkCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <code style={{ fontSize: "var(--text-base)", fontWeight: 700 }}>{pkg.name}</code>
                <Badge variant="primary">{pkg.language}</Badge>
                <Badge variant={pkg.status === "ACTIVE" ? "success" : "warning"}>
                  {pkg.status}
                </Badge>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  v{pkg.latestVersion} (Min API: {pkg.minApiVersion})
                </span>
                <span style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>
                  {pkg.downloadCount.toLocaleString()} downloads
                </span>
              </div>
            </div>

            <p style={{ margin: "var(--space-2) 0", fontSize: "var(--text-sm)", color: "var(--color-text)" }}>
              {pkg.releaseNotes}
            </p>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "0.0625rem solid var(--color-border)", paddingTop: "var(--space-3)" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Released: {new Date(pkg.releasedAt).toLocaleDateString()}
                {pkg.sunsetAt && ` • Scheduled Sunset: ${new Date(pkg.sunsetAt).toLocaleDateString()}`}
              </span>
              <div className={styles.buttonGroup}>
                {pkg.status === "ACTIVE" && (
                  <Button variant="outline" size="sm" onClick={() => handleDeprecateSdk(pkg.id)}>
                    <AlertTriangle size={14} style={{ marginRight: "var(--space-1)" }} />
                    Deprecate Version
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: PUBLISH SDK (EC-14.3) */}
      {isSdkOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                Publish SDK Package Release
              </h3>
              <button
                onClick={() => setIsSdkOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePublishSdk} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Package Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. @unierp/sdk-csharp"
                  value={sdkName}
                  onChange={(e) => setSdkName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Target Language *</label>
                  <select
                    value={sdkLang}
                    onChange={(e) =>
                      setSdkLang(e.target.value as "TYPESCRIPT" | "PYTHON" | "GO" | "JAVA" | "CSHARP")
                    }
                    className={styles.formSelect}
                  >
                    <option value="TYPESCRIPT">TypeScript / Node.js</option>
                    <option value="PYTHON">Python 3.10+</option>
                    <option value="GO">Go 1.22+</option>
                    <option value="JAVA">Java / Kotlin</option>
                    <option value="CSHARP">C# / .NET 8</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Semantic Version *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1.0.0"
                    value={sdkVersion}
                    onChange={(e) => setSdkVersion(e.target.value)}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Minimum API Version *</label>
                <input
                  type="text"
                  required
                  value={sdkMinApi}
                  onChange={(e) => setSdkMinApi(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Release Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe notable changes, breaking changes, and bug fixes..."
                  value={sdkNotes}
                  onChange={(e) => setSdkNotes(e.target.value)}
                  className={styles.formTextarea}
                />
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end" }}>
                <Button variant="outline" type="button" onClick={() => setIsSdkOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Publish to Registry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
