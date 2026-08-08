"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Puzzle, Activity, Menu, X, LogOut } from "lucide-react";

export default function ControlPlaneLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { name: "Overview", href: "/", icon: LayoutDashboard },
    { name: "Tenants", href: "/tenants", icon: Users },
    { name: "Marketplace", href: "/marketplace", icon: Puzzle },
    { name: "Health", href: "/health", icon: Activity },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", backgroundColor: "#f3f4f6" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? 256 : 0,
          backgroundColor: "#1f2937",
          color: "white",
          transition: "width 0.3s",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #374151" }}>
          <Activity size={24} style={{ color: "#3b82f6" }} />
          <span style={{ fontSize: 18, fontWeight: "bold", whiteSpace: "nowrap" }}>Provider Console</span>
        </div>
        
        <nav style={{ flex: 1, padding: "16px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 6,
                  backgroundColor: active ? "#374151" : "transparent",
                  color: active ? "white" : "#9ca3af",
                  textDecoration: "none",
                  transition: "background-color 0.2s",
                }}
              >
                <item.icon size={18} />
                <span style={{ whiteSpace: "nowrap" }}>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: 16, borderTop: "1px solid #374151" }}>
          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              width: "100%",
              backgroundColor: "transparent",
              color: "#9ca3af",
              border: "none",
              cursor: "pointer",
              borderRadius: 6,
            }}
          >
            <LogOut size={18} />
            <span style={{ whiteSpace: "nowrap" }}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header
          style={{
            height: 64,
            backgroundColor: "white",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
          }}
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 8, color: "#4b5563" }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </header>

        <main style={{ flex: 1, overflow: "auto", padding: 24 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
