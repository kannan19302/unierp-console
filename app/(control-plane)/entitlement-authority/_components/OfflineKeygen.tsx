"use client";

import { useState } from "react";
import { Plus, Copy, Download, Check } from "lucide-react";
import { Badge, Button, Card, Spinner } from "@kannan19302/ui";
import styles from "../entitlement-authority.module.css";
import type { OfflineLicense } from "@/lib/entitlement-schema";

interface OfflineKeygenProps {
  licenses: OfflineLicense[];
  loading: boolean;
  onOpenIssueLicense: () => void;
  onCopyKey: (key: string) => void;
  onDownloadLic: (lic: OfflineLicense) => void;
}

export function OfflineKeygen({
  licenses,
  loading,
  onOpenIssueLicense,
  onCopyKey,
  onDownloadLic,
}: OfflineKeygenProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (key: string) => {
    onCopyKey(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            Cryptographically Signed Offline Licenses
          </h3>
          <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Issue HMAC-SHA256 authenticated license keys for sovereign, defense, and air-gapped on-premise deployments.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={onOpenIssueLicense}
        >
          <Plus size={16} style={{ marginRight: "var(--space-1)" }} />
          Issue Cryptographic License
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {licenses.map((lic) => (
            <Card key={lic.id} padding="md">
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ fontSize: "var(--text-base)" }}>{lic.tenantName}</strong>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                      Tenant Scope: <span className={styles.monoBadge}>{lic.tenantId}</span>
                    </div>
                  </div>
                  <Badge variant="success">HMAC-SHA256 SIGNED</Badge>
                </div>

                <div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginBottom: "var(--space-1)" }}>
                    License Key (Base64 Enclosed Cryptographic Signature):
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <div className={styles.keyBox} style={{ flex: 1 }}>
                      {lic.licenseKey}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(lic.licenseKey)}
                      aria-label={`Copy key for ${lic.tenantName}`}
                    >
                      {copiedKey === lic.licenseKey ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadLic(lic)}
                      aria-label={`Download .lic for ${lic.tenantName}`}
                    >
                      <Download size={14} />
                    </Button>
                  </div>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-4)", fontSize: "var(--text-xs)" }}>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Licensed Capacity: </span>
                    <strong>{lic.maxSeats} Seats</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Hardware Node Lock: </span>
                    <span className={styles.monoBadge}>{lic.machineFingerprint || "ANY"}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--color-text-secondary)" }}>Validity Period: </span>
                    <span>{new Date(lic.issuedAt).toLocaleDateString()} &mdash; {new Date(lic.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "var(--space-1)" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>Allowed Modules:</span>
                  {lic.allowedModules?.map((mod) => (
                    <Badge key={mod} variant="default">
                      {mod}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
