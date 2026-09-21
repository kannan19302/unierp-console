"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, Settings, LogOut } from "lucide-react";
import { LocaleSwitcher } from "./LocaleSwitcher";
import styles from "./shell.module.css";

interface SidebarFooterProps {
  displayName: string;
  initial: string;
  hasActiveIncident: boolean;
  isConnected: boolean;
  onSignOut: () => void;
}

export function SidebarFooter({
  displayName,
  initial,
  hasActiveIncident,
  isConnected,
  onSignOut,
}: SidebarFooterProps) {
  const statusLabel = hasActiveIncident
    ? "Active incident"
    : isConnected
      ? "Live updates connected"
      : "Live updates unavailable";

  return (
    <div className={styles.footer}>
      <Link href="/ops/incidents" className={styles.periodTrigger}>
        <div className={styles.periodLeft}>
          <span
            className={`${styles.statusDot} ${hasActiveIncident ? styles.statusDotDanger : isConnected ? styles.statusDotConnected : ""}`}
            aria-hidden="true"
          />
          <span>{statusLabel}</span>
        </div>
        <ChevronRight size={14} />
      </Link>

      <Link href="/governance-compliance" className={styles.footerBtn}>
        <div className={styles.footerBtnLabel}>
          <Settings size={15} />
          <span>Settings</span>
        </div>
      </Link>

      <LocaleSwitcher />

      <div className={styles.userFooterRow}>
        <Link
          href="/profile"
          className={styles.userFooterLeft}
          title="Account Profile"
        >
          <div className={styles.userAvatarMini}>{initial}</div>
          <span className={styles.userNameMini}>{displayName}</span>
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className={styles.signOutIconBtn}
          title="Sign out session"
          aria-label="Sign out session"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
