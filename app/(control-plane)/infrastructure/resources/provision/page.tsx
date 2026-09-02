"use client";
/**
 * Infrastructure → Resources → Provision.
 * M21 — provision, scale/migrate and deprovision compute, storage and
 * network resources from the console. Existing resources are listed via
 * M15's estate search filtered by these four kinds; lifecycle actions
 * (change, deprovision) call the M21 API, which runs them as durable,
 * reversible plans (M09/M12) rather than direct writes.
 */
import { useState } from "react";
import {
  Card,
  Badge,
  Input,
  Select,
  Button,
  DataTable,
  FilterBar,
  ConfirmDialog,
  ErrorState,
  ForbiddenState,
  DropdownMenu,
  usePermission,
  useToast,
} from "@kannan19302/ui";
import { useList, useMutation } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

const KINDS = ["compute-instance", "storage-volume", "network-vpc", "firewall-rule"] as const;
type Kind = (typeof KINDS)[number];

interface EstateResource {
  id: string;
  name: string;
  kindName: string;
  createdAt: string;
}

export default function InfrastructureResourceProvisioning() {
  const canRead = usePermission("system.infrastructure.read");
  const canProvision = usePermission("system.infrastructure.provision");
  const toast = useToast();

  const [kindFilter, setKindFilter] = useState<Kind | "all">("all");
  const resources = useList<EstateResource>({
    path: "/platform/v1/estate/resources",
    params: { kind: kindFilter === "all" ? undefined : kindFilter, limit: 100 },
    disabled: !canRead,
  });

  // Provision form state.
  const [kind, setKind] = useState<Kind>("compute-instance");
  const [name, setName] = useState("");
  const [sizeField, setSizeField] = useState("");

  const provision = useMutation(async () =>
    api.post("/platform/v1/infrastructure-resources", { kind, name, initialState: { size: sizeField || "default" } }),
  );

  const submitProvision = async () => {
    try {
      await provision.run(undefined);
      toast.success(`${name} provisioned`);
      setName("");
      setSizeField("");
      resources.reload();
    } catch (e) {
      toast.error("Provisioning failed", e instanceof Error ? e.message : String(e));
    }
  };

  const [scaleTarget, setScaleTarget] = useState<EstateResource | null>(null);
  const [scaleValue, setScaleValue] = useState("");
  const scale = useMutation(async () =>
    api.post(`/platform/v1/infrastructure-resources/${scaleTarget!.id}/change`, { newState: { size: scaleValue } }),
  );
  const submitScale = async () => {
    try {
      const result = (await scale.run(undefined)) as { job: { status: string } };
      if (result.job.status === "DONE") {
        toast.success(`${scaleTarget!.name} updated`);
      } else {
        toast.warning(`${scaleTarget!.name} change rolled back`, `Job ended ${result.job.status} — desired state reverted.`);
      }
      setScaleTarget(null);
      setScaleValue("");
      resources.reload();
    } catch (e) {
      toast.error("Change failed", e instanceof Error ? e.message : String(e));
    }
  };

  const [deprovisionTarget, setDeprovisionTarget] = useState<EstateResource | null>(null);
  const deprovision = useMutation(async () => api.del(`/platform/v1/infrastructure-resources/${deprovisionTarget!.id}`));
  const submitDeprovision = async () => {
    try {
      await deprovision.run(undefined);
      toast.success(`${deprovisionTarget!.name} deprovisioned`);
      setDeprovisionTarget(null);
      resources.reload();
    } catch (e) {
      toast.error("Deprovision refused", e instanceof Error ? e.message : String(e));
      setDeprovisionTarget(null);
    }
  };

  if (!canRead) {
    return (
      <DomainShell domainId="infrastructure" title="Infrastructure · Provision" description="Provision, scale, migrate and deprovision compute, storage and network resources.">
        <ForbiddenState />
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Infrastructure · Provision" description="Provision, scale, migrate and deprovision compute, storage and network resources.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {canProvision && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>Provision a resource</h3>
            <FilterBar>
              <Select value={kind} onChange={(e: any) => setKind(e.target.value)}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </Select>
              <Input placeholder="Name" value={name} onChange={(e: any) => setName(e.target.value)} />
              <Input placeholder="Size / initial value" value={sizeField} onChange={(e: any) => setSizeField(e.target.value)} />
            </FilterBar>
            <Button variant="primary" onClick={submitProvision} disabled={!name.trim() || provision.loading}>
              Provision
            </Button>
          </Card>
        )}

        <FilterBar onClearAll={() => setKindFilter("all")}>
          <Select value={kindFilter} onChange={(e: any) => setKindFilter(e.target.value)}>
            <option value="all">All kinds</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </Select>
        </FilterBar>

        <Card padding="md">
          {resources.error ? (
            <ErrorState description={resources.error.message} onRetry={resources.reload} />
          ) : (
            <DataTable<EstateResource>
              columns={[
                { key: "name", header: "Name", render: (row) => row.name },
                { key: "kindName", header: "Kind", render: (row) => <Badge variant="default">{row.kindName}</Badge> },
                { key: "createdAt", header: "Created", render: (row) => new Date(row.createdAt).toLocaleString() },
                ...(canProvision
                  ? [
                      {
                        key: "actions",
                        header: "",
                        render: (row: EstateResource) => (
                          <DropdownMenu
                            trigger={<Button variant="ghost" size="sm">Actions</Button>}
                            items={[
                              { key: "scale", label: "Scale / migrate", onClick: () => setScaleTarget(row) },
                              { key: "deprovision", label: "Deprovision", danger: true, onClick: () => setDeprovisionTarget(row) },
                            ]}
                          />
                        ),
                      },
                    ]
                  : []),
              ]}
              data={resources.data}
              loading={resources.loading}
              rowKey={(row) => row.id}
              emptyTitle="No resources provisioned yet"
              emptyMessage="Provision one above to see it here."
            />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!scaleTarget}
        onClose={() => setScaleTarget(null)}
        onConfirm={submitScale}
        title={`Scale / migrate ${scaleTarget?.name ?? ""}`}
        message={
          <Input placeholder="New size / target value" value={scaleValue} onChange={(e: any) => setScaleValue(e.target.value)} />
        }
        confirmLabel="Apply"
        isLoading={scale.loading}
      />

      <ConfirmDialog
        open={!!deprovisionTarget}
        onClose={() => setDeprovisionTarget(null)}
        onConfirm={submitDeprovision}
        title={`Deprovision ${deprovisionTarget?.name ?? ""}?`}
        message="Refused if any other resource depends on this one — the dependents will be named in the error."
        confirmLabel="Deprovision"
        variant="danger"
        isLoading={deprovision.loading}
      />
    </DomainShell>
  );
}
