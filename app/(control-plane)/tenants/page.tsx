"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  ShieldAlert,
  CheckCircle,
  Clock,
  ExternalLink,
  Download,
  Filter,
  Sliders,
  Database,
  Globe,
  Key,
  Layers,
  Settings,
  HardDrive,
  RefreshCw,
  X,
  Lock,
  Radio,
  FileText,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { Button, Card, Badge, StatusBadge, useToast, Tabs } from "@kannan19302/ui";
import { DEFAULT_TENANTS, Tenant } from "../lib/data";

export default function TenantsPage() {
  const { success, warning, info, error } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>(DEFAULT_TENANTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [planFilter, setPlanFilter] = useState<string>("ALL");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "database" | "domains" | "identity" | "quotas" | "flags" | "impersonate" | "backups">("overview");

  // Wizard Modal State
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newTenant, setNewTenant] = useState({
    name: "",
    slug: "",
    plan: "BUSINESS" as const,
    dbMode: "SHARED" as const,
    region: "us-east-1",
    adminEmail: "",
    storageGb: 200,
    apiRateLimit: 2500,
  });

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Tenant = {
      id: `ten-${Date.now().toString().slice(-4)}`,
      ...newTenant,
      status: "ACTIVE",
      storageGb: 0,
      maxStorageGb: newTenant.storageGb,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTenants((prev) => [created, ...prev]);
    success("Tenant Provisioned Successfully!", `Tenant "${created.name}" is now active in ${created.region}.`);
    setShowWizard(false);
    setWizardStep(1);
    setNewTenant({ name: "", slug: "", plan: "BUSINESS", dbMode: "SHARED", region: "us-east-1", adminEmail: "", storageGb: 200, apiRateLimit: 2500 });
  };

  const handleUpdateStatus = (tenantId: string, newStatus: "ACTIVE" | "SUSPENDED") => {
    setTenants((prev) =>
      prev.map((t) => (t.id === tenantId ? { ...t, status: newStatus } : t))
    );
    if (selectedTenant && selectedTenant.id === tenantId) {
      setSelectedTenant((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    if (newStatus === "ACTIVE") {
      success("Tenant Status Updated", `Tenant status set to ${newStatus}.`);
    } else {
      warning("Tenant Status Updated", `Tenant status set to ${newStatus}.`);
    }
  };

  const handleExportCsv = () => {
    const headers = "ID,Name,Slug,Plan,Status,DBMode,Region,AdminEmail,StorageGB,CreatedAt\n";
    const rows = tenants
      .map((t) => `${t.id},${t.name},${t.slug},${t.plan},${t.status},${t.dbMode},${t.region},${t.adminEmail},${t.storageGb},${t.createdAt}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `unierp-tenants-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    info("CSV Export Complete", "Tenant roster exported.");
  };

  const handleImpersonate = (tenant: Tenant) => {
    const impToken = `imp-session-${tenant.id}-${Date.now()}`;
    success("Impersonation Session Created", `Audited 15-minute access token generated for ${tenant.name}.`);
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesPlan = planFilter === "ALL" || t.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
  const pendingCount = tenants.filter((t) => t.status === "PENDING").length;
  const suspendedCount = tenants.filter((t) => t.status === "SUSPENDED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 4px 0", color: "var(--color-text)" }}>
            Tenant Operations Hub
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 14 }}>
            Provision, scale, isolate, and govern multi-tenant organizations across the platform.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Button variant="secondary" onClick={handleExportCsv} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <Download size={15} /> Export Roster
          </Button>
          <Button variant="primary" onClick={() => setShowWizard(true)} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>
            <Plus size={16} /> Provision New Tenant
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", fontSize: 13 }}>
            <span>Total Provisioned</span>
            <Users size={18} color="#60a5fa" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "var(--color-text)" }}>{tenants.length}</div>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", fontSize: 13 }}>
            <span>Active Tenants</span>
            <CheckCircle size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#34d399" }}>{activeCount}</div>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", fontSize: 13 }}>
            <span>Pending Provisioning</span>
            <Clock size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#fbbf24" }}>{pendingCount}</div>
        </div>

        <div style={{ padding: 18, borderRadius: 10, background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-secondary)", fontSize: 13 }}>
            <span>Suspended / Blocked</span>
            <ShieldAlert size={18} color="#fca5a5" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "#fca5a5" }}>{suspendedCount}</div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", background: "var(--color-bg-elevated)", padding: 14, borderRadius: 10, border: "1px solid var(--color-border)" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
          <Search size={16} style={{ position: "absolute", left: 12, top: 10, color: "#64748b" }} />
          <input
            type="text"
            placeholder="Search by tenant name, slug, or admin email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              color: "var(--color-text)",
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text-secondary)" }}>
          <Filter size={15} /> Status:
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "6px 10px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 13 }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--color-text-secondary)" }}>
          Plan:
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            style={{ padding: "6px 10px", background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 13 }}
          >
            <option value="ALL">All Tiers</option>
            <option value="STARTER">STARTER</option>
            <option value="BUSINESS">BUSINESS</option>
            <option value="ENTERPRISE">ENTERPRISE</option>
          </select>
        </div>
      </div>

      {/* Main Layout Grid (Table + Drawer) */}
      <div style={{ display: "flex", gap: 20 }}>
        {/* Tenant Data Grid */}
        <div style={{ flex: 1, background: "var(--color-bg-elevated)", borderRadius: 10, border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--color-bg)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Tenant Name</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Plan & DB Mode</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Region</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Storage Used</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Status</th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-secondary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 32, textAlign: "center", color: "#64748b" }}>
                    No tenants match your search query.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTenant(t)}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      backgroundColor: selectedTenant?.id === t.id ? "rgba(59, 130, 246, 0.15)" : "transparent",
                      cursor: "pointer",
                      transition: "background-color 0.15s",
                    }}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{t.name}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>slug: {t.slug} · {t.adminEmail}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <Badge variant={t.plan === "ENTERPRISE" ? "info" : "default"}>{t.plan}</Badge>
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>{t.dbMode}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>{t.region}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{t.storageGb} / {t.maxStorageGb} GB</div>
                      <div style={{ width: 100, height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 4 }}>
                        <div style={{ width: `${Math.min(100, (t.storageGb / t.maxStorageGb) * 100)}%`, height: "100%", backgroundColor: "#3b82f6", borderRadius: 2 }} />
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <StatusBadge status={t.status} />
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleImpersonate(t); }}>
                        Impersonate
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tenant Detail Inspector Drawer */}
        {selectedTenant && (
          <div style={{ width: 420, background: "var(--color-bg-elevated)", borderRadius: 10, border: "1px solid var(--color-border)", padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "var(--color-text)" }}>{selectedTenant.name}</h3>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>ID: {selectedTenant.id}</span>
              </div>
              <button onClick={() => setSelectedTenant(null)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            {/* Sub Tabs */}
            <Tabs
              value={activeTab}
              onChange={(val) => setActiveTab(val as any)}
              variant="pills"
              tabs={(["overview", "database", "domains", "identity", "quotas", "flags", "impersonate"] as const).map(tab => ({
                key: tab,
                label: <span style={{ textTransform: "capitalize", fontSize: 12 }}>{tab}</span>
              }))}
            />

            {/* Drawer Tab Contents */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div><span style={{ color: "var(--color-text-secondary)" }}>Admin Email:</span> <strong style={{ color: "var(--color-text)" }}>{selectedTenant.adminEmail}</strong></div>
                <div><span style={{ color: "var(--color-text-secondary)" }}>Region:</span> <span style={{ color: "var(--color-text)" }}>{selectedTenant.region}</span></div>
                <div><span style={{ color: "var(--color-text-secondary)" }}>Plan:</span> <Badge variant="info">{selectedTenant.plan}</Badge></div>
                <div><span style={{ color: "var(--color-text-secondary)" }}>Created Date:</span> <span style={{ color: "var(--color-text)" }}>{selectedTenant.createdAt}</span></div>

                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 600 }}>Status Actions</label>
                  {selectedTenant.status === "ACTIVE" ? (
                    <Button variant="secondary" onClick={() => handleUpdateStatus(selectedTenant.id, "SUSPENDED")} style={{ width: "100%", color: "#fca5a5", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                      Suspend Tenant Access
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => handleUpdateStatus(selectedTenant.id, "ACTIVE")} style={{ width: "100%" }}>
                      Reactivate Tenant Session
                    </Button>
                  )}
                </div>
              </div>
            )}

            {activeTab === "database" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div><span style={{ color: "var(--color-text-secondary)" }}>Isolation Mode:</span> <strong style={{ color: "#60a5fa" }}>{selectedTenant.dbMode} DATABASE</strong></div>
                <div><span style={{ color: "var(--color-text-secondary)" }}>Storage Consumption:</span> {selectedTenant.storageGb} / {selectedTenant.maxStorageGb} GB</div>
                <Button size="sm" variant="secondary" onClick={() => success("DB Snapshot Created", "On-demand PITR snapshot triggered.")}>
                  <Database size={14} style={{ marginRight: 6 }} /> Create Instant PITR Snapshot
                </Button>
              </div>
            )}

            {activeTab === "domains" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div><span style={{ color: "var(--color-text-secondary)" }}>Custom Domain:</span> {selectedTenant.customDomain || "None configured"}</div>
                <Button size="sm" variant="secondary" onClick={() => info("SSL Verified", "Let's Encrypt SSL certificate is valid.")}>
                  <Globe size={14} style={{ marginRight: 6 }} /> Check DNS & SSL Certificate
                </Button>
              </div>
            )}

            {activeTab === "identity" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div><span style={{ color: "var(--color-text-secondary)" }}>SAML / OIDC SSO:</span> <StatusBadge status="ACTIVE" /></div>
                <div><span style={{ color: "var(--color-text-secondary)" }}>MFA Policy:</span> Enforced TOTP / Passkey</div>
              </div>
            )}

            {activeTab === "quotas" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <div><span style={{ color: "var(--color-text-secondary)" }}>API Request Cap:</span> {selectedTenant.apiRateLimit} req / min</div>
                <div><span style={{ color: "var(--color-text-secondary)" }}>Storage Quota Limit:</span> {selectedTenant.maxStorageGb} GB</div>
              </div>
            )}

            {activeTab === "flags" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12 }}>
                {["Finance Module v2", "AI Copilot Assistant", "Healthcare EHR Connector", "Real Estate Portal"].map((flag) => (
                  <label key={flag} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--color-text-secondary)", padding: 6, background: "var(--color-bg)", borderRadius: 4 }}>
                    <span>{flag}</span>
                    <input type="checkbox" defaultChecked style={{ accentColor: "#3b82f6" }} />
                  </label>
                ))}
              </div>
            )}

            {activeTab === "impersonate" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
                <p style={{ margin: 0, color: "var(--color-text-secondary)", fontSize: 12 }}>
                  Generate a 15-minute temporary audit-logged admin access token for customer support troubleshooting.
                </p>
                <Button variant="primary" onClick={() => handleImpersonate(selectedTenant)}>
                  <Key size={14} style={{ marginRight: 6 }} /> Generate Support Impersonation Link
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Multi-step Provisioning Wizard Modal */}
      {showWizard && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999 }}>
          <div style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: 12, padding: 28, width: "100%", maxWidth: 520, color: "var(--color-text)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Provision Tenant Wizard (Step {wizardStep}/3)</h2>
              <button onClick={() => setShowWizard(false)} style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateTenant} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {wizardStep === 1 && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Tenant Legal Name</label>
                    <input
                      type="text"
                      required
                      value={newTenant.name}
                      onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-") })}
                      placeholder="e.g. Acme Corporation"
                      style={{ width: "100%", padding: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Tenant URL Identifier (Slug)</label>
                    <input
                      type="text"
                      required
                      value={newTenant.slug}
                      onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value })}
                      placeholder="e.g. acme"
                      style={{ width: "100%", padding: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Primary Admin Email</label>
                    <input
                      type="email"
                      required
                      value={newTenant.adminEmail}
                      onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                      placeholder="admin@acme.com"
                      style={{ width: "100%", padding: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                </>
              )}

              {wizardStep === 2 && (
                <>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Subscription Tier</label>
                    <select
                      value={newTenant.plan}
                      onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value as any })}
                      style={{ width: "100%", padding: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 14, boxSizing: "border-box" }}
                    >
                      <option value="STARTER">STARTER Tier ($99/mo)</option>
                      <option value="BUSINESS">BUSINESS Tier ($499/mo)</option>
                      <option value="ENTERPRISE">ENTERPRISE Tier (Custom)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Database Isolation Architecture</label>
                    <select
                      value={newTenant.dbMode}
                      onChange={(e) => setNewTenant({ ...newTenant, dbMode: e.target.value as any })}
                      style={{ width: "100%", padding: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 14, boxSizing: "border-box" }}
                    >
                      <option value="SHARED">Shared Schema Isolation</option>
                      <option value="DEDICATED">Dedicated Postgres Instance</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6 }}>Deployment Region Cluster</label>
                    <select
                      value={newTenant.region}
                      onChange={(e) => setNewTenant({ ...newTenant, region: e.target.value })}
                      style={{ width: "100%", padding: 10, background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: 6, color: "var(--color-text)", fontSize: 14, boxSizing: "border-box" }}
                    >
                      <option value="us-east-1">US-East (N. Virginia)</option>
                      <option value="eu-central-1">EU-Central (Frankfurt)</option>
                      <option value="ap-south-1">AP-South (Mumbai)</option>
                      <option value="sa-east-1">SA-East (São Paulo)</option>
                    </select>
                  </div>
                </>
              )}

              {wizardStep === 3 && (
                <>
                  <div style={{ padding: 14, backgroundColor: "rgba(59, 130, 246, 0.1)", borderRadius: 8, fontSize: 13, color: "#93c5fd" }}>
                    <ShieldCheck size={16} style={{ verticalAlign: "middle", marginRight: 6 }} />
                    Review Provisioning Parameters:
                    <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
                      <li>Tenant: <strong>{newTenant.name}</strong> ({newTenant.slug})</li>
                      <li>Admin: <strong>{newTenant.adminEmail}</strong></li>
                      <li>Tier: <strong>{newTenant.plan}</strong> ({newTenant.dbMode} DB)</li>
                      <li>Region: <strong>{newTenant.region}</strong></li>
                    </ul>
                  </div>
                </>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                {wizardStep > 1 ? (
                  <Button type="button" variant="secondary" onClick={() => setWizardStep(wizardStep - 1)}>Back</Button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <Button type="button" variant="primary" onClick={() => setWizardStep(wizardStep + 1)}>Next Step</Button>
                ) : (
                  <Button type="submit" variant="primary" style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}>Confirm & Provision</Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
