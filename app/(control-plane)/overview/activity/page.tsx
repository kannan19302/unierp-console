"use client";
/**
 * Overview → Activity.
 * Cross-tenant provider activity feed from the real admin activity endpoint.
 */
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";

interface ActivityRow {
  id?: string;
  actor?: string;
  action?: string;
  resource?: string;
  tenant?: string;
  timestamp?: string;
  createdAt?: string;
}

export default function OverviewActivity() {
  const feed = useList<ActivityRow>({ path: "/admin/activity-feed" });

  const stats: StatCardItem[] = [
    { label: "Events", value: feed.total ?? feed.data.length },
    { label: "Unique actors", value: new Set(feed.data.map((d) => d.actor ?? "")).size || "—" },
  ];

  if (feed.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div>
        <h2 style={{ fontSize: "var(--text-xl)", fontWeight: 700, margin: 0 }}>Activity</h2>
        <p style={{ color: "var(--color-text-secondary)", margin: "var(--space-1) 0 0" }}>
          Provider-side activity across all tenants.
        </p>
      </div>

      <StatCardRow stats={stats} columns={2} />

      <Card padding="md">
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Recent activity</h3>
        {feed.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>{feed.error.message}</p>
        ) : feed.data.length === 0 ? (
          <EmptyState title="No activity recorded" description="The activity feed returned no rows." />
        ) : (
          <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
            {feed.data.slice(0, 30).map((a) => (
              <li
                key={a.id ?? `${a.actor}-${a.timestamp ?? a.createdAt}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "var(--space-2) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 500 }}>{a.action ?? a.resource ?? "activity"}</span>
                  {a.tenant ? <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}> · {a.tenant}</span> : null}
                </span>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                  {a.actor ?? "System"} · {a.timestamp ?? a.createdAt ?? ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}