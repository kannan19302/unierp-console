"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Server,
  ShieldAlert,
  Puzzle,
  CreditCard,
  Headphones,
  Activity,
  Settings,
  UserCheck,
  Menu,
  X,
  LogOut,
  Search,
  Bell,
  Sun,
  Moon,
  AlertTriangle,
  ChevronRight,
  Shield,
  Radio,
  CheckCircle2,
} from "lucide-react";
import { Badge, StatusBadge, Button, useTheme, CommandPalette } from "@kannan19302/ui";
import { DEFAULT_TENANTS } from "./lib/data";

export default function ControlPlaneLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [outageBanner, setOutageBanner] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    { name: "Command Center", href: "/", icon: LayoutDashboard, badge: "Live" },
    { name: "Tenant Operations", href: "/tenants", icon: Users, count: `${DEFAULT_TENANTS.length}` },
    { name: "Platform Fleet", href: "/infrastructure", icon: Server, badge: "99.99%" },
    { name: "Security & Audit", href: "/security", icon: ShieldAlert, badge: "SOC2" },
    { name: "Marketplace & Apps", href: "/marketplace", icon: Puzzle, count: "64" },
    { name: "Revenue & Billing", href: "/billing", icon: CreditCard, count: "$420K" },
    { name: "Support & SLA Desk", href: "/support", icon: Headphones, count: "4 Open" },
    { name: "System Telemetry", href: "/telemetry", icon: Activity, badge: "P99 42ms" },
    { name: "Platform Settings", href: "/settings", icon: Settings },
    { name: "Provider Staff", href: "/staff", icon: UserCheck, count: "18 Admins" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = "/login";
  };

  const commandItems = navItems.map((item, index) => ({
    id: `cmd-${index}`,
    title: item.name,
    category: "Navigation",
    onSelect: () => router.push(item.href),
  }));

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 270 : 0,
          background: "var(--color-bg-elevated)",
          borderRight: "1px solid var(--color-border)",
          color: "var(--color-text)",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          zIndex: 30,
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--color-border)" }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 12px rgba(59, 130, 246, 0.4)",
          }}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", letterSpacing: "-0.01em" }}>
              uniERP Console
            </div>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
              Provider Control Plane v2.6
            </div>
          </div>
        </div>

        {/* System Health Pulse */}
        <div style={{ padding: "10px 16px", backgroundColor: "rgba(16, 185, 129, 0.08)", borderBottom: "1px solid rgba(16, 185, 129, 0.15)", display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <Radio size={14} color="#10b981" style={{ animation: "pulse 2s infinite" }} />
          <span style={{ color: "#34d399", fontWeight: 500 }}>All 8 Clusters Healthy</span>
        </div>

        {/* Navigation Section */}
        <nav style={{ flex: 1, padding: "16px 10px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto" }}>
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "9px 12px",
                  borderRadius: 8,
                  backgroundColor: active ? "rgba(59, 130, 246, 0.15)" : "transparent",
                  border: active ? "1px solid rgba(59, 130, 246, 0.3)" : "1px solid transparent",
                  color: active ? "#ffffff" : "#94a3b8",
                  textDecoration: "none",
                  transition: "all 0.15s ease",
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <item.icon size={18} color={active ? "#60a5fa" : "#64748b"} />
                  <span style={{ whiteSpace: "nowrap" }}>{item.name}</span>
                </div>
                {item.badge && (
                  <Badge variant={active ? "info" : "default"}>
                    {item.badge}
                  </Badge>
                )}
                {item.count && !item.badge && (
                  <span style={{ fontSize: 11, color: "#64748b" }}>{item.count}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Admin Profile */}
        <div style={{ padding: 14, borderTop: "1px solid var(--color-border)", backgroundColor: "rgba(15, 23, 42, 0.4)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              color: "var(--color-text)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
            }}>
              PA
            </div>
            <div style={{ overflow: "hidden", flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text)", whiteSpace: "nowrap" }}>Provider Admin</div>
              <div style={{ fontSize: 11, color: "#64748b", whiteSpace: "nowrap" }}>admin@kannan19302.dev</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "8px 12px",
              width: "100%",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              cursor: "pointer",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "var(--color-bg)" }}>
        {/* Top Navigation Header */}
        <header
          style={{
            height: 60,
            background: "var(--color-bg-elevated)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            zIndex: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--color-text-secondary)" }}
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Quick Search */}
            <div style={{ position: "relative", width: 280 }} onClick={() => setCommandPaletteOpen(true)}>
              <Search size={16} style={{ position: "absolute", left: 10, top: 10, color: "#64748b" }} />
              <input
                type="text"
                placeholder="Search tenants, nodes, logs (Cmd + K)..."
                readOnly
                style={{
                  width: "100%",
                  padding: "6px 12px 6px 34px",
                  background: "var(--color-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  color: "var(--color-text)",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 8px", backgroundColor: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.2)", borderRadius: 6, fontSize: 12, color: "#93c5fd" }}>
              <CheckCircle2 size={14} color="#60a5fa" />
              <span>Session Authenticated</span>
            </div>

            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              title="Toggle Theme"
              style={{
                background: "none",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                padding: 6,
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              {resolvedTheme === "dark" ? <Sun size={18} color="#fbbf24" /> : <Moon size={18} />}
            </button>

            <button
              style={{
                position: "relative",
                background: "none",
                border: "1px solid var(--color-border)",
                borderRadius: 6,
                padding: 6,
                color: "var(--color-text-secondary)",
                cursor: "pointer",
              }}
            >
              <Bell size={18} />
              <span style={{
                position: "absolute",
                top: 4,
                right: 4,
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: "#ef4444",
              }} />
            </button>
          </div>
        </header>

        {/* Global Outage Ticker Banner if Active */}
        {outageBanner && (
          <div style={{
            padding: "8px 20px",
            backgroundColor: "#b91c1c",
            color: "var(--color-text)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 13,
            fontWeight: 500,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} />
              <span>{outageBanner}</span>
            </div>
            <button onClick={() => setOutageBanner(null)} style={{ background: "none", border: "none", color: "var(--color-text)", cursor: "pointer" }}>Dismiss</button>
          </div>
        )}

        {/* Main View Area */}
        <main style={{ flex: 1, overflow: "auto", padding: 24, background: "var(--color-bg)" }}>
          {children}
        </main>
      </div>

      <CommandPalette 
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        items={commandItems}
      />
    </div>
  );
}
