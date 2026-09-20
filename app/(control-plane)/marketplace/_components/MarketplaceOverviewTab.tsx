"use client";

import { Card, EmptyState, Badge, Button } from "@kannan19302/ui";
import styles from "../marketplace.module.css";

interface MarketplaceOverviewTabProps {
  extensions: Record<string, unknown>[];
  onManageVersions: (appSlug: string) => void;
}

export function MarketplaceOverviewTab({
  extensions,
  onManageVersions,
}: MarketplaceOverviewTabProps) {
  return (
    <Card padding="none">
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Extension App Slug</th>
              <th className={styles.th}>Platform App ID</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th} style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {extensions.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: "var(--space-8)", textAlign: "center" }}>
                  <EmptyState title="No extensions installed" description="Extensions will appear here once tenants install them." />
                </td>
              </tr>
            ) : (
              extensions.map((ext, idx) => (
                <tr key={idx} className={styles.tr}>
                  <td className={styles.td}>
                    <span style={{ fontWeight: 600 }}>{String(ext.appSlug ?? "extension-slug")}</span>
                  </td>
                  <td className={styles.td}>
                    <code className={styles.monoBadge}>{String(ext.appId ?? "app-id")}</code>
                  </td>
                  <td className={styles.td}>
                    <Badge variant={ext.status === "ACTIVE" ? "success" : "default"}>
                      {String(ext.status ?? "ACTIVE")}
                    </Badge>
                  </td>
                  <td className={styles.td} style={{ textAlign: "right" }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onManageVersions(String(ext.appSlug))}
                    >
                      Manage Versions
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
