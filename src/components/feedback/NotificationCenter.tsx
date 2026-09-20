"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, AlertCircle, Info, ShieldAlert } from "lucide-react";
import styles from "./NotificationCenter.module.css";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "alert" | "info" | "system";
  timestamp: string;
  read: boolean;
}

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n-1",
      title: "TLS Certificate Expiry",
      message: "Wildcard edge certificate (*.unierp.com) renews in 14 days.",
      type: "alert",
      timestamp: "10m ago",
      read: false,
    },
    {
      id: "n-2",
      title: "New Tenant Provisioned",
      message: "Tenant 'Acme Corp' completed automated realm hydration.",
      type: "info",
      timestamp: "1h ago",
      read: false,
    },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "alert":
        return <AlertCircle size={16} className={`${styles.itemIcon} ${styles.alert}`} />;
      case "system":
        return <ShieldAlert size={16} className={`${styles.itemIcon} ${styles.system}`} />;
      default:
        return <Info size={16} className={`${styles.itemIcon} ${styles.info}`} />;
    }
  };

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.bellButton}
        onClick={() => setOpen(!open)}
        aria-label="Open notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {open && (
        <div className={styles.panel} role="region" aria-label="Notification Center">
          <div className={styles.header}>
            <h3 className={styles.title}>Notifications</h3>
            {unreadCount > 0 && (
              <button type="button" className={styles.markAllBtn} onClick={markAllRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <div className={styles.emptyState}>No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`${styles.item} ${!n.read ? styles.unread : ""}`}
                  onClick={() => markAsRead(n.id)}
                >
                  {getIcon(n.type)}
                  <div className={styles.itemContent}>
                    <div className={styles.itemTitle}>{n.title}</div>
                    <div className={styles.itemMessage}>{n.message}</div>
                    <div className={styles.itemTime}>{n.timestamp}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
