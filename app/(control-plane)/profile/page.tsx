"use client";

import { useSession } from "@/lib/session";
import { useState } from "react";
import styles from "./page.module.css";
import { ShieldCheck, User } from "lucide-react";

export default function ProfilePage() {
  const { session } = useSession();
  const [setupMode, setSetupMode] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(session?.mfaVerified || false);

  const handleSetupMfa = async () => {
    try {
      const res = await fetch("/api/v1/auth/mfa/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to initialize MFA setup");
      const data = await res.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
      setSetupMode(true);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  const handleVerifyMfa = async () => {
    try {
      const res = await fetch("/api/v1/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: token, enable: true }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Invalid token");
      }
      setMfaEnabled(true);
      setSetupMode(false);
      // In a real scenario, this might also require refreshing the session token
    } catch (err: any) {
      setError(err.message || "Invalid token");
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Provider Profile</h1>
        <p className={styles.subtitle}>Manage your personal settings and security preferences.</p>
      </header>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <User className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Personal Information</h2>
        </div>
        <div className={styles.card}>
          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.value}>{session?.email || "admin@kannan19302.dev"}</div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Role</label>
            <div className={styles.value}>Provider Administrator</div>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <ShieldCheck className={styles.sectionIcon} />
          <h2 className={styles.sectionTitle}>Security (MFA / 2FA)</h2>
        </div>
        <div className={styles.card}>
          {mfaEnabled ? (
            <div className={styles.successState}>
              <ShieldCheck size={32} className={styles.successIcon} />
              <div className={styles.successText}>
                <strong>Multi-Factor Authentication is Enabled</strong>
                <p>Your account is protected with an extra layer of security.</p>
              </div>
            </div>
          ) : !setupMode ? (
            <div className={styles.mfaPrompt}>
              <p>MFA is not enabled on your account. Protect your provider console access by setting up a TOTP authenticator app.</p>
              <button onClick={handleSetupMfa} className={styles.buttonPrimary}>
                Set up Authenticator App
              </button>
            </div>
          ) : (
            <div className={styles.mfaSetup}>
              <h3>Scan QR Code</h3>
              <p>Open your authenticator app (like Google Authenticator or Authy) and scan this QR code.</p>
              {qrCodeUrl && (
                <div className={styles.qrCodeWrapper}>
                  <img src={qrCodeUrl} alt="MFA QR Code" />
                </div>
              )}
              <div className={styles.manualEntry}>
                <span>Manual entry code: </span>
                <code>{secret}</code>
              </div>
              <div className={styles.verifyStep}>
                <label>Enter the 6-digit code from your app</label>
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className={styles.input}
                  />
                  <button onClick={handleVerifyMfa} className={styles.buttonPrimary}>
                    Verify
                  </button>
                </div>
                {error && <div className={styles.error}>{error}</div>}
              </div>
              <button onClick={() => setSetupMode(false)} className={styles.buttonSecondary}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
