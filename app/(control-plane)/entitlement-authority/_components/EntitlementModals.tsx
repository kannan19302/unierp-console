"use client";

import { useState } from "react";
import { Button } from "@kannan19302/ui";
import styles from "../entitlement-authority.module.css";
import type { LicensePool } from "@/lib/entitlement-schema";
import { MODULE_COLUMNS } from "@/lib/fixtures/entitlements";

interface EntitlementModalsProps {
  // Create Pool
  isCreatePoolOpen: boolean;
  onCloseCreatePool: () => void;
  onCreatePool: (data: {
    name: string;
    moduleCode: string;
    totalSeats: number;
    tier: "STANDARD" | "PREMIUM" | "ENTERPRISE";
  }) => Promise<void>;

  // Allocate Seats
  allocateTargetPool: LicensePool | null;
  onCloseAllocateSeats: () => void;
  onAllocateSeats: (poolId: string, tenantId: string, seatCount: number) => Promise<void>;

  // Issue License
  isIssueLicenseOpen: boolean;
  onCloseIssueLicense: () => void;
  onGenerateLicense: (data: {
    tenantId: string;
    tenantName: string;
    maxSeats: number;
    validDays: number;
    machineFingerprint: string;
    allowedModules: string[];
  }) => Promise<void>;
}

