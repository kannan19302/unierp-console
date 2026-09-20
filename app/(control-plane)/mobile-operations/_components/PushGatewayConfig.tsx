"use client";

import { Bell, Key } from "lucide-react";
import { Badge, Button, Card } from "@kannan19302/ui";
import styles from "../mobile.module.css";
import type { PushProviderBinding } from "@/lib/mobile-schema";

interface PushGatewayConfigProps {
  pushList: PushProviderBinding[];
  canManageMobile: boolean;
  testingPush: boolean;
  pushResult: string | null;
  onOpenPushConfig: (provider?: "APNs" | "FCM") => void;
  onTestPush: (provider: "FCM" | "APNs") => Promise<void>;
}

export function PushGatewayConfig({
  pushList,
  canManageMobile,
  testingPush,
  pushResult,
  onOpenPushConfig,
  onTestPush,
}: PushGatewayConfigProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Push Gateway Provider Integration (APNs & FCM)
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            High-throughput push notification gateways for transactional alerts, mobile approvals, and MFA prompts.
          </p>
        </div>
        {canManageMobile && (
          <Button size="sm" variant="primary" onClick={() => onOpenPushConfig()}>
            <Key size={14} />
            Configure Gateway Keys
          </Button>
        )}
      </div>

      {pushResult && (
        <div
          style={{
            padding: "var(--space-3) var(--space-4)",
            background: "var(--color-surface-selected)",
            border: "0.0625rem solid var(--color-primary)",
            borderRadius: "var(--radius-md)",
            fontSize: "var(--text-sm)",
            color: "var(--color-text)",
          }}
        >
          {pushResult}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "var(--space-4)" }}>
        {pushList.map((p) => (
          <Card key={p.provider} padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                <Bell size={18} color="var(--color-primary)" />
                <strong>{p.provider} Push Gateway</strong>
              </div>
              <Badge variant={p.status === "HEALTHY" ? "success" : "danger"}>
                {p.status}
              </Badge>
            </div>

            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <div>Environment: <strong>{p.environment.toUpperCase()}</strong></div>
              <div>Signing Key ID: <span className={styles.monoBadge}>{p.keyId || p.projectId || "KEY-CONFIGURED"}</span></div>
              <div>Certificate Expiration: {new Date(p.certificateExpiry).toLocaleDateString()}</div>
              <div>24h Delivery Success: <strong>{p.successRate24h}%</strong></div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-4)" }}>
              <Button
                size="sm"
                variant="outline"
                disabled={testingPush}
                onClick={() => onTestPush(p.provider)}
              >
                {testingPush ? "Dispatching..." : "Dispatch Test Notification"}
              </Button>
              {canManageMobile && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenPushConfig(p.provider)}
                >
                  Edit Keys
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
