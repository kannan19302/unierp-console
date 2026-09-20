"use client";

import React, { useState, useEffect } from "react";
import { Info, X } from "lucide-react";
import styles from "./onboarding.module.css";

export interface ContextualTipProps {
  id: string;
  title: string;
  text: string;
  autoDismissMs?: number;
  className?: string;
}

export function ContextualTip({
  id,
  title,
  text,
  autoDismissMs,
  className,
}: ContextualTipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(`unierp_tip_${id}_dismissed`);
      if (dismissed !== "true") {
        setVisible(true);
      }
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!visible || !autoDismissMs) return;
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismissMs);
    return () => clearTimeout(timer);
  }, [visible, autoDismissMs]);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(`unierp_tip_${id}_dismissed`, "true");
    } catch {}
  };

  if (!visible) return null;

  return (
    <aside
      className={`${styles.tipCard} ${className ?? ""}`}
      role="note"
      aria-label={title}
    >
      <Info size={16} className={styles.tipIcon} />
      <div className={styles.tipContent}>
        <h4 className={styles.tipTitle}>{title}</h4>
        <p className={styles.tipText}>{text}</p>
      </div>
      <button
        type="button"
        className={styles.tipDismiss}
        onClick={handleDismiss}
        aria-label="Dismiss helpful tip"
      >
        <X size={14} />
      </button>
    </aside>
  );
}

export default ContextualTip;
