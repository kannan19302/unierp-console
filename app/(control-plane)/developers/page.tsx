"use client";
/**
 * Developers → Operations & Ecosystem Management (PCC-14).
 * Enterprise control plane for developer applications, OAuth credentials,
 * isolated sandbox provisioning with data presets & TTL, and multi-language SDK distribution.
 */
import React, { useState, useTransition } from "react";
import {
  Activity,
  Braces,
  Code2,
  Shield,
  Layers,
  Box,
  Download,
  Server,
} from "lucide-react";
import {
  StatCardRow,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import {
  AVAILABLE_SCOPES,
  type DeveloperApp,
  type SandboxEnvironment,
  type SdkPackage,
} from "@/lib/developer-schema";
import {
  INITIAL_APPS,
  INITIAL_SANDBOXES,
  INITIAL_SDKS,
} from "@/lib/fixtures/developers";
import {
  AppRegistrationWizard,
  SandboxManager,
  SdkRegistry,
  DeveloperOverview,
} from "./_components";
import styles from "./developers.module.css";

type TabKey = "overview" | "apps" | "sandboxes" | "sdks";

export default function DevelopersOverview() {
  const [activeTab, setActiveTab] = useState<TabKey>("apps");
  const [, startTransition] = useTransition();

  // Overview Data
  const endpoints = useList<Record<string, unknown>>({ path: "/api-platform" });
  const webhooks = useList<Record<string, unknown>>({ path: "/saas/webhooks" });
  const apiKeys = useList<Record<string, unknown>>({ path: "/saas/api-keys" });

  // Apps State (EC-14.1)
  const [apps, setApps] = useState<DeveloperApp[]>(INITIAL_APPS);

  // Sandboxes State (EC-14.2)
  const [sandboxes, setSandboxes] = useState<SandboxEnvironment[]>(INITIAL_SANDBOXES);

  // SDKs State (EC-14.3)
  const [sdks, setSdks] = useState<SdkPackage[]>(INITIAL_SDKS);

  const stats: StatCardItem[] = [
    { label: "Active Apps", value: apps.filter((a) => a?.status === "ACTIVE").length, icon: <Code2 size={18} /> },
    { label: "Sandboxes", value: sandboxes.filter(Boolean).length, icon: <Server size={18} /> },
    { label: "SDK Downloads", value: sdks.reduce((acc, s) => acc + (s?.downloadCount || 0), 0).toLocaleString(), icon: <Download size={18} /> },
    { label: "Registered Scopes", value: AVAILABLE_SCOPES.length, icon: <Shield size={18} /> },
    { label: "API Endpoints", value: endpoints.data.length || 38, icon: <Braces size={18} /> },
  ];

  return (
    <DomainShell
      domainId="developers"
      title="Developer & Ecosystem Operations"
      description="PCC-14: OAuth application lifecycle, isolated sandbox provisioning, and multi-language SDK distribution registry."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={5} />

        {/* Navigation Tabs */}
        <div className={styles.tabBar} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "apps"}
            className={`${styles.tabButton} ${activeTab === "apps" ? styles.tabButtonActive : ""}`}
            onClick={() => startTransition(() => setActiveTab("apps"))}
          >
            <Code2 size={16} />
            OAuth Applications ({apps.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "sandboxes"}
            className={`${styles.tabButton} ${activeTab === "sandboxes" ? styles.tabButtonActive : ""}`}
            onClick={() => startTransition(() => setActiveTab("sandboxes"))}
          >
            <Layers size={16} />
            Developer Sandboxes ({sandboxes.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "sdks"}
            className={`${styles.tabButton} ${activeTab === "sdks" ? styles.tabButtonActive : ""}`}
            onClick={() => startTransition(() => setActiveTab("sdks"))}
          >
            <Box size={16} />
            SDK Packages ({sdks.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabButtonActive : ""}`}
            onClick={() => startTransition(() => setActiveTab("overview"))}
          >
            <Activity size={16} />
            Platform Telemetry
          </button>
        </div>

        {/* TAB 1: OAUTH APPLICATIONS (EC-14.1) */}
        {activeTab === "apps" && <AppRegistrationWizard apps={apps} setApps={setApps} />}

        {/* TAB 2: DEVELOPER SANDBOXES (EC-14.2) */}
        {activeTab === "sandboxes" && <SandboxManager sandboxes={sandboxes} setSandboxes={setSandboxes} />}

        {/* TAB 3: SDK PACKAGES & COVERAGE (EC-14.3) */}
        {activeTab === "sdks" && <SdkRegistry sdks={sdks} setSdks={setSdks} />}

        {/* TAB 4: PLATFORM TELEMETRY */}
        {activeTab === "overview" && (
          <DeveloperOverview endpoints={endpoints} webhooks={webhooks} apiKeys={apiKeys} />
        )}
      </div>
    </DomainShell>
  );
}