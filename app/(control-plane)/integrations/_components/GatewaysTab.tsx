"use client";

import { Card, EmptyState, Badge, Button } from "@kannan19302/ui";
import styles from "../integrations.module.css";

interface GatewaysTabProps {
  installedApps: Record<string, unknown>[];
  onInspectHealth: () => void;
}

export function GatewaysTab({ installedApps, onInspectHealth }: GatewaysTabProps) {
  return (
    <Card padding="none">
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Installed Extension</th>
              <th className={styles.th}>App ID</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {installedApps.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "var(--space-8)", textAlign: "center" }}>
                  <EmptyState title="No platform extensions found" description="Installed marketplace extensions will show here." />
                </td>
              </tr>
            ) : (
              installedApps.map((app, idx) => (
                <tr key={idx} className={styles.tr}>
                  <td className={styles.td}>
                    <span style={{ fontWeight: 600 }}>{String(app.appSlug ?? "extension-app")}</span>
                  </td>
                  <td className={styles.td}>
                    <code className={styles.monoBadge}>{String(app.appId ?? "app-id")}</code>
                  </td>
                  <td className={styles.td}>
                    <Badge variant={app.status === "ACTIVE" ? "success" : "default"}>
                      {String(app.status ?? "ACTIVE")}
                    </Badge>
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <Button variant="outline" size="sm" onClick={onInspectHealth}>
                      Inspect Health
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
