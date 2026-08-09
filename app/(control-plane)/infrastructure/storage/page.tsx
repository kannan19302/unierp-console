"use client";
/**
 * Infrastructure → Storage.
 * Storage volumes and the physical drives backing them. Real data from the
 * storage and drive endpoints.
 */
import { HardDrive, HardDriveDownload, Database, MapPin } from "lucide-react";
import { Card, EmptyState, Spinner, StatCardRow, Badge, type StatCardItem } from "@kannan19302/ui";
import { useList } from "@/lib/data";
import DomainShell from "@/components/domain-shell";

interface StorageVolume {
  id?: string;
  name?: string;
  volume?: string;
  type?: string;
  tier?: string;
  capacity?: string | number;
  used?: string | number;
  freeSpace?: string | number;
  region?: string;
  status?: string;
}

interface DriveRow {
  id?: string;
  name?: string;
  device?: string;
  mount?: string;
  mountPoint?: string;
  filesystem?: string;
  fsType?: string;
  capacity?: string | number;
  used?: string | number;
  status?: string;
}

export default function InfrastructureStorage() {
  const storage = useList<StorageVolume>({ path: "/storage" });
  const drives = useList<DriveRow>({ path: "/drive" });

  const regionCount = new Set(storage.data.map((v) => v.region).filter(Boolean)).size;

  const stats: StatCardItem[] = [
    { label: "Volumes", value: storage.data.length, icon: <HardDrive size={18} /> },
    { label: "Drives", value: drives.data.length, icon: <HardDriveDownload size={18} /> },
    { label: "Storage regions", value: regionCount || "—", icon: <MapPin size={18} /> },
    { label: "Volume types", value: new Set(storage.data.map((v) => v.type ?? v.tier).filter(Boolean)).size || "—", icon: <Database size={18} /> },
  ];

  if (storage.loading || drives.loading) {
    return (
      <DomainShell domainId="infrastructure" title="Storage" description="Persistent volumes and the drives backing them across regions.">
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-12)" }}>
          <Spinner size="md" />
        </div>
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Storage" description="Persistent volumes and the drives backing them across regions.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        <StatCardRow stats={stats} columns={4} />

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Storage volumes</h3>
          {storage.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {storage.error.message}
            </p>
          ) : storage.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No storage volumes" description="The storage endpoint returned no volumes." />
            </div>
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
              {storage.data.slice(0, 30).map((v) => (
                <li
                  key={v.id ?? v.name ?? v.volume ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{v.name ?? v.volume ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {v.type ?? v.tier ? ` · ${v.type ?? v.tier}` : ""}
                      {v.region ? ` · ${v.region}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {v.capacity != null ? `${v.capacity} capacity` : ""}
                      {v.used != null ? ` · ${v.used} used` : ""}
                      {v.used != null && v.capacity != null ? ` · ${Math.round((Number(v.used) / Number(v.capacity || 1)) * 100)}%` : ""}
                    </span>
                    <Badge
                      variant={
                        v.status === "ACTIVE" || v.status === "READY"
                          ? "success"
                          : v.status === "LOW" || v.status === "DEGRADED"
                            ? "warning"
                            : v.status === "FAILED" || v.status === "OFFLINE"
                              ? "danger"
                              : "default"
                      }
                    >
                      {v.status ?? "UNKNOWN"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="md">
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Attached drives</h3>
          {drives.error ? (
            <p style={{ color: "var(--color-danger)", fontSize: "var(--text-sm)", margin: "var(--space-3) 0 0" }}>
              {drives.error.message}
            </p>
          ) : drives.data.length === 0 ? (
            <div style={{ margin: "var(--space-3) 0 0" }}>
              <EmptyState title="No drives attached" description="The drive endpoint returned no rows." />
            </div>
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
              {drives.data.slice(0, 30).map((d) => (
                <li
                  key={d.id ?? d.name ?? d.device ?? "?"}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "var(--space-2) 0",
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <span style={{ fontWeight: 500 }}>{d.name ?? d.device ?? "—"}</span>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-muted)" }}>
                      {d.mount ?? d.mountPoint ? ` · ${d.mount ?? d.mountPoint}` : ""}
                      {d.filesystem ?? d.fsType ? ` · ${d.filesystem ?? d.fsType}` : ""}
                    </span>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                      {d.capacity != null ? `${d.capacity} capacity` : ""}
                      {d.used != null ? ` · ${d.used} used` : ""}
                    </span>
                    <Badge variant={d.status === "HEALTHY" || d.status === "MOUNTED" ? "success" : d.status === "UNHEALTHY" ? "danger" : "default"}>
                      {d.status ?? "UNKNOWN"}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DomainShell>
  );
}