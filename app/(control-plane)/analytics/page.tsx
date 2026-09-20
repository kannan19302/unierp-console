"use client";

/**
 * PCC-16: Platform Intelligence & Analytics
 *
 * Visual dashboard composer with multi-type widget layout designer,
 * recurring report scheduler with multi-format generation (PDF/CSV/Excel),
 * and platform anomaly detection telemetry.
 */

import React, { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  AlertTriangle,
  Layers,
  DollarSign,
  TrendingDown,
  Users,
} from "lucide-react";
import { StatCardRow, type StatCardItem } from "@kannan19302/ui";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";
import styles from "./analytics.module.css";
import type { CustomDashboard, ReportSchedule, AnomalyAlert } from "@/lib/analytics-schema";
import {
  INITIAL_DASHBOARDS,
  INITIAL_SCHEDULES,
  INITIAL_ANOMALIES,
} from "@/lib/fixtures/analytics";
import {
  DashboardComposer,
  ReportScheduler,
  AnalyticsMetricsTab,
  AnalyticsModals,
} from "./_components";

type TabKey = "overview" | "composer" | "scheduler" | "metrics";

export default function AnalyticsPlatformOverview() {
  const [activeTab, setActiveTab] = useState<TabKey>("composer");

  // State: Dashboard Composer (EC-16.1)
  const [dashboards, setDashboards] = useState<CustomDashboard[]>(INITIAL_DASHBOARDS);
  const [selectedDashboard, setSelectedDashboard] = useState<CustomDashboard>(INITIAL_DASHBOARDS[0]);
  const [isNewDashboardOpen, setIsNewDashboardOpen] = useState(false);

  // State: Report Scheduler (EC-16.2)
  const [schedules, setSchedules] = useState<ReportSchedule[]>(INITIAL_SCHEDULES);
  const [isNewScheduleOpen, setIsNewScheduleOpen] = useState(false);

  // State: Anomaly Alerts & Platform Metrics
  const [anomalies] = useState<AnomalyAlert[]>(INITIAL_ANOMALIES);

  // --- Handlers: Dashboard Composer (EC-16.1) ---

  const handleDashboardCreated = (created: CustomDashboard) => {
    setDashboards((prev) => [created, ...prev]);
    setSelectedDashboard(created);
    setIsNewDashboardOpen(false);
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    try {
      await api.del(`/platform/v1/analytics/dashboards/${dashboardId}`);
    } catch {
      // optimistic fallback
    }
    const remaining = dashboards.filter((d) => d.id !== dashboardId);
    setDashboards(remaining);
    if (selectedDashboard.id === dashboardId && remaining.length > 0) {
      setSelectedDashboard(remaining[0]);
    }
  };

  // --- Handlers: Report Scheduler (EC-16.2) ---

  const handleScheduleCreated = (created: ReportSchedule) => {
    setSchedules((prev) => [created, ...prev]);
    setIsNewScheduleOpen(false);
  };

  const handleToggleSchedule = async (scheduleId: string) => {
    try {
      await api.post(`/platform/v1/analytics/report-schedules/${scheduleId}/toggle`, {});
    } catch {
      // optimistic fallback
    }
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? { ...s, status: s.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }
          : s
      )
    );
  };

  const handleRunScheduleNow = async (scheduleId: string) => {
    try {
      await api.post(`/platform/v1/analytics/report-schedules/${scheduleId}/run-now`, {});
    } catch {
      // optimistic fallback
    }
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId ? { ...s, lastRunAt: new Date().toISOString() } : s
      )
    );
  };

  // Top summary stats
  const stats: StatCardItem[] = [
    { label: "Current SaaS MRR", value: "$184,250", icon: <DollarSign size={18} /> },
    { label: "Logo Churn Rate", value: "1.2%", icon: <TrendingDown size={18} /> },
    { label: "Seat Utilization", value: "84.6%", icon: <Users size={18} /> },
    { label: "Active Anomaly Alerts", value: anomalies.length, icon: <AlertTriangle size={18} /> },
  ];

  return (
    <DomainShell
      domainId="analytics"
      title="Platform Intelligence & Analytics"
      description="PCC-16: Custom multi-widget dashboard composer, recurring automated report scheduler with PDF/CSV/Excel dispatch, and anomaly telemetry."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        {/* Navigation Tabs */}
        <div className={styles.tabBar} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === "composer"}
            className={`${styles.tabButton} ${activeTab === "composer" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("composer")}
          >
            <LayoutDashboard size={16} />
            Dashboard Composer ({dashboards.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "scheduler"}
            className={`${styles.tabButton} ${activeTab === "scheduler" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("scheduler")}
          >
            <Calendar size={16} />
            Report Scheduler ({schedules.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`${styles.tabButton} ${activeTab === "overview" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <AlertTriangle size={16} />
            Anomaly Radar ({anomalies.length})
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "metrics"}
            className={`${styles.tabButton} ${activeTab === "metrics" ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab("metrics")}
          >
            <Layers size={16} />
            Metric Catalog
          </button>
        </div>

        {/* TAB 1: DASHBOARD COMPOSER (EC-16.1) */}
        {activeTab === "composer" && (
          <DashboardComposer
            dashboards={dashboards}
            selectedDashboard={selectedDashboard}
            onSelectDashboard={setSelectedDashboard}
            onDeleteDashboard={handleDeleteDashboard}
            onOpenNewDashboard={() => setIsNewDashboardOpen(true)}
          />
        )}

        {/* TAB 2: REPORT SCHEDULER (EC-16.2) */}
        {activeTab === "scheduler" && (
          <ReportScheduler
            schedules={schedules}
            onOpenNewSchedule={() => setIsNewScheduleOpen(true)}
            onRunScheduleNow={handleRunScheduleNow}
            onToggleSchedule={handleToggleSchedule}
          />
        )}

        {/* TAB 3: ANOMALY RADAR & TAB 4: METRIC CATALOG */}
        {(activeTab === "overview" || activeTab === "metrics") && (
          <AnalyticsMetricsTab
            activeTab={activeTab}
            anomalies={anomalies}
          />
        )}
      </div>

      <AnalyticsModals
        isNewDashboardOpen={isNewDashboardOpen}
        onCloseNewDashboard={() => setIsNewDashboardOpen(false)}
        onDashboardCreated={handleDashboardCreated}
        isNewScheduleOpen={isNewScheduleOpen}
        onCloseNewSchedule={() => setIsNewScheduleOpen(false)}
        onScheduleCreated={handleScheduleCreated}
      />
    </DomainShell>
  );
}