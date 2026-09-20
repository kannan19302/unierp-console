"use client";

import React from "react";
import {
  DashboardKPICard,
  ActivityFeed,
  type ActivityItem,
} from "@kannan19302/ui/dashboard";
import { Users, Server, Shield, Zap } from "lucide-react";
import styles from "./DomainDashboardComposite.module.css";

export interface DashboardMetricItem {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  iconType?: "users" | "server" | "shield" | "zap";
  trend?: number[];
}

export interface DomainDashboardCompositeProps {
  metrics?: DashboardMetricItem[];
  activities?: ActivityItem[];
  className?: string;
}

export function DomainDashboardComposite({
  metrics,
  activities,
  className = "",
}: DomainDashboardCompositeProps) {
  const defaultMetrics: DashboardMetricItem[] = metrics || [
    {
      title: "Active Tenants",
      value: "142",
      change: 8.4,
      changeLabel: "vs last month",
      iconType: "users",
      trend: [110, 118, 125, 130, 136, 142],
    },
    {
      title: "PCC Fleet Health",
      value: "99.98%",
      change: 0.02,
      changeLabel: "SLO met",
      iconType: "server",
      trend: [99.9, 99.95, 99.98, 99.98, 99.99, 99.98],
    },
    {
      title: "Threat Mitigations",
      value: "2,840",
      change: -14.2,
      changeLabel: "blocked anomalies",
      iconType: "shield",
      trend: [3400, 3100, 2950, 2840],
    },
    {
      title: "Edge API Ingress",
      value: "4.8M / hr",
      change: 12.1,
      changeLabel: "requests",
      iconType: "zap",
      trend: [3.8, 4.1, 4.4, 4.8],
    },
  ];

  const defaultActivities: ActivityItem[] = activities || [
    {
      id: "act-1",
      actor: { id: "u-1", name: "Jane Doe", initials: "JD", role: "SecOps" },
      action: "UPDATE",
      entityType: "Tenant",
      entityId: "acme-corp",
      summary: "Updated tenant tier to Enterprise and scaled cluster nodes",
      timestamp: "10m ago",
    },
    {
      id: "act-2",
      actor: { id: "u-2", name: "Alex Turing", initials: "AT", role: "Infra" },
      action: "CREATE",
      entityType: "SigningKey",
      entityId: "key-2026-q3",
      summary: "Generated and enrolled Ed25519 platform root signing key",
      timestamp: "1h ago",
    },
  ];

  const renderIcon = (type?: string) => {
    switch (type) {
      case "users":
        return <Users size={16} />;
      case "server":
        return <Server size={16} />;
      case "shield":
        return <Shield size={16} />;
      default:
        return <Zap size={16} />;
    }
  };

  return (
    <div className={`${styles.compositeWrapper} ${className}`}>
      <div className={styles.dashboardGrid}>
        {defaultMetrics.map((m, idx) => (
          <DashboardKPICard
            key={idx}
            title={m.title}
            value={m.value}
            change={m.change}
            changeLabel={m.changeLabel}
            icon={renderIcon(m.iconType)}
            trend={m.trend}
          />
        ))}
      </div>

      <ActivityFeed items={defaultActivities} title="Platform Activity Stream" />
    </div>
  );
}
