"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import styles from "./ImpersonationBanner.module.css";

export interface ImpersonationBannerProps {
  tenantName?: string;
  onEndImpersonation?: () => void;
}

export function ImpersonationBanner({
  tenantName: propTenantName,
  onEndImpersonation,
}: ImpersonationBannerProps) {
  const [tenantName, setTenantName] = useState<string | null>(propTenantName ?? null);

  useEffect(() => {
    if (propTenantName !== undefined) {
      setTenantName(propTenantName);
      return;
    }

    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("unierp_impersonated_tenant");
      setTenantName(stored);
    }
  }, [propTenantName]);

  const handleEnd = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("unierp_impersonated_tenant");
      sessionStorage.removeItem("unierp_impersonated_tenant_id");
    }
    setTenantName(null);
    onEndImpersonation?.();
  };

  if (!tenantName) return null;

  return (
    <aside className={styles.banner} role="alert" aria-label="Tenant Impersonation Warning">
      <div className={styles.left}>
        <AlertTriangle size={16} className={styles.warningIcon} />
        <span>
          You are currently impersonating tenant: <span className={styles.tenantName}>{tenantName}</span>. All actions will be logged under your provider identity with an impersonation trail.
        </span>
      </div>
      <button type="button" className={styles.endButton} onClick={handleEnd}>
        End Impersonation
      </button>
    </aside>
  );
}
