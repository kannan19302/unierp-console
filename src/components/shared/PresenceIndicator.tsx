"use client";

import React from "react";
import { Lock } from "lucide-react";
import styles from "./PresenceIndicator.module.css";

export interface PresenceUser {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  status?: "active" | "idle";
  isEditing?: boolean;
}

export interface PresenceIndicatorProps {
  users: PresenceUser[];
  maxVisible?: number;
  lockedEntityName?: string;
  className?: string;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0]?.substring(0, 2).toUpperCase() || "OP";
  return `${parts[0]?.charAt(0) || ""}${parts[parts.length - 1]?.charAt(0) || ""}`.toUpperCase();
};

export function PresenceIndicator({
  users = [],
  maxVisible = 3,
  lockedEntityName,
  className = "",
}: PresenceIndicatorProps) {
  if (!users || users.length === 0) return null;

  const editingUser = users.find((u) => u.isEditing);
  const visibleUsers = users.slice(0, maxVisible);
  const overflowCount = Math.max(0, users.length - maxVisible);

  return (
    <div className={`${styles.presenceWrapper} ${className}`} role="region" aria-label="Active collaborators">
      {editingUser && (
        <div className={styles.lockedBanner} role="alert" aria-live="polite">
          <Lock size={14} className={styles.lockedIcon} aria-hidden="true" />
          <span>
            <strong>{editingUser.name}</strong> is editing this {lockedEntityName || "record"}
          </span>
        </div>
      )}

      <div className={styles.avatarStack} aria-label={`${users.length} active collaborators`}>
        {overflowCount > 0 && (
          <div
            className={`${styles.avatar} ${styles.avatarOverflow}`}
            title={`${overflowCount} more collaborators`}
            aria-label={`${overflowCount} more collaborators`}
          >
            +{overflowCount}
          </div>
        )}

        {[...visibleUsers].reverse().map((user) => (
          <div
            key={user.id}
            className={styles.avatar}
            title={`${user.name}${user.isEditing ? " (editing)" : ""}`}
            aria-label={user.name}
          >
            {getInitials(user.name)}
            {user.status === "active" && <span className={styles.statusDot} />}
          </div>
        ))}
      </div>
    </div>
  );
}
