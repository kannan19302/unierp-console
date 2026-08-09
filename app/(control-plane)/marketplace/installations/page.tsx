"use client";
/**
 * Marketplace → Installations.
 *
 * Per-app installation records from the verified endpoint
 * `/platform/v1/marketplace/extensions/:appSlug/installations`, with an
 * app selector and the verified emergency-revoke action.
 */
import { useCallback, useEffect, useState } from "react";
import { RotateCw, Building2 } from "lucide-react";
import { Card, EmptyState, Spinner, Badge, usePermission } from "@kannan19302/ui";
import { api } from "@/lib/api";
import { useList, useMutation } from "@/lib/data";
import { useSession } from "@/lib/session";
import DomainShell from "@/components/domain-shell";

interface ExtensionRow {
  id?: string;
  appSlug?: string;
  appId?: string;
  status?: string;
}

interface InstallationRow {
  id?: string;
  appSlug?: string;
  appName?: string;
  status?: string;
  source?: string;
  installedAt?: string;
  installedVersion?: string;
  updatedAt?: string;
  tenant?: { id?: string; name?: string; status?: string };
}

const STATUS_VARIANT = (s?: string) =>
  s === "ACTIVE" || s === "APPROVED" || s === "PUBLISHED"
    ? "success"
    : s === "PENDING" || s === "PENDING_REVIEW" || s === "IN_REVIEW"
      ? "warning"
      : s === "DISABLED" || s === "REJECTED" || s === "FAILED"
        ? "danger"
        : "default";

export default function MarketplaceInstallationsPage() {
  const canRevoke = usePermission("admin.platform.update");
  const { session } = useSession();
  const extensions = useList<ExtensionRow>({ path: "/platform/v1/marketplace/extensions" });

  const [selected, setSelected] = useState<string>("");
  useEffect(() => {
    if (!selected && extensions.data.length > 0) {
      setSelected(extensions.data[0].appSlug ?? "");
    }
  }, [selected, extensions.data]);

  const installations = useList<InstallationRow>({
    path: selected ? `/platform/v1/marketplace/extensions/${selected}/installations` : "",
    disabled: !selected,
  });
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const revoke = useMutation(
    useCallback(
      async (args: { appSlug: string; reason: string }) => {
        await api.post(
          `/platform/v1/marketplace/extensions/${args.appSlug}/emergency-revoke`,
          { reason: args.reason, actorId: session?.userId || "SYSTEM" },
        );
      },
      [session],
    ),
  );

  const runRevoke = (appSlug: string) => {
    const reason = window.prompt("Reason for emergency revocation");
    if (!reason) return;
    setRevokeError(null);
    void revoke.run({ appSlug, reason }).then(() => installations.reload());
  };

  if (extensions.loading) {
    return (
      <DomainShell
        domainId="marketplace"
        title="Installations"
        description="Per-tenant installations of marketplace extensions."
      >
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell
      domainId="marketplace"
      title="Installations"
      description="Per-tenant installations of marketplace extensions."
    >
      <Card padding="md">
        <label
          htmlFor="app-select"
          style={{ fontSize: "var(--text-sm)", fontWeight: 600, display: "block" }}
        >
          Extension
        </label>
        <select
          id="app-select"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{
            marginTop: "var(--space-2)",
            width: "100%",
            padding: "var(--space-2)",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            background: "var(--color-bg)",
            color: "var(--color-text)",
            fontSize: "var(--text-sm)",
          }}
        >
          {extensions.data.map((e) => (
            <option key={e.appSlug ?? e.appId} value={e.appSlug ?? ""}>
              {e.appSlug ?? e.appId ?? "—"}
            </option>
          ))}
        </select>
      </Card>

      {extensions.error && (
        <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
          {extensions.error.message}
        </p>
      )}

      <Card padding="md">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--space-3)",
          }}
        >
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Installations — {selected || "—"}
          </h3>
          {canRevoke && selected && (
            <button
              onClick={() => runRevoke(selected)}
              disabled={revoke.loading}
              title="Emergency revoke this extension everywhere"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "var(--space-1)",
                padding: "var(--space-1) var(--space-2)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "transparent",
                color: "var(--color-danger)",
                fontSize: "var(--text-sm)",
                cursor: "pointer",
              }}
            >
              <RotateCw size={14} /> Emergency revoke
            </button>
          )}
        </div>
        {(revoke.error || revokeError) && (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {revokeError ?? revoke.error?.message}
          </p>
        )}
        {installations.loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-10)" }}>
            <Spinner size="md" />
          </div>
        ) : installations.error ? (
          <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)" }}>
            {installations.error.message}
          </p>
        ) : installations.data.length === 0 ? (
          <EmptyState
            title="No installations"
            description="This extension has no installation records."
          />
        ) : (
          <ul
            style={{
              listStyle: "none",
              margin: "var(--space-3) 0 0",
              padding: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {installations.data.map((inst) => (
              <li
                key={inst.id ?? inst.tenant?.id ?? "?"}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: "var(--space-4)",
                  alignItems: "center",
                  padding: "var(--space-3) 0",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)", minWidth: 0 }}>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      fontWeight: 600,
                    }}
                  >
                    <Building2 size={14} />
                    {inst.tenant?.name ?? "—"}
                  </span>
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                    {inst.appName ?? inst.appSlug ?? "—"} · v{inst.installedVersion ?? "—"} ·{" "}
                    {inst.source ?? "CATALOG"} · {inst.installedAt ?? ""}
                  </span>
                </div>
                <Badge variant={STATUS_VARIANT(inst.status)}>{inst.status ?? "UNKNOWN"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DomainShell>
  );
}