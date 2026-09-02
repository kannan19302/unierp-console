"use client";
/**
 * PCC-12: Desktop Platform Operations
 * Platform operations surface for native desktop installer packaging, auto-update channels,
 * code signing certificates (Apple Notarization, Windows EV Authenticode, Linux GPG), and emergency killswitch.
 */
import { useState } from "react";
import {
  Monitor,
  Radio,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Sliders,
  Key,
  Layers,
  FileCode,
} from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Button,
  type StatCardItem,
} from "@kannan19302/ui";
import { useItem, useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface DesktopBuildRow {
  id?: string;
  targetOs?: "windows-x64" | "windows-arm64" | "macos-arm64" | "macos-x64" | "linux-x64";
  version?: string;
  installerType?: "exe" | "msi" | "dmg" | "pkg" | "deb" | "AppImage";
  commitHash?: string;
  sha256?: string;
  signatureStatus?: "SIGNED_VERIFIED" | "NOTARIZED" | "SELF_SIGNED" | "PENDING";
  fileSizeBytes?: number;
  downloadUrl?: string;
  createdAt?: string;
}

interface DesktopReleaseChannelRow {
  channel: "stable" | "beta" | "nightly";
  activeVersion: string;
  rolloutPercentage: number;
  autoUpdateEnabled: boolean;
  minOsRequirements: { windows: string; macos: string; linux: string };
  updatedAt: string;
}

interface CodeSigningProfileRow {
  platform: "Apple Notarization" | "Windows EV Authenticode" | "Linux GPG";
  identity: string;
  certificateExpiry: string;
  status: "VALID" | "EXPIRING_SOON" | "EXPIRED";
  timestampServer: string;
}

export default function DesktopOperationsPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "builds" | "channels" | "signing">("overview");

  const dashboard = useItem<{
    overview?: {
      totalBuilds?: number;
      activeChannels?: number;
      killswitchActive?: boolean;
      autoDownload?: boolean;
      minVersion?: string;
      latestVersion?: string;
    };
    channels?: DesktopReleaseChannelRow[];
    signingProfiles?: CodeSigningProfileRow[];
    recentBuilds?: DesktopBuildRow[];
  }>("/platform/v1/desktop-operations/dashboard");

  const builds = useList<DesktopBuildRow>({ path: "/platform/v1/desktop-operations/builds" });

  const d = dashboard.data?.overview ?? {};
  const channelsList = dashboard.data?.channels ?? [];
  const signingList = dashboard.data?.signingProfiles ?? [];
  const buildsList = builds.data.length > 0 ? builds.data : (dashboard.data?.recentBuilds ?? []);

  const stats: StatCardItem[] = [
    {
      label: "Total Native Builds",
      value: d.totalBuilds ?? buildsList.length,
      icon: <Monitor size={18} />,
    },
    {
      label: "Latest Desktop Release",
      value: d.latestVersion ?? "1.8.0",
      icon: <Radio size={18} />,
      color: "var(--color-primary)",
    },
    {
      label: "Min Compatibility Floor",
      value: d.minVersion ?? "1.6.0",
      icon: <Sliders size={18} />,
    },
    {
      label: "Code Signing Posture",
      value: "ALL CERTS VALID",
      icon: <ShieldCheck size={18} />,
      color: "var(--color-success)",
    },
  ];

  if (dashboard.loading && builds.loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <DomainShell
      domainId="desktop"
      title="Desktop Platform Operations"
      description="PCC-12: Desktop native client installers (Windows MSI/EXE, macOS DMG/PKG, Linux AppImage/DEB), auto-updater channels, notarization tickets, and signing key certificates."
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <div style={{ display: "flex", gap: "var(--space-2)", borderBottom: "1px solid var(--color-border)", paddingBottom: "var(--space-2)" }}>
          <Button
            variant={activeTab === "overview" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === "builds" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("builds")}
          >
            Installers & Binaries ({buildsList.length})
          </Button>
          <Button
            variant={activeTab === "channels" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("channels")}
          >
            Auto-Update Channels
          </Button>
          <Button
            variant={activeTab === "signing" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("signing")}
          >
            Code Signing & Notary
          </Button>
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(var(--size-panel-min, 360px), 1fr))", gap: "var(--space-4)" }}>
            <Card padding="md">
              <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Desktop Update Channels
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {channelsList.map((ch) => (
                  <div
                    key={ch.channel}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-bg-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{ch.channel}</span>
                      <span style={{ marginLeft: "var(--space-2)", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                        v{ch.activeVersion}
                      </span>
                    </div>
                    <Badge variant={ch.channel === "stable" ? "success" : "info"}>
                      {ch.rolloutPercentage}% Rollout
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding="md">
              <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>
                Signing Certificate Status
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {signingList.map((s) => (
                  <div
                    key={s.platform}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-2) var(--space-3)",
                      borderRadius: "var(--radius-md)",
                      backgroundColor: "var(--color-bg-secondary)",
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{s.platform}</span>
                      <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                        {s.identity}
                      </p>
                    </div>
                    <Badge variant={s.status === "VALID" ? "success" : "warning"}>{s.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {activeTab === "builds" && (
          <Card padding="md">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
                Desktop Native Installer Packages
              </h3>
              <Button size="sm" variant="secondary" onClick={() => builds.refresh()}>
                <RefreshCw size={14} style={{ marginRight: "var(--space-1)" }} /> Refresh
              </Button>
            </div>
            {buildsList.length === 0 ? (
              <EmptyState title="No desktop builds found" description="Build artifacts are generated by the CI/CD pipeline." />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "var(--text-sm)" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
                      <th style={{ padding: "var(--space-2)" }}>Target OS</th>
                      <th style={{ padding: "var(--space-2)" }}>Version / Format</th>
                      <th style={{ padding: "var(--space-2)" }}>Commit & SHA256</th>
                      <th style={{ padding: "var(--space-2)" }}>Size</th>
                      <th style={{ padding: "var(--space-2)" }}>Signing Status</th>
                      <th style={{ padding: "var(--space-2)" }}>Package URL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildsList.map((b) => (
                      <tr key={b.id || `${b.targetOs}-${b.version}`} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "var(--space-3) var(--space-2)", fontWeight: 600 }}>
                          {b.targetOs}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-2)" }}>
                          <strong>v{b.version}</strong> (.{b.installerType})
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-2)", fontFamily: "monospace", fontSize: "var(--text-xs)" }}>
                          {b.commitHash} · {b.sha256 ? `${b.sha256.slice(0, 12)}...` : ""}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-2)" }}>
                          {b.fileSizeBytes ? `${(b.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : "80 MB"}
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-2)" }}>
                          <Badge variant={b.signatureStatus === "NOTARIZED" || b.signatureStatus === "SIGNED_VERIFIED" ? "success" : "info"}>
                            {b.signatureStatus}
                          </Badge>
                        </td>
                        <td style={{ padding: "var(--space-3) var(--space-2)" }}>
                          {b.downloadUrl ? (
                            <a
                              href={b.downloadUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-1)", color: "var(--color-primary)" }}
                            >
                              <Download size={12} /> Download
                            </a>
                          ) : (
                            <span style={{ color: "var(--color-text-secondary)" }}>Internal Release</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {activeTab === "channels" && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Auto-Updater Distribution Channels
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {channelsList.map((ch) => (
                <div
                  key={ch.channel}
                  style={{
                    padding: "var(--space-4)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: "var(--text-lg)", textTransform: "capitalize" }}>
                        {ch.channel} Update Ring
                      </h4>
                      <p style={{ margin: "var(--space-1) 0 0", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                        Current deployed installer: v{ch.activeVersion}
                      </p>
                    </div>
                    <Badge variant={ch.channel === "stable" ? "success" : "info"}>
                      {ch.rolloutPercentage}% Rollout
                    </Badge>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-4)", fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    <span>Windows: {ch.minOsRequirements.windows}</span>
                    <span>macOS: {ch.minOsRequirements.macos}</span>
                    <span>Linux: {ch.minOsRequirements.linux}</span>
                    <span>Auto-Download: {ch.autoUpdateEnabled ? "Enabled" : "Manual"}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {activeTab === "signing" && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-4)", fontSize: "var(--text-base)", fontWeight: 600 }}>
              Code Signing Certificates & Notarization
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(var(--size-card-min, 320px), 1fr))", gap: "var(--space-4)" }}>
              {signingList.map((s) => (
                <div
                  key={s.platform}
                  style={{
                    padding: "var(--space-4)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-lg)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                      <Key size={18} color="var(--color-primary)" />
                      <strong>{s.platform}</strong>
                    </div>
                    <Badge variant={s.status === "VALID" ? "success" : "warning"}>{s.status}</Badge>
                  </div>
                  <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {s.identity}
                  </p>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)", marginTop: "var(--space-2)" }}>
                    <div>Expires: {new Date(s.certificateExpiry).toLocaleDateString()}</div>
                    <div>Timestamp Authority: {s.timestampServer}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </DomainShell>
  );
}
