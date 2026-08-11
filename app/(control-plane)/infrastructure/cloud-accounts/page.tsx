"use client";
/**
 * Infrastructure → Cloud Accounts.
 * M16 — onboard a cloud provider account through the console. A second
 * account of a DIFFERENT provider is the same form, same endpoint, same
 * code path — only the field values differ (see CloudAccountService).
 */
import { useState } from "react";
import {
  Card,
  Badge,
  Input,
  Select,
  Button,
  TagInput,
  DataTable,
  FilterBar,
  ErrorState,
  ForbiddenState,
  usePermission,
  useToast,
} from "@kannan19302/ui";
import { useList, useMutation } from "@/lib/data";
import { api } from "@/lib/api";
import DomainShell from "@/components/domain-shell";

interface CloudAccountResource {
  id: string;
  name: string;
  kindName: string;
  createdAt: string;
}

const PROVIDER_TYPES = ["aws", "azure", "gcp", "oci", "other"];

export default function InfrastructureCloudAccounts() {
  const canRead = usePermission("system.estate.read");
  const canOnboard = usePermission("system.cloudaccount.onboard");
  const toast = useToast();

  const accounts = useList<CloudAccountResource>({
    path: "/platform/v1/cloud-accounts",
    disabled: !canRead,
  });

  const [accountName, setAccountName] = useState("");
  const [providerType, setProviderType] = useState("aws");
  const [secretRef, setSecretRef] = useState("");
  const [inventoryKinds, setInventoryKinds] = useState<string[]>([]);

  const onboard = useMutation(async () =>
    api.post("/platform/v1/cloud-accounts", { accountName, providerType, secretRef, inventoryKinds }),
  );

  const canSubmit = accountName.trim() && secretRef.trim() && inventoryKinds.length > 0;

  const submit = async () => {
    try {
      await onboard.run(undefined);
      toast.success(`${accountName} onboarded`, `${inventoryKinds.length} inventory kind(s) discovered`);
      setAccountName("");
      setSecretRef("");
      setInventoryKinds([]);
      accounts.reload();
    } catch (e) {
      toast.error("Onboarding failed", e instanceof Error ? e.message : String(e));
    }
  };

  if (!canRead) {
    return (
      <DomainShell domainId="infrastructure" title="Infrastructure · Cloud Accounts" description="Onboard and inventory cloud provider accounts.">
        <ForbiddenState />
      </DomainShell>
    );
  }

  return (
    <DomainShell domainId="infrastructure" title="Infrastructure · Cloud Accounts" description="Onboard and inventory cloud provider accounts.">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {canOnboard && (
          <Card padding="md">
            <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>Onboard a cloud account</h3>
            <FilterBar>
              <Input placeholder="Account name" value={accountName} onChange={(e: any) => setAccountName(e.target.value)} />
              <Select value={providerType} onChange={(e: any) => setProviderType(e.target.value)}>
                {PROVIDER_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
              <Input placeholder="Credential secret-ref (e.g. vault://...)" value={secretRef} onChange={(e: any) => setSecretRef(e.target.value)} />
            </FilterBar>
            <div style={{ margin: "var(--space-3) 0" }}>
              <TagInput
                tags={inventoryKinds}
                onChange={setInventoryKinds}
                placeholder="Inventory kinds this account reports (e.g. ec2-instance, s3-bucket) — press Enter"
              />
            </div>
            <Button variant="primary" onClick={submit} disabled={!canSubmit || onboard.loading}>
              Onboard account
            </Button>
          </Card>
        )}

        <Card padding="md">
          <h3 style={{ margin: "0 0 var(--space-3)", fontSize: "var(--text-base)", fontWeight: 600 }}>Onboarded accounts</h3>
          {accounts.error ? (
            <ErrorState description={accounts.error.message} onRetry={accounts.reload} />
          ) : (
            <DataTable<CloudAccountResource>
              columns={[
                { key: "name", header: "Account", render: (row) => row.name },
                { key: "kindName", header: "Kind", render: (row) => <Badge variant="default">{row.kindName}</Badge> },
                { key: "createdAt", header: "Onboarded", render: (row) => new Date(row.createdAt).toLocaleString() },
              ]}
              data={accounts.data}
              loading={accounts.loading}
              rowKey={(row) => row.id}
              emptyTitle="No cloud accounts yet"
              emptyMessage="Onboard one above to see its inventory appear here and in the estate view."
            />
          )}
        </Card>
      </div>
    </DomainShell>
  );
}
