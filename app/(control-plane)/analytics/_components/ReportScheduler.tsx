"use client";

import React from "react";
import { Plus, Play, Pause } from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../analytics.module.css";
import type { ReportSchedule } from "@/lib/analytics-schema";

interface ReportSchedulerProps {
  schedules: ReportSchedule[];
  onOpenNewSchedule: () => void;
  onRunScheduleNow: (scheduleId: string) => void;
  onToggleSchedule: (scheduleId: string) => void;
}

export default function ReportScheduler({
  schedules,
  onOpenNewSchedule,
  onRunScheduleNow,
  onToggleSchedule,
}: ReportSchedulerProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            Automated Report Delivery Schedules (EC-16.2)
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Scheduled recurring generation in PDF, CSV, or Excel formats dispatched to executive stakeholders.
          </p>
        </div>
        <Button variant="primary" onClick={onOpenNewSchedule}>
          <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
          New Report Schedule
        </Button>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Schedule Name</th>
              <th className={styles.th}>Frequency</th>
              <th className={styles.th}>Format</th>
              <th className={styles.th}>Recipients</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Next Run</th>
              <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className={styles.tr}>
                <td className={styles.td}>
                  <div style={{ fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    Dashboard Ref: {s.dashboardId || "System Overview"}
                  </div>
                </td>
                <td className={styles.td}>
                  <span className={styles.monoBadge}>{s.frequency}</span>
                </td>
                <td className={styles.td}>
                  <Badge variant="info">{s.format}</Badge>
                </td>
                <td className={styles.td}>
                  <div style={{ fontSize: "var(--text-xs)" }}>
                    {s.recipients.join(", ")}
                  </div>
                </td>
                <td className={styles.td}>
                  <Badge variant={s.status === "ACTIVE" ? "success" : "warning"}>
                    {s.status}
                  </Badge>
                </td>
                <td className={styles.td}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    {new Date(s.nextRunAt).toLocaleDateString()}
                  </span>
                </td>
                <td className={styles.td} style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "var(--space-2)" }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRunScheduleNow(s.id)}
                    >
                      <Play size={12} style={{ marginRight: "var(--space-1)" }} />
                      Run Now
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onToggleSchedule(s.id)}
                    >
                      {s.status === "ACTIVE" ? (
                        <>
                          <Pause size={12} style={{ marginRight: "var(--space-1)" }} />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play size={12} style={{ marginRight: "var(--space-1)" }} />
                          Resume
                        </>
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
