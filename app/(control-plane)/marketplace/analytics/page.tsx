"use client";
import { useState, useEffect, useCallback } from "react";
import { PageHeader, DataTable, Card } from "@unerp/ui";
import { RouteGuard } from "@unerp/framework";
import type { Column } from "@unerp/ui";

interface AnalyticsRecord {
  id: string;
  appId: string;
  date: string;
  installs: number;
  uninstalls: number;
  activeUsers: number;
  revenue: number;
}
interface AnalyticsResponse {
  items: AnalyticsRecord[];
  totals: { installs: number; uninstalls: number; revenue: number };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    const res = await fetch("/api/v1/marketplace/analytics?top=50");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const columns: Column<AnalyticsRecord>[] = [
    { key: "appId", header: "App ID", render: (r) => r.appId },
    {
      key: "date",
      header: "Date",
      render: (r) => new Date(r.date).toLocaleDateString(),
    },
    { key: "installs", header: "Installs", render: (r) => r.installs },
    { key: "uninstalls", header: "Uninstalls", render: (r) => r.uninstalls },
    {
      key: "activeUsers",
      header: "Active Users",
      render: (r) => r.activeUsers,
    },
    {
      key: "revenue",
      header: "Revenue",
      render: (r) => `$${r.revenue.toFixed(2)}`,
    },
  ];

  return (
    <RouteGuard permission="marketplace.analytics.read">
      <div className="ui-stack-6">
        <PageHeader
          title="Marketplace Analytics"
          description="Install trends, top apps, and revenue data."
          breadcrumbs={[
            { label: "Apps", href: "/apps" },
            { label: "Marketplace", href: "/marketplace" },
            { label: "Analytics" },
          ]}
        />
        <div className="ui-grid-3">
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Installs
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {data?.totals.installs ?? 0}
              </h3>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Uninstalls
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {data?.totals.uninstalls ?? 0}
              </h3>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </p>
              <h3 className="text-2xl font-bold mt-1">
                ${(data?.totals.revenue ?? 0).toFixed(2)}
              </h3>
            </div>
          </Card>
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
        />
      </div>
    </RouteGuard>
  );
}
