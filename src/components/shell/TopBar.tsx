"use client";

import React from "react";
import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import AdminAppSwitcher from "@/components/AdminAppSwitcher";
import { ProviderThemeControl } from "@/components/provider-theme";
import styles from "./shell.module.css";

interface TopBarProps {
  isExpanded: boolean;
  onToggleSidebar: () => void;
  onOpenCommandPalette: () => void;
  hasActiveIncident: boolean;
  accountEmail: string;
  initial: string;
}

export function TopBar({
  isExpanded,
  onToggleSidebar,
  onOpenCommandPalette,
  hasActiveIncident,
  accountEmail,
  initial,
}: TopBarProps) {
  return (
    <header className={styles.topbar}>
      <AdminAppSwitcher />
      <button
        id="provider-menu-toggle"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        aria-expanded={isExpanded}
        aria-controls="provider-navigation"
        className={styles.menuToggle}
      >
        <Menu size={18} aria-hidden="true" />
      </button>
      <Link href="/home" className={styles.topbarIdentity}>
        <span className={styles.topbarProduct}>UniERP</span>
        <span className={styles.topbarScope}>Provider control center</span>
      </Link>
      <div className={styles.spacer} />
      <button
        onClick={onOpenCommandPalette}
        aria-label="Search provider applications and pages"
        className={styles.searchButton}
      >
        <Search size={15} aria-hidden="true" />
        <span className={styles.searchLabel}>Search</span>
        <kbd className={styles.searchShortcut}>Ctrl K</kbd>
      </button>
      <ProviderThemeControl className={styles.themeSelect} />
      <Link
        href="/ops/incidents"
        aria-label="Review operational incidents"
        title="Review operational incidents"
        className={styles.notificationButton}
      >
        <Bell size={16} aria-hidden="true" />
        {hasActiveIncident && <span className={styles.notificationBadge} />}
      </Link>
      <Link
        href="/profile"
        className={styles.iconButton}
        aria-label="Open Account Profile"
        title={accountEmail ? `Account profile: ${accountEmail}` : "Account profile"}
      >
        {initial}
      </Link>
    </header>
  );
}
