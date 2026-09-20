"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowRight,
  PlusCircle,
  Zap,
  Sliders,
  HelpCircle,
  Clock,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { PCC_REGISTRY } from "@/lib/pcc-registry";
import styles from "./UniversalSearch.module.css";

export interface CommandItem {
  id: string;
  title: string;
  description?: string;
  category: "navigation" | "create" | "action" | "settings" | "help" | "recent";
  icon?: React.ReactNode;
  keywords?: string[];
  action: () => void;
}

interface UniversalSearchProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "unierp_universal_search_recents";

export function UniversalSearch({ open, onClose }: UniversalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Load recents on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentIds(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const recordRecent = (id: string) => {
    try {
      const updated = [id, ...recentIds.filter((item) => item !== id)].slice(0, 5);
      setRecentIds(updated);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const executeCommand = (cmd: CommandItem) => {
    recordRecent(cmd.id);
    onClose();
    cmd.action();
  };

  const allCommands = useMemo<CommandItem[]>(() => {
    const commands: CommandItem[] = [];

    // 1. Navigation items from PCC Registry
    PCC_REGISTRY.forEach((pcc) => {
      commands.push({
        id: `nav-${pcc.id}`,
        title: `Go to ${pcc.title}`,
        description: pcc.description,
        category: "navigation",
        icon: <ArrowRight size={14} />,
        keywords: [pcc.id, pcc.title.toLowerCase(), pcc.pccCode.toLowerCase(), "pcc", "navigate"],
        action: () => router.push(pcc.href),
      });
    });

    // 2. Create actions
    commands.push(
      {
        id: "create-tenant",
        title: "Create New Tenant",
        description: "Provision a dedicated enterprise tenant organization",
        category: "create",
        icon: <PlusCircle size={14} />,
        keywords: ["tenant", "org", "provision", "new", "create"],
        action: () => router.push("/tenants?drawer=create"),
      },
      {
        id: "create-plan",
        title: "Create Billing Plan",
        description: "Configure tier pricing, quotas, and invoicing rules",
        category: "create",
        icon: <PlusCircle size={14} />,
        keywords: ["billing", "pricing", "tier", "plan", "invoice"],
        action: () => router.push("/billing?drawer=create"),
      },
      {
        id: "create-key",
        title: "Generate API Key",
        description: "Issue scoped API keys with rate limits & expiry",
        category: "create",
        icon: <PlusCircle size={14} />,
        keywords: ["api", "key", "token", "secret", "credentials"],
        action: () => router.push("/keys?drawer=create"),
      },
      {
        id: "create-operator",
        title: "Invite Platform Operator",
        description: "Grant provider administrative privileges with RBAC",
        category: "create",
        icon: <PlusCircle size={14} />,
        keywords: ["user", "admin", "operator", "access", "invite"],
        action: () => router.push("/access?drawer=create"),
      }
    );

    // 3. Operational Actions
    commands.push(
      {
        id: "action-rotate-keys",
        title: "Rotate Platform Signing Keys",
        description: "Initiate zero-downtime key rotation ceremony",
        category: "action",
        icon: <RotateCcw size={14} />,
        keywords: ["security", "rotate", "key", "cert", "cryptography"],
        action: () => router.push("/keys?tab=rotation"),
      },
      {
        id: "action-system-health",
        title: "Run System Diagnostics",
        description: "Execute end-to-end health probe across all 22 PCC nodes",
        category: "action",
        icon: <Zap size={14} />,
        keywords: ["health", "status", "ops", "diagnostic", "check"],
        action: () => router.push("/ops?tab=health"),
      },
      {
        id: "action-canary-rollout",
        title: "Inspect Canary Deployments",
        description: "Review active canary rollouts, traffic splits, and error budgets",
        category: "action",
        icon: <Zap size={14} />,
        keywords: ["canary", "deploy", "rollout", "traffic", "release"],
        action: () => router.push("/ops?tab=canary"),
      }
    );

    // 4. Settings & Preferences
    commands.push(
      {
        id: "settings-general",
        title: "Platform Configuration",
        description: "Global feature flags, SLAs, and tenant defaults",
        category: "settings",
        icon: <Sliders size={14} />,
        keywords: ["settings", "config", "flags", "environment"],
        action: () => router.push("/settings"),
      },
      {
        id: "settings-dark-mode",
        title: "Toggle Theme Mode",
        description: "Switch between Dark and Light control plane themes",
        category: "settings",
        icon: <Sliders size={14} />,
        keywords: ["theme", "dark", "light", "mode", "color"],
        action: () => {
          const current = document.documentElement.getAttribute("data-theme");
          const next = current === "dark" ? "light" : "dark";
          document.documentElement.setAttribute("data-theme", next);
          try {
            localStorage.setItem("unierp_theme_mode", next);
          } catch {}
        },
      }
    );

    // 5. Help & Docs
    commands.push(
      {
        id: "help-docs",
        title: "Developer Platform & API Docs",
        description: "Interactive OpenAPI specifications & SDK reference",
        category: "help",
        icon: <ExternalLink size={14} />,
        keywords: ["docs", "api", "openapi", "documentation", "sdk"],
        action: () => router.push("/developers"),
      },
      {
        id: "help-support",
        title: "Submit Support Ticket",
        description: "Open an incident ticket with platform engineering",
        category: "help",
        icon: <HelpCircle size={14} />,
        keywords: ["support", "help", "ticket", "issue", "bug"],
        action: () => router.push("/support?drawer=create"),
      }
    );

    return commands;
  }, [router]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      // If no query, show recent commands first, then default popular commands
      const recents = recentIds
        .map((id) => allCommands.find((c) => c.id === id))
        .filter((c): c is CommandItem => Boolean(c));

      const others = allCommands.filter((c) => !recentIds.includes(c.id)).slice(0, 8);
      return [...recents, ...others];
    }

    return allCommands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(trimmed);
      const matchDesc = cmd.description?.toLowerCase().includes(trimmed);
      const matchKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(trimmed));
      return matchTitle || matchDesc || matchKeywords;
    });
  }, [query, allCommands, recentIds]);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev - 1 < 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === "Enter" && filteredCommands.length > 0) {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) executeCommand(selected);
    }
  };

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Universal Command Palette"
    >
      <div className={styles.modal} onKeyDown={handleKeyDown}>
        <div className={styles.searchHeader}>
          <Search size={18} className={styles.searchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Type a command, domain, or action... (e.g. 'Tenants', 'Rotate', 'Theme')"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            aria-label="Search commands"
          />
          <kbd className={styles.closeKey}>ESC</kbd>
        </div>

        <div className={styles.resultsList} ref={listRef} role="listbox">
          {filteredCommands.length === 0 ? (
            <div className={styles.emptyState}>No matching commands or domains found.</div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              const isRecent = recentIds.includes(cmd.id) && !query.trim();

              return (
                <button
                  key={cmd.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.resultItem} ${isSelected ? styles.resultItemActive : ""}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                >
                  <div className={styles.resultItemLeft}>
                    <div className={styles.itemIconWrap}>
                      {isRecent ? <Clock size={14} /> : cmd.icon}
                    </div>
                    <div>
                      <div className={styles.itemTitle}>{cmd.title}</div>
                      {cmd.description && (
                        <div className={styles.itemDesc}>{cmd.description}</div>
                      )}
                    </div>
                  </div>
                  <span className={styles.categoryBadge}>
                    {isRecent ? "recent" : cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.keyHints}>
            <span>
              <kbd className={styles.closeKey}>↑</kbd> <kbd className={styles.closeKey}>↓</kbd> to
              navigate
            </span>
            <span>
              <kbd className={styles.closeKey}>↵</kbd> to select
            </span>
            <span>
              <kbd className={styles.closeKey}>esc</kbd> to close
            </span>
          </div>
          <span>UniERP Provider Admin</span>
        </div>
      </div>
    </div>
  );
}
