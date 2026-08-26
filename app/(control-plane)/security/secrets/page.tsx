"use client";
/**
 * Security & Compliance → Secrets.
 * Platform credentials (masked), enterprise-scale key rotation schedules,
 * and zero-downtime TLS certificate lifecycle management.
 */
import { useState } from "react";
import { KeyRound, Lock, Plus, RefreshCw, Shield, ShieldCheck } from "lucide-react";
import {
  Card,
  EmptyState,
  Spinner,
  StatCardRow,
  Badge,
  Button,
  FormField,
  Input,
  Modal,
  useToast,
  usePermission,
  type StatCardItem,
} from "@kannan19302/ui";
import { useList } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface CredentialField {
  key?: string;
  label?: string;
  value?: string;
  isSet?: boolean;
  sensitive?: boolean;
}

interface CredentialProvider {
  provider?: string;
  label?: string;
  fields?: CredentialField[];
}

interface KeyRotation {
  id?: string;
  name?: string;
  key?: string;
  status?: string;
  lastRotatedAt?: string;
  nextRotationAt?: string;
  region?: string;
}

interface CertificateSummary {
  id: string;
  tenantId: string;
  domainId: string;
  status: string;
  expiresAt: string;
  secretRef: string;
  provider: string;
}

export default function SecuritySecrets() {
  const toast = useToast();
  const canManageCerts = usePermission("system.certificate.manage");

  const credentials = useList<CredentialProvider>({
    path: "/admin/platform-credentials",
  });
  const rotations = useList<KeyRotation>({
    path: "/platform/v1/enterprise-scale/key-rotations",
  });
  const certificates = useList<CertificateSummary>({
    path: "/platform/v1/certificates",
  });

  const [issueOpen, setIssueOpen] = useState(false);
  const [tenantId, setTenantId] = useState("platform");
  const [domainId, setDomainId] = useState("api.unierp.internal");
  const [issuing, setIssuing] = useState(false);
  const [rotatingId, setRotatingId] = useState<string | null>(null);

  const handleIssueCert = async () => {
    setIssuing(true);
    try {
      await api.post("/platform/v1/certificates", {
        tenantId,
        domainId,
        provider: "LETS_ENCRYPT",
      });
      await certificates.reload();
      toast.success("Certificate Issued", `TLS certificate issued for domain ${domainId}.`);
      setIssueOpen(false);
      setDomainId("");
    } catch {
      toast.error("Issuance Failed", "Failed to issue new TLS certificate.");
    } finally {
      setIssuing(false);
    }
  };

  const handleRotateCert = async (certId: string) => {
    setRotatingId(certId);
    try {
      await api.post(`/platform/v1/certificates/${certId}/rotate`);
      await certificates.reload();
      toast.success("Certificate Rotated", `Zero-downtime rotation completed for ${certId}.`);
    } catch {
      toast.error("Rotation Failed", "Could not rotate certificate.");
    } finally {
      setRotatingId(null);
    }
  };

  const totalFields = credentials.data.reduce(
    (acc, p) => acc + (p.fields ?? []).length,
    0,
  );
  const setFields = credentials.data.reduce(
    (acc, p) => acc + (p.fields ?? []).filter((f) => f.isSet).length,
    0,
  );

  const stats: StatCardItem[] = [
    { label: "Credential providers", value: credentials.data.length, icon: <KeyRound size={18} /> },
    { label: "Fields set", value: setFields, icon: <Lock size={18} /> },
    { label: "Key rotations", value: Number(rotations.total) || rotations.data.length, icon: <RefreshCw size={18} /> },
    { label: "Certificates", value: certificates.data.length, icon: <ShieldCheck size={18} /> },
  ];

  const loading = credentials.loading || rotations.loading || certificates.loading;
  if (loading) {
    return (
      <DomainShell domainId="security" title="Secrets">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="security"
      title="Secrets & Encryption Keys"
      description="Platform credentials, key rotation schedules and zero-downtime TLS certificate lifecycle."
      actions={
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              credentials.reload();
              rotations.reload();
              certificates.reload();
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIssueOpen(true)}
            disabled={!canManageCerts}
          >
            <Plus size={14} />
            Issue Certificate
          </Button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>TLS / mTLS Certificates</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
            Managed certificates with automated expiry alerts and zero-downtime renewal.
          </p>
          {certificates.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {certificates.error.message}
            </p>
          ) : certificates.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No active certificate alerts" description="All issued certificates are healthy and within valid lifetime." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {certificates.data.map((c) => (
                <li key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{c.domainId}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                      Ref: {c.secretRef} · Tenant: {c.tenantId} · Expires: {new Date(c.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    <Badge variant={c.status === "ACTIVE" ? "success" : "warning"}>{c.status}</Badge>
                    {canManageCerts && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRotateCert(c.id)}
                        disabled={rotatingId === c.id}
                      >
                        <RefreshCw size={12} className={rotatingId === c.id ? "animate-spin" : ""} />
                        Rotate
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Platform credentials</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
            Providers are masked at rest and in the API response.
          </p>
          {credentials.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {credentials.error.message}
            </p>
          ) : credentials.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No platform credentials" description="The platform-credentials endpoint returned no rows." />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
              {credentials.data.map((p) => (
                <div key={p.provider ?? p.label} style={{ border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "var(--space-3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600 }}>{p.label ?? p.provider}</span>
                    <Badge variant="default">{p.provider ?? "—"}</Badge>
                  </div>
                  <ul style={{ listStyle: "none", margin: "var(--space-2) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                    {(p.fields ?? []).map((f) => (
                      <li key={f.key} style={{ display: "flex", justifyContent: "space-between", padding: "var(--space-1) 0", fontSize: "var(--text-sm)" }}>
                        <span style={{ color: "var(--color-text-secondary)" }}>{f.label ?? f.key}</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                          <span style={{ fontFamily: "monospace" }}>{f.sensitive ? "••••••••" : (f.value ?? "—")}</span>
                          <Badge variant={f.isSet ? "success" : "default"}>{f.isSet ? "Set" : "Unset"}</Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Key rotations</h3>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-sm)", margin: "var(--space-1) 0 0" }}>
            Enterprise-scale tenant encryption key rotation schedules.
          </p>
          {rotations.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {rotations.error.message}
            </p>
          ) : rotations.data.length === 0 ? (
            <div style={{ marginTop: "var(--space-3)" }}>
              <EmptyState title="No key rotations" description="The key-rotations endpoint returned no rows." />
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
              {rotations.data.map((r) => (
                <li key={r.id ?? r.name ?? r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "var(--space-2) 0", borderBottom: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.name ?? r.key ?? r.id}</div>
                    <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {r.lastRotatedAt ? `last rotated ${r.lastRotatedAt}` : "never rotated"}
                      {r.nextRotationAt ? ` · next ${r.nextRotationAt}` : ""}
                      {r.region ? ` · ${r.region}` : ""}
                    </div>
                  </div>
                  <Badge variant={r.status === "COMPLETED" ? "success" : r.status === "DUE" ? "warning" : "default"}>
                    {r.status ?? "SCHEDULED"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Issue New TLS Certificate"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-2) 0" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
            Provision a new TLS certificate and securely register the redacted secret-ref into the platform vault.
          </p>
          <FormField label="Tenant ID" required>
            <Input
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="platform"
            />
          </FormField>
          <FormField label="Fully Qualified Domain Name (FQDN)" required>
            <Input
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              placeholder="e.g. app.tenant.unierp.com"
            />
          </FormField>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Button variant="outline" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleIssueCert}
              disabled={issuing || !domainId.trim()}
            >
              {issuing ? "Issuing..." : "Issue Certificate"}
            </Button>
          </div>
        </div>
      </Modal>
    </DomainShell>
  );
}