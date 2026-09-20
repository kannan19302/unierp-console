"use client";

import React from "react";
import styles from "./RealTimeIndicator.module.css";

export interface RealTimeIndicatorProps {
  status: "connected" | "disconnected" | "connecting";
  namespace?: string;
  lastEventTime?: Date | string | null;
  className?: string;
}

export function RealTimeIndicator({
  status,
  namespace = "global",
  lastEventTime,
  className = "",
}: RealTimeIndicatorProps) {
  const statusLabel =
    status === "connected"
      ? "Real-time active"
      : status === "connecting"
      ? "Connecting..."
      : "Disconnected";

  const timeLabel = lastEventTime
    ? typeof lastEventTime === "string"
      ? lastEventTime
      : lastEventTime.toLocaleTimeString()
    : null;

  return (
    <div
      className={`${styles.container} ${className}`}
      title={`Namespace: ${namespace}${timeLabel ? ` | Last event: ${timeLabel}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <span className={`${styles.dot} ${styles[status]}`} aria-hidden="true" />
      <span>{statusLabel}</span>
      {timeLabel && <span style={{ color: "var(--text-tertiary, #9ca3af)" }}>({timeLabel})</span>}
    </div>
  );
}
