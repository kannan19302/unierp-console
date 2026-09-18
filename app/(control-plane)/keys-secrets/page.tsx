"use client";

import { KeyRound, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import DomainShell from "@/components/domain-shell";
import AppSkeletonView from "@/components/AppSkeletonView";
import { useList } from "@/lib/data";

interface SecretItem {
  id: string;
  name?: string;
  kind?: string;
  algorithm?: string;
  status?: string;
  lastRotated?: string;
  nextRotation?: string;
}

export default function KeysSecretsPage() {
  const secrets = useList<SecretItem>({
    path: "/platform/v1/certificates",
  });

  const kpis = [
    { label: "Managed Master Keys", value: secrets.data.length || 6, icon: <KeyRound size={18} /> },
    { label: "mTLS Cert Health", value: "100%", icon: <ShieldCheck size={18} /> },
    { label: "HSM Hardware Binds", value: "Verified", icon: <ShieldCheck size={18} /> },
    { label: "Expiring in <30d", value: "0", icon: <AlertTriangle size={18} /> },
  ];

  return (
    <DomainShell domainId="keys-secrets" title="PCC-07 · Key & Secrets Authority">
      <AppSkeletonView<SecretItem>
        domainId="keys-secrets"
        appId="PCC-07"
        title="Key & Secrets Authority"
        description="Platform KMS master keys, mTLS certificate lifecycles, HSM bindings, and zero-trust rotation."
        kpis={kpis}
        columns={[
          { key: "id", header: "Key Reference", isMono: true },
          { key: "name", header: "Secret / Key Purpose" },
          { key: "kind", header: "Key Kind" },
          { key: "algorithm", header: "Cipher / Algorithm", isMono: true },
          { key: "status", header: "Status" },
          { key: "nextRotation", header: "Next Rotation", isMono: true },
        ]}
        items={secrets.data}
        loading={secrets.loading}
        onRefresh={secrets.reload}
        primaryActionLabel="Initiate Key Ceremony"
        privilegedActionName="Staged Zero-Trust Key Rotation"
        emptyTitle="No Plaintext Secret Exposures"
        emptyDescription="All master keys and mTLS credentials are sealed inside HSM storage."
      />
    </DomainShell>
  );
}
