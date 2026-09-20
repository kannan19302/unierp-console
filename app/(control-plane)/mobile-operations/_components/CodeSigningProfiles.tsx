"use client";

import { ShieldCheck, Key } from "lucide-react";
import { Badge, Card } from "@kannan19302/ui";
import styles from "../mobile.module.css";

export function CodeSigningProfiles() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "var(--space-4)" }}>
      <Card padding="md">
        <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <ShieldCheck size={16} />
          Apple Developer Distribution Identity
        </h4>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
          <div>Certificate: <strong>Apple Distribution: UniERP Global Inc. (9A12BC8765)</strong></div>
          <div>Status: <Badge variant="success">VALID</Badge></div>
          <div>Expires: 180 Days</div>
          <div>Provisioning Profile: <code>UniERP Enterprise AppStore (Wildcard)</code></div>
        </div>
      </Card>

      <Card padding="md">
        <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <Key size={16} />
          Google Play App Signing Key
        </h4>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-3)" }}>
          <div>Key Fingerprint (SHA-256): <span className={styles.monoBadge}>9A:44:B1:02:88:C1:F2:77...</span></div>
          <div>Status: <Badge variant="success">MANAGED BY GOOGLE PLAY</Badge></div>
          <div>Upload Key Expiry: 1,420 Days</div>
        </div>
      </Card>
    </div>
  );
}
