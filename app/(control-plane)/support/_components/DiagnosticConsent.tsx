"use client";

import {
  Lock,
  ShieldCheck,
  Eye,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  useToast,
} from "@kannan19302/ui";
import styles from "../support.module.css";
import type { DiagnosticConsent as DiagnosticConsentType } from "@/lib/support-schema";

interface DiagnosticConsentProps {
  consents: DiagnosticConsentType[];
  canWriteSupport: boolean;
  onOpenConsentModal: () => void;
  onGrantConsent: (id: string) => Promise<void>;
  activeReplaySession: string | null;
  setActiveReplaySession: (id: string | null) => void;
  replayPlaying: boolean;
  setReplayPlaying: (playing: boolean) => void;
}

export function DiagnosticConsent({
  consents,
  canWriteSupport,
  onOpenConsentModal,
  onGrantConsent,
  activeReplaySession,
  setActiveReplaySession,
  replayPlaying,
  setReplayPlaying,
}: DiagnosticConsentProps) {
  const toast = useToast();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      <div className={styles.actionHeader}>
        <div>
          <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>
            Tenant Diagnostic Access Authorizations
          </h3>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
            Zero-standing privilege diagnostic requests. Requires tenant admin consent before session replay or log streaming.
          </p>
        </div>
        {canWriteSupport && (
          <Button variant="primary" size="sm" onClick={onOpenConsentModal}>
            <Lock size={14} />
            Request Diagnostic Consent
          </Button>
        )}
      </div>

      {/* Consents table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Consent ID</th>
              <th className={styles.th}>Tenant</th>
              <th className={styles.th}>Diagnostic Scope</th>
              <th className={styles.th}>Reason / Justification</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Expires At</th>
              <th className={styles.th} style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {consents.map((c) => (
              <tr key={c.id} className={styles.tr}>
                <td className={styles.td}>
                  <span className={styles.monoBadge}>{c.id}</span>
                </td>
                <td className={styles.td}>
                  <strong>{c.tenantName || c.tenantId}</strong>
                </td>
                <td className={styles.td}>
                  <Badge variant="default">{c.scope}</Badge>
                </td>
                <td className={styles.td} style={{ maxWidth: "20rem" }}>
                  <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text)" }}>
                    {c.reason}
                  </span>
                </td>
                <td className={styles.td}>
                  <Badge
                    variant={
                      c.status === "GRANTED"
                        ? "success"
                        : c.status === "PENDING"
                          ? "warning"
                          : "danger"
                    }
                  >
                    {c.status}
                  </Badge>
                </td>
                <td className={styles.td} style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>
                  {new Date(c.expiresAt).toLocaleTimeString()}
                </td>
                <td className={styles.td} style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)" }}>
                    {c.status === "PENDING" && canWriteSupport && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onGrantConsent(c.id)}
                      >
                        <ShieldCheck size={13} />
                        Simulate Grant
                      </Button>
                    )}
                    {c.status === "GRANTED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveReplaySession(c.id);
                          setReplayPlaying(true);
                          toast.info("Replay Loaded", `Session telemetry loaded for ${c.tenantId}.`);
                        }}
                      >
                        <Eye size={13} />
                        Launch Viewer
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Diagnostic Session Replay Player */}
      {activeReplaySession && (
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <Eye size={18} color="var(--color-primary)" />
              <h4 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 600 }}>
                Session Replay & DOM Telemetry Stream: [{activeReplaySession}]
              </h4>
            </div>
            <div style={{ display: "flex", gap: "var(--space-2)" }}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReplayPlaying(!replayPlaying)}
              >
                {replayPlaying ? <Pause size={13} /> : <Play size={13} />}
                {replayPlaying ? "Pause" : "Play"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplayPlaying(false);
                  toast.info("Reset", "Replay seek head reset to T+00:00.");
                }}
              >
                <RotateCcw size={13} />
                Rewind
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setActiveReplaySession(null)}
              >
                Close Viewer
              </Button>
            </div>
          </div>

          <div className={styles.replayViewer}>
            <p style={{ margin: 0, fontWeight: 500, color: "var(--color-text)" }}>
              {replayPlaying ? "▶ Playing Diagnostic Event Stream (1.0x)" : "⏸ Diagnostic Stream Paused"}
            </p>
            <p style={{ margin: 0, fontSize: "var(--text-xs)" }}>
              Masked DOM mutations, network requests, and Redux actions recorded under authorized diagnostic scope.
            </p>
            <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)", fontSize: "var(--text-xs)" }}>
              <span className={styles.monoBadge}>DOM Events: 247</span>
              <span className={styles.monoBadge}>XHR/Fetch: 14</span>
              <span className={styles.monoBadge}>Errors: 1 (Unhandled 504)</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
