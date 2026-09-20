"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Menu, Search, Bell } from "lucide-react";
import AdminAppSwitcher from "@/components/AdminAppSwitcher";
import { ProviderThemeControl } from "@/components/provider-theme";
import { useConsoleSocket } from "@/lib/use-console-socket";
import styles from "./shell.module.css";

function ConsoleSocketListener() {
  const { socket, isConnected } = useConsoleSocket();

  useEffect(() => {
    if (!socket) return;
    const onTenantUpdate = (data: { action: string; tenantId: string }) => {
      console.log("Real-time tenant update received:", data);
    };
    socket.on("tenant.update", onTenantUpdate);
    return () => {
      socket.off("tenant.update", onTenantUpdate);
    };
  }, [socket]);

  return isConnected ? (
    <div className={styles.socketIndicator} title="Connected to real-time events">
      <span className={styles.socketDot} />
    </div>
  ) : null;
}

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
        <Menu size={20} />
      </button>
      <ConsoleSocketListener />
      <div className={styles.spacer} />
      <button
        onClick={onOpenCommandPalette}
        aria-label="Search provider applications and pages"
        className={styles.searchButton}
      >
        <Search size={16} />
        <span className={styles.searchLabel}>Search…</span>
        <span className={styles.searchShortcut}>⌘K</span>
      </button>
      <ProviderThemeControl className={styles.themeSelect} />
      <Link
        href="/ops/incidents"
        aria-label="Review operational incidents"
        title="Review operational incidents"
        className={styles.notificationButton}
      >
        <Bell size={16} />
        {hasActiveIncident && <span className={styles.notificationBadge} />}
      </Link>
      <a
        href="http://localhost:3005/oidc/account"
        className={styles.iconButton}
        aria-label="Open Account Center"
        title="Account Center"
      >
        {initial}
      </a>
    </header>
  );
}
