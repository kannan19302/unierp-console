"use client";

import React, { useState } from "react";
import {
  Plus,
  Play,
  Pause,
  X,
} from "lucide-react";
import { Badge, Button } from "@kannan19302/ui";
import styles from "../integrations.module.css";
import type { SyncScheduleJob } from "@/lib/integration-schema";

interface SyncSchedulerProps {
  syncJobs: SyncScheduleJob[];
  onToggleJob: (jobId: string) => Promise<void>;
  onCreateJob: (job: SyncScheduleJob) => void;
}

export function SyncScheduler({
  syncJobs,
  onToggleJob,
  onCreateJob,
}: SyncSchedulerProps) {
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [newJobName, setNewJobName] = useState("");
  const [newJobConnectorId, setNewJobConnectorId] = useState("conn-sfdc");
  const [newJobDirection, setNewJobDirection] = useState<"ONE_WAY" | "BI_DIRECTIONAL">("BI_DIRECTIONAL");
  const [newJobCron, setNewJobCron] = useState("0 */2 * * *");
  const [newJobStrategy, setNewJobStrategy] = useState<"SOURCE_WINS" | "TARGET_WINS" | "MANUAL_REVIEW">("SOURCE_WINS");
  const [newJobBatchSize, setNewJobBatchSize] = useState(500);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobName.trim()) return;

    const newJob: SyncScheduleJob = {
      id: `job-${Date.now()}`,
      connectorId: newJobConnectorId,
      name: newJobName.trim(),
      direction: newJobDirection,
      scheduleCron: newJobCron,
      conflictStrategy: newJobStrategy,
      batchSize: newJobBatchSize,
      status: "ENABLED",
      nextRunAt: new Date(Date.now() + 3600000).toISOString(),
    };

    onCreateJob(newJob);
    setIsNewJobOpen(false);
    setNewJobName("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
            Recurring Synchronization Schedules (EC-20.2)
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Cron recurrence schedules, bi-directional vs one-way pipelines, and automated conflict resolution strategies.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsNewJobOpen(true)}>
          <Plus size={16} style={{ marginRight: "var(--space-2)" }} />
          New Sync Job
        </Button>
      </div>

      <div className={styles.jobGrid}>
        {syncJobs.map((job) => (
          <div key={job.id} className={styles.jobCard}>
            <div className={styles.connectorHeader}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "var(--text-base)" }}>{job.name}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  Bridge: <code className={styles.monoBadge}>{job.connectorId}</code>
                </div>
              </div>
              <Badge variant={job.status === "ENABLED" ? "success" : "warning"}>
                {job.status}
              </Badge>
            </div>

            <div className={styles.metricGrid}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Direction</span>
                <span className={styles.metricValue}>{job.direction.replace(/_/g, " ")}</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Conflict Strategy</span>
                <span className={styles.metricValue}>{job.conflictStrategy.replace(/_/g, " ")}</span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Schedule (Cron)</span>
                <span className={styles.metricValue} style={{ fontFamily: "var(--font-mono, monospace)" }}>
                  {job.scheduleCron}
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>Batch Chunk Size</span>
                <span className={styles.metricValue}>{job.batchSize} records</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "var(--space-2)", borderTop: "0.0625rem solid var(--color-border)" }}>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                Next Run: {new Date(job.nextRunAt).toLocaleTimeString()}
              </span>
              <Button
                variant={job.status === "ENABLED" ? "outline" : "primary"}
                size="sm"
                onClick={() => onToggleJob(job.id)}
              >
                {job.status === "ENABLED" ? (
                  <>
                    <Pause size={14} style={{ marginRight: "var(--space-1)" }} />
                    Pause Job
                  </>
                ) : (
                  <>
                    <Play size={14} style={{ marginRight: "var(--space-1)" }} />
                    Resume Job
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: NEW SYNC JOB (EC-20.2) */}
      {isNewJobOpen && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalContent}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-lg)", fontWeight: 600 }}>
                Create Recurring Sync Schedule Job (EC-20.2)
              </h3>
              <button
                onClick={() => setIsNewJobOpen(false)}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Job Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Inventory Level Sync"
                  value={newJobName}
                  onChange={(e) => setNewJobName(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Connector Bridge *</label>
                  <select
                    value={newJobConnectorId}
                    onChange={(e) => setNewJobConnectorId(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="conn-sfdc">Salesforce CRM</option>
                    <option value="conn-shopify">Shopify Plus</option>
                    <option value="conn-netsuite">Oracle NetSuite</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Sync Direction *</label>
                  <select
                    value={newJobDirection}
                    onChange={(e) => setNewJobDirection(e.target.value as "ONE_WAY" | "BI_DIRECTIONAL")}
                    className={styles.formSelect}
                  >
                    <option value="ONE_WAY">One-Way Ingestion</option>
                    <option value="BI_DIRECTIONAL">Bi-Directional Sync</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Recurrence Schedule (Cron) *</label>
                  <select
                    value={newJobCron}
                    onChange={(e) => setNewJobCron(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="0 * * * *">Every Hour (0 * * * *)</option>
                    <option value="0 */2 * * *">Every 2 Hours (0 */2 * * *)</option>
                    <option value="0 */6 * * *">Every 6 Hours (0 */6 * * *)</option>
                    <option value="0 0 * * *">Daily at Midnight (0 0 * * *)</option>
                    <option value="*/15 * * * *">Every 15 Minutes (*/15 * * * *)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Conflict Resolution Strategy *</label>
                  <select
                    value={newJobStrategy}
                    onChange={(e) =>
                      setNewJobStrategy(e.target.value as "SOURCE_WINS" | "TARGET_WINS" | "MANUAL_REVIEW")
                    }
                    className={styles.formSelect}
                  >
                    <option value="SOURCE_WINS">Source Wins (Overwrite Target)</option>
                    <option value="TARGET_WINS">Target Wins (Preserve ERP)</option>
                    <option value="MANUAL_REVIEW">Manual Review (Quarantine Conflicts)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Batch Chunk Size: {newJobBatchSize} records</label>
                <input
                  type="range"
                  min={50}
                  max={2000}
                  step={50}
                  value={newJobBatchSize}
                  onChange={(e) => setNewJobBatchSize(Number(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <div className={styles.buttonGroup} style={{ justifyContent: "flex-end", marginTop: "var(--space-2)" }}>
                <Button variant="outline" type="button" onClick={() => setIsNewJobOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Schedule Recurring Job
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
