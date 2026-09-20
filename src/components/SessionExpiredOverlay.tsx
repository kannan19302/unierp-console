"use client";

import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";
import styles from "./SessionExpiredOverlay.module.css";

export interface SessionExpiredOverlayProps {
  open: boolean;
  onSignInAgain?: () => void;
  autoRedirectSeconds?: number;
}

export function SessionExpiredOverlay({
  open,
  onSignInAgain,
  autoRedirectSeconds = 30,
}: SessionExpiredOverlayProps) {
  const [countdown, setCountdown] = useState(autoRedirectSeconds);

  useEffect(() => {
    if (!open) {
      setCountdown(autoRedirectSeconds);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSignIn();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, autoRedirectSeconds]);

  const handleSignIn = () => {
    if (onSignInAgain) {
      onSignInAgain();
    } else if (typeof window !== "undefined") {
      const current = window.location.pathname + window.location.search;
      window.location.href = `/login?returnTo=${encodeURIComponent(current)}`;
    }
  };

  if (!open) return null;

  return (
    <div className={styles.overlay} role="alertdialog" aria-modal="true" aria-labelledby="session-expired-title">
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <Lock size={24} />
        </div>
        <h2 id="session-expired-title" className={styles.title}>
          Session Expired
        </h2>
        <p className={styles.description}>
          Your control-plane credentials have expired or were revoked. Please sign in again to continue managing platform resources.
        </p>
        <button type="button" className={styles.button} onClick={handleSignIn}>
          Sign In Again
        </button>
        <div className={styles.countdown}>
          Auto-redirecting in {countdown}s...
        </div>
      </div>
    </div>
  );
}
