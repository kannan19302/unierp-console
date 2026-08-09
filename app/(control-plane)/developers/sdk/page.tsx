"use client";
/**
 * Developers → SDKs.
 * SDK distribution and language coverage read from the builder analytics and
 * builder stats endpoints.
 */
import { Download, Languages, GitBranch, Package } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface SdkBreakdown {
  name?: string;
  language?: string;
  platform?: string;
  downloads?: number;
  version?: string;
}

export default function DevelopersSdk() {
  const analytics = useItem<Record<string, unknown>>("/builder/enterprise/builder-analytics");
  const stats = useItem<Record<string, unknown>>("/builder/stats");

  const a = analytics.data ?? {};
  const s = stats.data ?? {};

  const downloads = numValue(a.downloads, a.totalDownloads, s.sdkDownloads) ?? 0;
  const activeDevs = numValue(a.activeDevelopers, a.developers, s.activeDevelopers) ?? 0;
  const languages = numValue(a.languages, a.sdkLanguages, s.sdkLanguages) ?? 0;

  const breakdown: SdkBreakdown[] = Array.isArray(a.sdks)
    ? (a.sdks as SdkBreakdown[])
    : Array.isArray(a.languageBreakdown)
    ? (a.languageBreakdown as SdkBreakdown[])
    : Array.isArray(s.sdks)
    ? (s.sdks as SdkBreakdown[])
    : [];

  const statsCards: StatCardItem[] = [
    { label: "SDK downloads", value: downloads, icon: <Download size={18} /> },
    { label: "Languages", value: languages || breakdown.length || "—", icon: <Package size={18} /> },
    { label: "Active developers", value: activeDevs, icon: <GitBranch size={18} /> },
    { label: "SDK packages", value: breakdown.length || "—", icon: <Package size={18} /> },
  ];

  if (analytics.loading || stats.loading) {
    return (
      <DomainShell domainId="developers" title="SDKs" description="SDK distribution and coverage analytics.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="developers" title="SDKs" description="SDK distribution and coverage analytics.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={statsCards} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>SDK coverage</h3>
          {analytics.error && stats.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-2) 0 0" }}>
              {analytics.error.message}
            </p>
          ) : breakdown.length === 0 ? (
            <EmptyState title="No SDK coverage rows" description="The builder analytics returned no SDK breakdown." />
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {breakdown.slice(0, 30).map((b, i) => (
                <li
                  key={b.name ?? b.language ?? `${b.platform}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "var(--space-3)",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{b.name ?? b.language ?? b.platform ?? "—"}</span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", flexShrink: 0 }}>
                    {b.version ? <Badge variant="info">v{b.version}</Badge> : null}
                    {b.downloads != null ? (
                      <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        {b.downloads.toLocaleString()} downloads
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}

function numValue(...values: unknown[]): number | undefined {
  return values.find((v) => typeof v === "number") as number | undefined;
}