export function EntitlementModals({
  isCreatePoolOpen,
  onCloseCreatePool,
  onCreatePool,
  allocateTargetPool,
  onCloseAllocateSeats,
  onAllocateSeats,
  isIssueLicenseOpen,
  onCloseIssueLicense,
  onGenerateLicense,
}: EntitlementModalsProps) {
  // Create Pool State
  const [newPoolName, setNewPoolName] = useState("");
  const [newPoolModule, setNewPoolModule] = useState("core-erp");
  const [newPoolSeats, setNewPoolSeats] = useState(1000);
  const [newPoolTier, setNewPoolTier] = useState<"STANDARD" | "PREMIUM" | "ENTERPRISE">("ENTERPRISE");
  const [isSubmittingPool, setIsSubmittingPool] = useState(false);

  // Allocate Seats State
  const [allocateTenantId, setAllocateTenantId] = useState("00000000-0000-0000-0000-000000000001");
  const [allocateSeatCount, setAllocateSeatCount] = useState(50);
  const [isSubmittingAllocation, setIsSubmittingAllocation] = useState(false);

  // Issue Offline License State
  const [licTenantId, setLicTenantId] = useState("");
  const [licTenantName, setLicTenantName] = useState("");
  const [licSeats, setLicSeats] = useState(250);
  const [licValidDays, setLicValidDays] = useState(365);
  const [licFingerprint, setLicFingerprint] = useState("");
  const [licModules, setLicModules] = useState<string[]>(["core-erp", "finance-ledger"]);
  const [isGeneratingLicense, setIsGeneratingLicense] = useState(false);

  const handlePoolSubmit = async () => {
    setIsSubmittingPool(true);
    try {
      await onCreatePool({
        name: newPoolName,
        moduleCode: newPoolModule,
        totalSeats: Number(newPoolSeats),
        tier: newPoolTier,
      });
      setNewPoolName("");
      onCloseCreatePool();
    } finally {
      setIsSubmittingPool(false);
    }
  };

  const handleAllocateSubmit = async () => {
    if (!allocateTargetPool) return;
    setIsSubmittingAllocation(true);
    try {
      await onAllocateSeats(allocateTargetPool.id, allocateTenantId, Number(allocateSeatCount));
      onCloseAllocateSeats();
    } finally {
      setIsSubmittingAllocation(false);
    }
  };

  const handleLicenseSubmit = async () => {
    setIsGeneratingLicense(true);
    try {
      await onGenerateLicense({
        tenantId: licTenantId,
        tenantName: licTenantName,
        maxSeats: Number(licSeats),
        validDays: Number(licValidDays),
        machineFingerprint: licFingerprint || "ANY",
        allowedModules: licModules,
      });
      setLicTenantId("");
      setLicTenantName("");
      onCloseIssueLicense();
    } finally {
      setIsGeneratingLicense(false);
    }
  };

  return (
    <>
      {/* Modal: Create License Pool */}
      {isCreatePoolOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div>
              <h3 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700 }}>
                Create License Pool
              </h3>
              <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Define a shared seat pool for a specific platform capability module.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Pool Name
                </label>
                <input
                  type="text"
                  value={newPoolName}
                  onChange={(e) => setNewPoolName(e.target.value)}
                  placeholder="e.g. Supply Chain Mobile Barcode Seats"
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Module Capability
                </label>
                <select
                  value={newPoolModule}
                  onChange={(e) => setNewPoolModule(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  {MODULE_COLUMNS.map((col) => (
                    <option key={col.code} value={col.code}>
                      {col.label} ({col.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Total Seat Capacity
                </label>
                <input
                  type="number"
                  value={newPoolSeats}
                  onChange={(e) => setNewPoolSeats(Number(e.target.value))}
                  min={1}
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Tier
                </label>
                <select
                  value={newPoolTier}
                  onChange={(e) => setNewPoolTier(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  <option value="STANDARD">Standard</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="outline" onClick={onCloseCreatePool}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handlePoolSubmit}
                disabled={isSubmittingPool}
              >
                {isSubmittingPool ? "Creating..." : "Create Pool"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Allocate Seats */}
      {allocateTargetPool && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div>
              <h3 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700 }}>
                Allocate Seats from Pool
              </h3>
              <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Assign seat quota from <strong>{allocateTargetPool.name}</strong> to a customer tenant.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div style={{ padding: "var(--space-3)", background: "var(--color-bg-subtle)", borderRadius: "var(--radius-md)", fontSize: "var(--text-xs)" }}>
                <div>Available Capacity: <strong>{allocateTargetPool.availableSeats} seats</strong></div>
                <div>Module Code: <span className={styles.monoBadge}>{allocateTargetPool.moduleCode}</span></div>
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Target Tenant ID
                </label>
                <input
                  type="text"
                  value={allocateTenantId}
                  onChange={(e) => setAllocateTenantId(e.target.value)}
                  placeholder="Tenant UUID"
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Seats to Allocate
                </label>
                <input
                  type="number"
                  value={allocateSeatCount}
                  onChange={(e) => setAllocateSeatCount(Number(e.target.value))}
                  min={1}
                  max={allocateTargetPool.availableSeats}
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="outline" onClick={onCloseAllocateSeats}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAllocateSubmit}
                disabled={isSubmittingAllocation}
              >
                {isSubmittingAllocation ? "Allocating..." : "Confirm Allocation"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Issue Cryptographic License */}
      {isIssueLicenseOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div>
              <h3 style={{ margin: 0, fontSize: "var(--text-xl)", fontWeight: 700 }}>
                Issue Cryptographic Offline License
              </h3>
              <p style={{ margin: "var(--space-1) 0 0", fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
                Generate an HMAC-SHA256 signed license payload for air-gapped or Sovereign GovCloud installations.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Tenant Scope UUID
                </label>
                <input
                  type="text"
                  value={licTenantId}
                  onChange={(e) => setLicTenantId(e.target.value)}
                  placeholder="e.g. 00000000-0000-0000-0000-000000000001"
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Tenant / Organization Name
                </label>
                <input
                  type="text"
                  value={licTenantName}
                  onChange={(e) => setLicTenantName(e.target.value)}
                  placeholder="e.g. Acme Defense Air-Gap Cell 01"
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Seat Limit
                  </label>
                  <input
                    type="number"
                    value={licSeats}
                    onChange={(e) => setLicSeats(Number(e.target.value))}
                    min={1}
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                    Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={licValidDays}
                    onChange={(e) => setLicValidDays(Number(e.target.value))}
                    min={1}
                    style={{
                      width: "100%",
                      padding: "var(--space-2)",
                      borderRadius: "var(--radius-md)",
                      border: "0.0625rem solid var(--color-border)",
                      fontSize: "var(--text-sm)",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Hardware Fingerprint (Optional)
                </label>
                <input
                  type="text"
                  value={licFingerprint}
                  onChange={(e) => setLicFingerprint(e.target.value)}
                  placeholder="e.g. SHA256:7f83b1657ff1fc53b92dc18148a1d..."
                  style={{
                    width: "100%",
                    padding: "var(--space-2)",
                    borderRadius: "var(--radius-md)",
                    border: "0.0625rem solid var(--color-border)",
                    fontSize: "var(--text-sm)",
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "var(--text-xs)", fontWeight: 600, display: "block", marginBottom: "var(--space-1)" }}>
                  Licensed Modules
                </label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
                  {MODULE_COLUMNS.map((col) => {
                    const selected = licModules.includes(col.code);
                    return (
                      <button
                        key={col.code}
                        type="button"
                        className={`${styles.moduleChip} ${selected ? styles.moduleChipActive : ""}`}
                        onClick={() => {
                          if (selected) {
                            setLicModules(licModules.filter((m) => m !== col.code));
                          } else {
                            setLicModules([...licModules, col.code]);
                          }
                        }}
                      >
                        {col.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
              <Button variant="outline" onClick={onCloseIssueLicense}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleLicenseSubmit}
                disabled={isGeneratingLicense}
              >
                {isGeneratingLicense ? "Signing Key..." : "Generate & Sign License"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
