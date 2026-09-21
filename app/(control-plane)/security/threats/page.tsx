"use client";
/**
 * Security & Compliance → Threats.
 * Live security threat detection and incident triage workbench.
 */
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Badge,
  Button,
  Card,
  ForbiddenState,
  StatCardRow,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Eye,
  FileSearch,
  History,
  Info,
  RefreshCw,
  ShieldAlert,
  Terminal,
  UserCheck,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import {
  type SecurityThreat,
  threatTriageFormSchema,
  threatTriageDrawerFields,
  securityThreatFilterConfigs,
} from "@/lib/security-schema";
import styles from "./threats.module.css";

export default function SecurityThreatsPage() {
  const toast = useToast();
  const canAccess = usePermission("pcc.security.view");
  const canTriage = usePermission("system.soc.execute");

  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Triage Drawer State
  const [triageDrawerOpen, setTriageDrawerOpen] = useState(false);
  const [selectedThreat, setSelectedThreat] = useState<SecurityThreat | null>(null);

  // Detail Drawer / Inspection State
  const [inspectDrawerOpen, setInspectDrawerOpen] = useState(false);
  const [inspectThreat, setInspectThreat] = useState<SecurityThreat | null>(null);

  const fetchThreats = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filters.severity) params.set("severity", filters.severity);
      if (filters.status) params.set("status", filters.status);

      const res = await api.get<{
        data: SecurityThreat[];
        total: number;
        criticalCount?: number;
      }>(`/platform/v1/soc/threats?${params.toString()}`);

      setThreats(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      toast.error("Failed to load security threats", err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }, [search, filters, toast]);

  useEffect(() => {
    if (!canAccess) return;
    fetchThreats();
  }, [canAccess, fetchThreats]);

  useDomainRealtime("security", fetchThreats);

  // Quick triage step progression
  const handleQuickTriage = async (
    threat: SecurityThreat,
    action: "ACKNOWLEDGE" | "INVESTIGATE" | "RESOLVE" | "CLOSE",
    defaultNotes?: string
  ) => {
    try {
      const notes =
        defaultNotes ||
        `Quick stage progression to ${action} via SOC console action bar.`;

      await api.patch(`/platform/v1/soc/threats/${threat.id}/triage`, {
        action,
        notes,
      });

      toast.success(
        "Threat Stage Updated",
        `Threat ${threat.id} transitioned to ${action} stage.`
      );
      fetchThreats();
    } catch (err: any) {
      toast.error("Triage Failed", err.message || "Could not transition threat stage.");
    }
  };

  // Detailed triage drawer
  const handleOpenTriageDrawer = (threat: SecurityThreat) => {
    setSelectedThreat(threat);
    setTriageDrawerOpen(true);
  };

  const handleTriageSubmit = async (values: any) => {
    if (!selectedThreat) return;
    try {
      await api.patch(`/platform/v1/soc/threats/${selectedThreat.id}/triage`, values);
      toast.success("Triage Recorded", `Threat ${selectedThreat.id} stage updated.`);
      setTriageDrawerOpen(false);
      setSelectedThreat(null);
      fetchThreats();
    } catch (err: any) {
      toast.error("Triage Failed", err.message || "Could not submit triage record.");
      throw err;
    }
  };

  const handleInspect = (threat: SecurityThreat) => {
    setInspectThreat(threat);
    setInspectDrawerOpen(true);
  };

  // Stats calculation
  const stats: StatCardItem[] = useMemo(() => {
    const totalCount = threats.length;
    const criticalCount = threats.filter((t) => t.severity === "CRITICAL").length;
    const activeCount = threats.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length;
    const resolvedCount = threats.filter((t) => t.status === "RESOLVED" || t.status === "CLOSED").length;

    return [
      { label: "Active Threats", value: activeCount },
      { label: "Critical Severity", value: criticalCount },
      { label: "Total Monitored", value: totalCount },
      { label: "Remediated", value: resolvedCount },
    ];
  }, [threats]);

  const severityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "danger";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "info";
      default:
        return "default";
    }
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case "NEW":
        return "danger";
      case "ACKNOWLEDGED":
        return "warning";
      case "INVESTIGATING":
        return "info";
      case "RESOLVED":
      case "CLOSED":
        return "success";
      default:
        return "default";
    }
  };

  const columns: ColumnDef<SecurityThreat>[] = [
    {
      key: "severity",
      label: "Severity",
      render: (_, row: SecurityThreat) => (
        <Badge variant={severityBadgeVariant(row.severity)}>{row.severity}</Badge>
      ),
    },
    {
      key: "title",
      label: "Threat Anomaly & Target",
      render: (_, row: SecurityThreat) => (
        <div className={styles.threatCell}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className={styles.threatTitle}>{row.title}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
              [{row.id}]
            </span>
          </div>
          <div className={styles.threatMeta}>
            <span>Origin IP: {row.sourceIp}</span>
            {row.targetTenant && <span>· Target: {row.targetTenant}</span>}
            <span>· Type: {row.type}</span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Triage Stage",
      render: (_, row: SecurityThreat) => (
        <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>
      ),
    },
    {
      key: "detectedAt",
      label: "Detected",
      render: (_, row: SecurityThreat) => (
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
          {new Date(row.detectedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Triage Actions",
      render: (_, row: SecurityThreat) => (
        <div className={styles.triageActions}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleInspect(row)}
            title="Inspect Forensic Timeline"
          >
            <Eye size={13} />
          </Button>

          {canTriage && row.status === "NEW" && (
            <button
              className={`${styles.stageButton} ${styles.stageAcknowledge}`}
              onClick={() => handleQuickTriage(row, "ACKNOWLEDGE")}
            >
              <UserCheck size={12} />
              <span>Acknowledge</span>
            </button>
          )}

          {canTriage && row.status === "ACKNOWLEDGED" && (
            <button
              className={`${styles.stageButton} ${styles.stageInvestigate}`}
              onClick={() => handleQuickTriage(row, "INVESTIGATE")}
            >
              <FileSearch size={12} />
              <span>Investigate</span>
            </button>
          )}

          {canTriage && row.status === "INVESTIGATING" && (
            <button
              className={`${styles.stageButton} ${styles.stageResolve}`}
              onClick={() => handleQuickTriage(row, "RESOLVE")}
            >
              <CheckCircle size={12} />
              <span>Resolve</span>
            </button>
          )}

          {canTriage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenTriageDrawer(row)}
              title="Add Triage Record"
            >
              <History size={13} />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!canAccess) {
    return (
      <DomainShell domainId="security" title="Threats">
        <ForbiddenState
          title="Access Restricted"
          description="You do not possess the required security operations credentials (pcc.security.view) to inspect SOC threats."
        />
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Threats"
      description="Real-time perimeter intrusion alerts, anomalous session activity, and SOC forensic triage."
    >
      <div className={styles.container}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div className={styles.tableToolbar}>
              <div className={styles.titleArea}>
                <h3 className={styles.pageTitle}>Live Security Telemetry & Threats</h3>
                <p className={styles.pageSubtitle}>
                  Real-time detection events triggered by WAF, IDS, and authentication invariants.
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={fetchThreats}>
                <RefreshCw size={13} />
                Refresh Telemetry
              </Button>
            </div>

            <FilterBar
              filters={securityThreatFilterConfigs}
              activeFilters={filters}
              searchQuery={search}
              searchPlaceholder="Search threats by IP, title, or tenant ID..."
              onFilterChange={(key: string, value: string) => {
                setFilters((prev) => ({ ...prev, [key]: value }));
                setPage(1);
              }}
              onSearchChange={(q: string) => {
                setSearch(q);
                setPage(1);
              }}
              onClearAll={() => {
                setFilters({});
                setSearch("");
                setPage(1);
              }}
            />

            <PaginatedTable<SecurityThreat>
              columns={columns}
              data={threats.slice((page - 1) * pageSize, page * pageSize)}
              loading={loading}
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              emptyMessage="No anomalies matched the selected filters. Perimeter health is nominal."
            />
          </div>
        </Card>
      </div>

      {/* Forensic Inspection Modal / Side Drawer */}
      {inspectDrawerOpen && inspectThreat && (
        <div
          className={styles.inspectOverlay}
          onClick={() => setInspectDrawerOpen(false)}
        >
          <div
            className={styles.inspectPanel}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 700 }}>
                Forensic Analysis: {inspectThreat.id}
              </h3>
              <Button variant="outline" size="sm" onClick={() => setInspectDrawerOpen(false)}>
                Close
              </Button>
            </div>

            <Card padding="md">
              <div className={styles.drawerSection}>
                <h4 className={styles.sectionHeading}>Anomaly Summary</h4>
                <span style={{ fontWeight: 600, fontSize: "var(--text-sm)" }}>{inspectThreat.title}</span>
                <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  {inspectThreat.description}
                </p>
                <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                  <Badge variant={severityBadgeVariant(inspectThreat.severity)}>{inspectThreat.severity}</Badge>
                  <Badge variant={statusBadgeVariant(inspectThreat.status)}>{inspectThreat.status}</Badge>
                  <Badge variant="default">IP: {inspectThreat.sourceIp}</Badge>
                </div>
              </div>
            </Card>

            <Card padding="md">
              <div className={styles.drawerSection}>
                <h4 className={styles.sectionHeading}>Triage History & Evidence Trail</h4>
                {inspectThreat.triageHistory.length === 0 ? (
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                    No manual triage history logged yet.
                  </span>
                ) : (
                  <ul className={styles.timelineList}>
                    {inspectThreat.triageHistory.map((item, idx) => (
                      <li key={idx} className={styles.timelineItem}>
                        <div className={styles.timelineHeader}>
                          <span style={{ fontWeight: 600 }}>{item.action}</span>
                          <span>by {item.by} · {new Date(item.at).toLocaleTimeString()}</span>
                        </div>
                        <p className={styles.timelineNotes}>{item.notes}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Triage Action Drawer */}
      <CrudDrawer
        open={triageDrawerOpen}
        title={`Triage Threat: ${selectedThreat?.id}`}
        mode="edit"
        schema={threatTriageFormSchema}
        fields={threatTriageDrawerFields}
        initialValues={{
          action:
            selectedThreat?.status === "NEW"
              ? "ACKNOWLEDGE"
              : selectedThreat?.status === "ACKNOWLEDGED"
              ? "INVESTIGATE"
              : "RESOLVE",
          assignedTo: selectedThreat?.assignedTo || "",
          notes: "",
        }}
        onSubmit={handleTriageSubmit}
        onClose={() => {
          setTriageDrawerOpen(false);
          setSelectedThreat(null);
        }}
      />
    </DomainShell>
  );
}