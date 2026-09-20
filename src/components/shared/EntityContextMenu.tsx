"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./EntityContextMenu.module.css";

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  permission?: string;
  onClick: () => void;
}

export interface EntityContextMenuProps {
  title?: string;
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  userPermissions?: string[];
}

export function EntityContextMenu({
  title,
  items,
  position,
  onClose,
  userPermissions = ["*"], // default to universal permission if not provided
}: EntityContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Filter items by RBAC permissions
  const visibleItems = items.filter((item) => {
    if (!item.permission) return true;
    if (userPermissions.includes("*")) return true;
    return userPermissions.includes(item.permission);
  });

  // Position adjustments to prevent viewport clipping
  const adjustedX = Math.max(
    8,
    Math.min(position.x, typeof window !== "undefined" ? window.innerWidth - 220 : position.x)
  );
  const adjustedY = Math.max(
    8,
    Math.min(position.y, typeof window !== "undefined" ? window.innerHeight - 300 : position.y)
  );

  // Keyboard navigation and outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % Math.max(1, visibleItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev - 1 < 0 ? Math.max(0, visibleItems.length - 1) : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const activeItem = visibleItems[focusedIndex];
        if (activeItem && !activeItem.disabled) {
          activeItem.onClick();
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [visibleItems, focusedIndex, onClose]);

  if (visibleItems.length === 0) return null;

  return (
    <>
      <div
        className={styles.menuOverlay}
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />
      <div
        ref={menuRef}
        className={styles.menuContainer}
        style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
        role="menu"
        aria-label={title || "Entity context actions"}
      >
        {title && (
          <>
            <div className={styles.menuHeader}>{title}</div>
            <div className={styles.menuDivider} />
          </>
        )}
        {visibleItems.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={`${styles.menuItem} ${
              item.destructive ? styles.menuItemDestructive : ""
            } ${idx === focusedIndex ? styles.menuItemFocused : ""}`}
            onClick={() => {
              item.onClick();
              onClose();
            }}
            onMouseEnter={() => setFocusedIndex(idx)}
          >
            <div className={styles.menuItemLeft}>
              {item.icon && <span className={styles.menuItemIcon}>{item.icon}</span>}
              <span>{item.label}</span>
            </div>
            {item.shortcut && <span className={styles.shortcut}>{item.shortcut}</span>}
          </button>
        ))}
      </div>
    </>
  );
}
