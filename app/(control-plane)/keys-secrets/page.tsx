"use client";

import React, { useState, useMemo } from "react";
import {
  KeyRound,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Plus,
  Link2,
  Clock,
  Trash2,
  RotateCw,
  Calendar,
  CheckCircle2,
  Lock,
  FileKey,
  Layers,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Modal,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import { useToast } from "@/lib/use-toast";
import { useDomainRealtime } from "@/lib/use-domain-realtime";
import DomainShell from "@/components/domain-shell";
import { PaginatedTable, type ColumnDef } from "@/components/PaginatedTable";
import { FilterBar } from "@/components/FilterBar";
import { CrudDrawer } from "@/components/CrudDrawer";
import {
  type CertificateRecord,
  type CertificateChainResponse,
  type SecretLeaseRecord,
  type CertificateIssueFormData,
  type ScheduleRotationFormData,
  type SecretLeaseFormData,
  certificateIssueSchema,
  certificateIssueFormFields,
  certificateFilters,
  scheduleRotationSchema,
  secretLeaseSchema,
  secretLeaseFormFields,
  secretLeaseFilters,
} from "@/lib/keys-secrets-schema";
import styles from "./keys-secrets.module.css";

export default function KeysSecretsPage() {
  const toast = useToast();
  const canManage = usePermission("system.certificate.manage");

  const [activeTab, setActiveTab] = useState<"certs" | "leases">("certs");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // Real-time updates for keys & secrets
  useDomainRealtime("keys-secrets", () => {
    certs.reload();
    leases.reload();
  });

  // ── Certificates State ──────────────────────────────────────────────
  const certs = useList<CertificateRecord>({
    path: "/platform/v1/certificates?all=true",
  });

  // ── Dynamic Secret Leases State ─────────────────────────────────────
  const leases = useList<SecretLeaseRecord>({
    path: "/platform/v1/certificates/leases",
  });

  // Drawers and Modals
  const [isIssueCertOpen, setIsIssueCertOpen] = useState(false);
  const [isIssueLeaseOpen, setIsIssueLeaseOpen] = useState(false);
  const [scheduleCert, setScheduleCert] = useState<CertificateRecord | null>(null);
  const [scheduleDays, setScheduleDays] = useState<number>(30);
  const [isScheduling, setIsScheduling] = useState(false);

  // Certificate Chain Modal State
  const [selectedChainCertId, setSelectedChainCertId] = useState<string | null>(null);
  const [chainData, setChainData] = useState<CertificateChainResponse | null>(null);
  const [isChainLoading, setIsChainLoading] = useState(false);

  // Confirmation Dialogs
  const [rotateCertTarget, setRotateCertTarget] = useState<CertificateRecord | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [revokeCertTarget, setRevokeCertTarget] = useState<CertificateRecord | null>(null);
  const [isRevokingCert, setIsRevokingCert] = useState(false);
  const [revokeLeaseTarget, setRevokeLeaseTarget] = useState<SecretLeaseRecord | null>(null);
  const [isRevokingLease, setIsRevokingLease] = useState(false);

  // Filtered Certificates
  const filteredCerts = useMemo(() => {
    return (certs.data || []).filter((item) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesDomain = item.domainId?.toLowerCase().includes(q);
        const matchesIssuer = item.issuer?.toLowerCase().includes(q);
        const matchesSerial = item.serialNumber?.toLowerCase().includes(q);
        if (!matchesDomain && !matchesIssuer && !matchesSerial) return false;
      }
      if (activeFilters.status && item.status !== activeFilters.status) {
        return false;
      }
      if (activeFilters.provider && item.provider !== activeFilters.provider) {
        return false;
      }
      return true;
    });
  }, [certs.data, searchQuery, activeFilters]);

  // Filtered Secret Leases
  const filteredLeases = useMemo(() => {
    return (leases.data || []).filter((lease) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSecret = lease.secretKey?.toLowerCase().includes(q);
        const matchesClient = lease.clientIdentity?.toLowerCase().includes(q);
        const matchesId = lease.id?.toLowerCase().includes(q);
        if (!matchesSecret && !matchesClient && !matchesId) return false;
      }
      if (activeFilters.status && lease.status !== activeFilters.status) {
        return false;
      }
      return true;
    });
  }, [leases.data, searchQuery, activeFilters]);

  // KPIs
  const certKpis: StatCardItem[] = useMemo(() => {
    const total = certs.data?.length || 0;
    const expiringSoon = certs.data?.filter((c) => c.status === "EXPIRING_SOON" || c.daysRemaining <= 30).length || 0;
    const autoRotateCount = certs.data?.filter((c) => c.autoRotateScheduled).length || 0;
    return [
      {
        label: "Managed TLS Certificates",
        value: total,
        icon: <KeyRound size={18} />,
        color: "primary",
      },
      {
        label: "Valid & Active Certs",
        value: total - expiringSoon,
        icon: <ShieldCheck size={18} />,
        color: "success",
      },
      {
        label: "Expiring in <30 Days",
        value: expiringSoon,
        icon: <AlertTriangle size={18} />,
        color: expiringSoon > 0 ? "warning" : "default",
      },
      {
        label: "Auto-Rotation Armed",
        value: `${autoRotateCount} / ${total}`,
        icon: <RotateCw size={18} />,
        color: "info",
      },
    ];
  }, [certs.data]);

  const leaseKpis: StatCardItem[] = useMemo(() => {
    const total = leases.data?.length || 0;
    const active = leases.data?.filter((l) => l.status === "ACTIVE").length || 0;
    const revoked = leases.data?.filter((l) => l.status === "REVOKED").length || 0;
    return [
      {
        label: "Dynamic Secret Leases",
        value: total,
        icon: <Lock size={18} />,
        color: "primary",
      },
      {
        label: "Active Leases (In-Use)",
        value: active,
        icon: <CheckCircle2 size={18} />,
        color: "success",
      },
      {
        label: "Revoked Leases",
        value: revoked,
        icon: <Trash2 size={18} />,
        color: "default",
      },
      {
        label: "Revocation Latency SLA",
        value: "<120ms",
        icon: <Clock size={18} />,
        color: "info",
      },
    ];
  }, [leases.data]);

  // Handlers
  const handleInspectChain = async (cert: CertificateRecord) => {
    setSelectedChainCertId(cert.id);
    setIsChainLoading(true);
    setChainData(null);
    try {
      const res = await api.get<CertificateChainResponse>(`/platform/v1/certificates/chain/${cert.id}`);
      const chainPayload = (res as any)?.data ?? res;
      setChainData(chainPayload);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load certificate trust chain",
        "Chain Inspection Failed"
      );
      setSelectedChainCertId(null);
    } finally {
      setIsChainLoading(false);
    }
  };

  const handleExecuteRotate = async () => {
    if (!rotateCertTarget) return;
    setIsRotating(true);
    try {
      await api.post(`/platform/v1/certificates/${rotateCertTarget.id}/rotate`, {});
      toast.success(
        `Successfully renewed and rotated certificate for ${rotateCertTarget.domainId}`,
        "Certificate Rotated"
      );
      setRotateCertTarget(null);
      certs.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to rotate certificate",
        "Rotation Failed"
      );
    } finally {
      setIsRotating(false);
    }
  };

  const handleExecuteRevokeCert = async () => {
    if (!revokeCertTarget) return;
    setIsRevokingCert(true);
    try {
      await api.del(`/platform/v1/certificates/${revokeCertTarget.id}`);
      toast.success(
        `Certificate for ${revokeCertTarget.domainId} has been revoked`,
        "Certificate Revoked"
      );
      setRevokeCertTarget(null);
      certs.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke certificate",
        "Revocation Failed"
      );
    } finally {
      setIsRevokingCert(false);
    }
  };

  const handleExecuteScheduleRotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleCert) return;
    setIsScheduling(true);
    try {
      await api.post(`/platform/v1/certificates/${scheduleCert.id}/schedule-rotation`, {
        autoRotateDaysBefore: Number(scheduleDays),
      });
      toast.success(
        `Certificate for ${scheduleCert.domainId} will auto-rotate ${scheduleDays} days before expiry`,
        "Auto-Rotation Configured"
      );
      setScheduleCert(null);
      certs.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to schedule auto-rotation",
        "Configuration Failed"
      );
    } finally {
      setIsScheduling(false);
    }
  };

  const handleExecuteRevokeLease = async () => {
    if (!revokeLeaseTarget) return;
    setIsRevokingLease(true);
    try {
      await api.del(`/platform/v1/certificates/leases/${revokeLeaseTarget.id}`);
      toast.success(
        `Lease ${revokeLeaseTarget.id.substring(0, 8)}... has been immediately invalidated`,
        "Secret Lease Revoked"
      );
      setRevokeLeaseTarget(null);
      leases.reload();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke secret lease",
        "Lease Revocation Failed"
      );
    } finally {
      setIsRevokingLease(false);
    }
  };

  const handleIssueCertSubmit = async (formData: Record<string, any>) => {
    await api.post("/platform/v1/certificates", formData);
    toast.success(
      `New TLS certificate generated for ${formData.domainId}`,
      "Certificate Issued"
    );
    certs.reload();
  };

  const handleIssueLeaseSubmit = async (formData: Record<string, any>) => {
    await api.post("/platform/v1/certificates/leases", formData);
    toast.success(
      `New lease issued for ${formData.clientIdentity} (TTL: ${formData.ttlSeconds}s)`,
      "Secret Lease Issued"
    );
    leases.reload();
  };

  // Certificate Columns
  const certColumns: ColumnDef<CertificateRecord>[] = [
    {
      key: "domainId",
      label: "Domain / Hostname",
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{val}</div>
          <div style={{ fontSize: "var(--text-xs)", color: "var(--color-muted)", fontFamily: "var(--font-mono)" }}>
            SN: {row.serialNumber || "SN-AUTO-GEN"}
          </div>
        </div>
      ),
    },
    {
      key: "provider",
      label: "CA Authority",
      render: (val) => {
        let label = "Let's Encrypt";
        if (val === "zerossl") label = "ZeroSSL Enterprise";
        if (val === "internal_ca") label = "UniERP Internal CA";
        return (
          <span className={styles.badgeNeutral}>
            {label}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Lifecycle State",
      render: (val, row) => {
        if (val === "EXPIRING_SOON" || row.daysRemaining <= 30) {
          return (
            <span className={styles.badgeWarning}>
              Expiring ({row.daysRemaining}d left)
            </span>
          );
        }
        if (val === "EXPIRED") {
          return <span className={styles.badgeDanger}>Expired</span>;
        }
        if (val === "REVOKED") {
          return <span className={styles.badgeDanger}>Revoked</span>;
        }
        return (
          <span className={styles.badgeSuccess}>
            Active ({row.daysRemaining}d left)
          </span>
        );
      },
    },
    {
      key: "autoRotateScheduled",
      label: "Auto-Rotation",
      render: (val, row) => (
        <div>
          {val ? (
            <span className={styles.badgeSuccess}>
              Enabled ({row.autoRotateDaysBefore}d before)
            </span>
          ) : (
            <span className={styles.badgeNeutral}>Manual Only</span>
          )}
        </div>
      ),
    },
    {
      key: "notAfter",
      label: "Expiry Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "—"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className={styles.actionGroup}>
          <Button
            size="sm"
            variant="ghost"
            title="Inspect Certificate Chain"
            onClick={() => handleInspectChain(row)}
          >
            <Link2 size={14} /> Chain
          </Button>
          {canManage && (
            <>
              <Button
                size="sm"
                variant="ghost"
                title="Configure Auto-Rotation Threshold"
                onClick={() => {
                  setScheduleCert(row);
                  setScheduleDays(row.autoRotateDaysBefore || 30);
                }}
              >
                <Calendar size={14} /> Schedule
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Immediate Zero-Downtime Rotation"
                onClick={() => setRotateCertTarget(row)}
              >
                <RotateCw size={14} /> Rotate
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Revoke Certificate"
                onClick={() => setRevokeCertTarget(row)}
              >
                <Trash2 size={14} /> Revoke
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Secret Lease Columns
  const leaseColumns: ColumnDef<SecretLeaseRecord>[] = [
    {
      key: "id",
      label: "Lease ID",
      render: (val) => val.substring(0, 12) + "...",
    },
    {
      key: "secretKey",
      label: "Secret Vault Path",
    },
    {
      key: "clientIdentity",
      label: "Client Workload SPIFFE",
    },
    {
      key: "ttlSeconds",
      label: "TTL Remaining",
      render: (val, row) => {
        const expires = new Date(row.expiresAt).getTime();
        const now = Date.now();
        const remSec = Math.max(0, Math.floor((expires - now) / 1000));
        return (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)" }}>
            {remSec}s / {val}s
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Lease Status",
      render: (val) => {
        if (val === "ACTIVE") return <span className={styles.badgeSuccess}>Active</span>;
        if (val === "REVOKED") return <span className={styles.badgeDanger}>Revoked</span>;
        return <span className={styles.badgeNeutral}>Expired</span>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className={styles.actionGroup}>
          {canManage && row.status === "ACTIVE" && (
            <Button
              size="sm"
              variant="ghost"
              title="Revoke Secret Lease"
              onClick={() => setRevokeLeaseTarget(row)}
            >
              <Trash2 size={14} /> Revoke
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DomainShell domainId="keys-secrets" title="PCC-07 · Key & Secrets Authority">
      <div className={styles.container}>
        {/* Navigation Tabs */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "certs" ? styles.tabButtonActive : ""}`}
            onClick={() => {
              setActiveTab("certs");
              setSearchQuery("");
              setActiveFilters({});
            }}
          >
            <KeyRound size={16} /> TLS Certificate Lifecycles
          </button>
          <button
            type="button"
            className={`${styles.tabButton} ${activeTab === "leases" ? styles.tabButtonActive : ""}`}
            onClick={() => {
              setActiveTab("leases");
              setSearchQuery("");
              setActiveFilters({});
            }}
          >
            <Lock size={16} /> Dynamic Secret Leases (Vault / HSM)
          </button>
        </div>

        {/* Tab 1: Certificates */}
        {activeTab === "certs" && (
          <>
            <StatCardRow stats={certKpis} columns={4} />

            {/* Certificate Lifecycle Timeline */}
            <div className={styles.timelineCard}>
              <div className={styles.timelineTitle}>
                <Layers size={16} /> Automated Certificate Lifecycle Stages
              </div>
              <div className={styles.timelineTrack}>
                <div className={`${styles.timelineStep} ${styles.timelineStepActive}`}>
                  <div className={styles.timelineStepHeader}>
                    <span>1. CSR & Issuance</span>
                    <CheckCircle2 size={14} color="var(--color-primary)" />
                  </div>
                  <div className={styles.timelineStepDesc}>
                    Domain control validation (ACME HTTP-01 / DNS-01) and key generation.
                  </div>
                </div>
                <div className={`${styles.timelineStep} ${styles.timelineStepActive}`}>
                  <div className={styles.timelineStepHeader}>
                    <span>2. Active & Serving</span>
                    <ShieldCheck size={14} color="var(--color-success)" />
                  </div>
                  <div className={styles.timelineStepDesc}>
                    mTLS & Edge TLS ingress bound; telemetry health monitored 24/7.
                  </div>
                </div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineStepHeader}>
                    <span>3. Expiry Warning</span>
                    <AlertTriangle size={14} color="var(--color-warning)" />
                  </div>
                  <div className={styles.timelineStepDesc}>
                    Warning alerts fired 30d prior; triggers automatic background reissue.
                  </div>
                </div>
                <div className={styles.timelineStep}>
                  <div className={styles.timelineStepHeader}>
                    <span>4. Zero-Downtime Swap</span>
                    <RotateCw size={14} color="var(--color-info)" />
                  </div>
                  <div className={styles.timelineStepDesc}>
                    New cert provisioned before old cert retired; zero client disconnects.
                  </div>
                </div>
              </div>
            </div>

            {/* Controls Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <FilterBar
                searchPlaceholder="Search certificates by domain, issuer, or serial..."
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={certificateFilters}
                activeFilters={activeFilters}
                onFilterChange={(key, val) => setActiveFilters((prev) => ({ ...prev, [key]: val }))}
                onClearAll={() => {
                  setSearchQuery("");
                  setActiveFilters({});
                }}
              />
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Button variant="outline" size="sm" onClick={() => certs.reload()}>
                  <RefreshCw size={14} /> Refresh
                </Button>
                {canManage && (
                  <Button variant="primary" size="sm" onClick={() => setIsIssueCertOpen(true)}>
                    <Plus size={14} /> Issue TLS Certificate
                  </Button>
                )}
              </div>
            </div>

            {/* Table */}
            <PaginatedTable
              data={filteredCerts}
              columns={certColumns}
              loading={certs.loading}
              emptyMessage="No certificates found matching the search criteria"
            />
          </>
        )}

        {/* Tab 2: Leases */}
        {activeTab === "leases" && (
          <>
            <StatCardRow stats={leaseKpis} columns={4} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <FilterBar
                searchPlaceholder="Search leases by secret path, SPIFFE client, or ID..."
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={secretLeaseFilters}
                activeFilters={activeFilters}
                onFilterChange={(key, val) => setActiveFilters((prev) => ({ ...prev, [key]: val }))}
                onClearAll={() => {
                  setSearchQuery("");
                  setActiveFilters({});
                }}
              />
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Button variant="outline" size="sm" onClick={() => leases.reload()}>
                  <RefreshCw size={14} /> Refresh
                </Button>
                {canManage && (
                  <Button variant="primary" size="sm" onClick={() => setIsIssueLeaseOpen(true)}>
                    <Plus size={14} /> Issue Dynamic Secret Lease
                  </Button>
                )}
              </div>
            </div>

            <PaginatedTable
              data={filteredLeases}
              columns={leaseColumns}
              loading={leases.loading}
              emptyMessage="No active secret leases found"
            />
          </>
        )}

        {/* Certificate Chain Modal */}
        <Modal
          open={!!selectedChainCertId}
          onClose={() => {
            setSelectedChainCertId(null);
            setChainData(null);
          }}
          title={`Certificate Trust Chain: ${chainData?.domain || "Validating..."}`}
          size="lg"
        >
          {isChainLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-8)" }}>
              <Spinner size="lg" />
            </div>
          ) : chainData ? (
            <div className={styles.chainList}>
              {chainData.chain.map((node, index) => {
                let nodeClass = styles.chainNodeRoot;
                if (node.level === "INTERMEDIATE") nodeClass = styles.chainNodeIntermediate;
                if (node.level === "LEAF") nodeClass = styles.chainNodeLeaf;

                return (
                  <div key={index} className={`${styles.chainNode} ${nodeClass}`}>
                    <div className={styles.chainNodeHeader}>
                      <span className={styles.chainNodeTitle}>
                        {node.level === "ROOT" && "Root Certificate Authority"}
                        {node.level === "INTERMEDIATE" && "Intermediate Certificate Authority"}
                        {node.level === "LEAF" && "Leaf Domain Certificate"}
                      </span>
                      {node.isTrusted ? (
                        <span className={styles.badgeSuccess}>Trusted</span>
                      ) : (
                        <span className={styles.badgeDanger}>Untrusted</span>
                      )}
                    </div>
                    <div className={styles.chainDetailsGrid}>
                      <div className={styles.chainField}>
                        <span className={styles.chainLabel}>Subject</span>
                        <span>{node.subject}</span>
                      </div>
                      <div className={styles.chainField}>
                        <span className={styles.chainLabel}>Issuer</span>
                        <span>{node.issuer}</span>
                      </div>
                      <div className={styles.chainField}>
                        <span className={styles.chainLabel}>Algorithm</span>
                        <span>{node.keyAlgorithm}</span>
                      </div>
                      <div className={styles.chainField}>
                        <span className={styles.chainLabel}>Valid Until</span>
                        <span>{new Date(node.validUntil).toLocaleString()}</span>
                      </div>
                      <div className={styles.chainField} style={{ gridColumn: "1 / -1" }}>
                        <span className={styles.chainLabel}>SHA-256 Fingerprint</span>
                        <span className={styles.chainValueMono}>{node.fingerprintSha256}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Chain Not Found"
              description="Unable to inspect trust chain for this certificate."
            />
          )}
        </Modal>

        {/* Schedule Auto-Rotation Modal */}
        <Modal
          open={!!scheduleCert}
          onClose={() => setScheduleCert(null)}
          title={`Configure Auto-Rotation: ${scheduleCert?.domainId}`}
          size="md"
        >
          <form onSubmit={handleExecuteScheduleRotation} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-muted)" }}>
              Specify the automated reissue window. When the certificate enters this number of days
              prior to expiration, the control plane will trigger an ACME renewal and zero-downtime swap.
            </p>
            <div>
              <label style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 500, marginBottom: "var(--space-1)" }}>
                Auto-Rotate Window (Days Before Expiry)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={scheduleDays}
                onChange={(e) => setScheduleDays(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "var(--space-2)",
                  borderRadius: "var(--radius-md)",
                  border: "0.0625rem solid var(--color-border)",
                  background: "var(--color-surface)",
                  color: "var(--color-foreground)",
                }}
                required
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
              <Button variant="ghost" onClick={() => setScheduleCert(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isScheduling}>
                Save Auto-Rotation Schedule
              </Button>
            </div>
          </form>
        </Modal>

        {/* Rotate Confirm Dialog */}
        <ConfirmDialog
          open={!!rotateCertTarget}
          title="Rotate TLS Certificate"
          message={`Initiate zero-downtime rotation for ${rotateCertTarget?.domainId}? A new cryptographic key pair and certificate will be provisioned before retiring the current one.`}
          confirmLabel="Rotate Certificate Now"
          variant="warning"
          onConfirm={handleExecuteRotate}
          onCancel={() => setRotateCertTarget(null)}
        />

        {/* Revoke Certificate Confirm Dialog */}
        <ConfirmDialog
          open={!!revokeCertTarget}
          title="Revoke TLS Certificate"
          message={`Are you sure you want to permanently revoke certificate for ${revokeCertTarget?.domainId}? This will invalidate TLS termination on bound endpoints.`}
          confirmLabel="Revoke Certificate"
          variant="danger"
          onConfirm={handleExecuteRevokeCert}
          onCancel={() => setRevokeCertTarget(null)}
        />

        {/* Revoke Lease Confirm Dialog */}
        <ConfirmDialog
          open={!!revokeLeaseTarget}
          title="Revoke Dynamic Secret Lease"
          message={`Revoke lease ${revokeLeaseTarget?.id.substring(0, 8)}... for client "${revokeLeaseTarget?.clientIdentity}"? Downstream database/vault credentials will be invalidated immediately.`}
          confirmLabel="Revoke Lease"
          variant="danger"
          onConfirm={handleExecuteRevokeLease}
          onCancel={() => setRevokeLeaseTarget(null)}
        />

        {/* Issue Certificate Drawer */}
        <CrudDrawer
          isOpen={isIssueCertOpen}
          onClose={() => setIsIssueCertOpen(false)}
          title="Issue TLS Certificate"
          schema={certificateIssueSchema}
          fields={certificateIssueFormFields}
          onSubmit={handleIssueCertSubmit}
        />

        {/* Issue Dynamic Secret Lease Drawer */}
        <CrudDrawer
          isOpen={isIssueLeaseOpen}
          onClose={() => setIsIssueLeaseOpen(false)}
          title="Issue Dynamic Secret Lease"
          schema={secretLeaseSchema}
          fields={secretLeaseFormFields}
          onSubmit={handleIssueLeaseSubmit}
        />
      </div>
    </DomainShell>
  );
}
