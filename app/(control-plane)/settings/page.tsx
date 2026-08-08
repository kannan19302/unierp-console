"use client";

import React, { useState } from "react";
import {
  Settings,
  Sliders,
  Palette,
  Mail,
  Bell,
  Globe,
  CheckCircle2,
  Save,
  Layers,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast } from "@kannan19302/ui";

export default function SettingsPage() {
  const { success } = useToast();
  const [platformName, setPlatformName] = useState("uniERP Universal Enterprise Suite");
  const [supportEmail, setSupportEmail] = useState("support@kannan19302.dev");
  const [accentColor, setAccentColor] = useState("#3b82f6");
  const [globalFlags, setGlobalFlags] = useState({
    aiAssistant: true,
    multiRegionScaling: true,
    stripeConnectMarketplace: true,
    darkThemeDefault: true,
    graphqlPlayground: false,
  });

  const handleSaveSettings = () => {
    success("Platform Settings Saved", "Global brand customizer and feature flags updated across cluster.");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            Platform Customizer & Global Settings
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            System-wide branding, custom CSS tokens, global feature flags, SMTP relay & notification webhooks.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="primary" onClick={handleSaveSettings} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
            <Save size={15} /> Save All Changes
          </Button>
        </div>
      </div>

      {/* Grid Settings Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Brand & Theme Customizer */}
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "var(--color-text)" }}>White-Label Customizer & CSS Tokens</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Global Platform Name</label>
              <input
                type="text"
                value={platformName}
                onChange={(e) => setPlatformName(e.target.value)}
                style={{ width: "100%", padding: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Global Support Contact Email</label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                style={{ width: "100%", padding: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6 }}>Primary Brand Accent Color</label>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ width: 42, height: 42, border: "none", borderRadius: 8, cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, color: "var(--color-text)", fontFamily: "monospace" }}>{accentColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System-Wide Feature Flags */}
        <div style={{ padding: 20, borderRadius: 12, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 16px 0", color: "var(--color-text)" }}>System-Wide Feature Flags</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(globalFlags).map(([key, val]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, backgroundColor: "rgba(15, 23, 42, 0.6)", borderRadius: 8, color: "var(--color-text)", fontSize: 13, cursor: "pointer" }}>
                <span style={{ textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1")}</span>
                <input
                  type="checkbox"
                  checked={val}
                  onChange={(e) => setGlobalFlags({ ...globalFlags, [key]: e.target.checked })}
                  style={{ accentColor: "#3b82f6" }}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
