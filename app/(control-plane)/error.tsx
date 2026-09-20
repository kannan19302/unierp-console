"use client";

/**
 * Control-plane error boundary — catches errors in any PCC domain page.
 * The console shell (sidebar) is preserved since this is inside the layout.
 */
import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";
import styles from "./error.module.css";

export default function ControlPlaneError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to telemetry in production
    console.error("[ControlPlane Error]", error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle}>
          <AlertTriangle size={28} />
        </div>
        <h2 className={styles.title}>Something went wrong</h2>
        <p className={styles.message}>
          An error occurred in the control plane. Your sidebar and navigation
          remain available — you can retry or navigate to another section.
        </p>
        {process.env.NODE_ENV === "development" && error?.message && (
          <pre className={styles.errorDetail}>{error.message}</pre>
        )}
        <div className={styles.actions}>
          <button onClick={reset} className={styles.retryBtn}>
            <RotateCcw size={14} />
            Retry
          </button>
          <Link href="/" className={styles.homeLink}>
            <Home size={14} />
            Go to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
