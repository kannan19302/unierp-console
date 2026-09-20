"use client";

import React from "react";
import { Download, Trash2, Plus, LineChart, BarChart3, Table } from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../analytics.module.css";
import type { CustomDashboard } from "@/lib/analytics-schema";

interface DashboardComposerProps {
  dashboards: CustomDashboard[];
  selectedDashboard: CustomDashboard;
  onSelectDashboard: (dashboard: CustomDashboard) => void;
  onDeleteDashboard: (id: string) => void;
  onOpenNewDashboard: () => void;
}

export default function DashboardComposer({
  dashboards,
  selectedDashboard,
  onSelectDashboard,
  onDeleteDashboard,
  onOpenNewDashboard,
}: DashboardComposerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.composerToolbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
          <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>Active Layout:</span>
          <select
            value={selectedDashboard.id}
            onChange={(e) => {
              const d = dashboards.find((item) => item.id === e.target.value);
              if (d) onSelectDashboard(d);
            }}
            className={styles.formSelect}
            style={{ width: "auto" }}
          >
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.category})
              </option>
            ))}
          </select>
          <Badge variant="info">{selectedDashboard.widgets.length} Widgets</Badge>
        </div>

        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button variant="outline" size="sm" onClick={() => alert(JSON.stringify(selectedDashboard, null, 2))}>
            <Download size={14} style={{ marginRight: "var(--space-1)" }} />
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDeleteDashboard(selectedDashboard.id)}
            disabled={dashboards.length <= 1}
          >
            <Trash2 size={14} style={{ marginRight: "var(--space-1)" }} />
            Delete Dashboard
          </Button>
          <Button variant="primary" size="sm" onClick={onOpenNewDashboard}>
            <Plus size={14} style={{ marginRight: "var(--space-1)" }} />
            New Custom Dashboard
          </Button>
        </div>
      </div>

      {/* Live Composed Widget Grid (EC-16.1) */}
      <div className={styles.widgetGrid}>
        {selectedDashboard.widgets.map((widget) => (
          <div
            key={widget.id}
            className={`${styles.widgetCard} ${
              widget.gridSpan === 4
                ? styles.span4
                : widget.gridSpan === 3
                ? styles.span3
                : widget.gridSpan === 2
                ? styles.span2
                : styles.span1
            }`}
          >
            <div className={styles.widgetHeader}>
              <h4 className={styles.widgetTitle}>{widget.title}</h4>
              <span className={styles.monoBadge}>{widget.type}</span>
            </div>

            {widget.type === "KPI_CARD" && (
              <div>
                <div style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--color-primary)" }}>
                  {widget.metric === "MRR"
                    ? "$184,250"
                    : widget.metric === "CHURN_RATE"
                    ? "1.2%"
                    : widget.metric === "SEAT_UTILIZATION"
                    ? "84.6%"
                    : widget.metric === "ACTIVE_TENANTS"
                    ? "142"
                    : widget.metric === "API_LATENCY"
                    ? "124ms"
                    : widget.metric === "ERROR_RATE"
                    ? "0.02%"
                    : "$42,500"}
                </div>
                <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Metric: {widget.metric} • Span: {widget.gridSpan} col
                </span>
              </div>
            )}

            {widget.type === "LINE_CHART" && (
              <div className={styles.chartPlaceholder}>
                <LineChart size={28} color="var(--color-primary)" />
                <span>Line Chart Visualization • {widget.metric} (12 Periods)</span>
              </div>
            )}

            {widget.type === "BAR_CHART" && (
              <div className={styles.chartPlaceholder}>
                <BarChart3 size={28} color="var(--color-primary)" />
                <span>Bar Chart Breakdown • {widget.metric} by Cohort / Region</span>
              </div>
            )}

            {widget.type === "DATA_TABLE" && (
              <div className={styles.chartPlaceholder}>
                <Table size={28} color="var(--color-primary)" />
                <span>Tabular High-Density Matrix • {widget.metric}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
