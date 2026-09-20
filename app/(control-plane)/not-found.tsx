/**
 * Control-plane 404 handler.
 * Shows when a route under /(control-plane) doesn't match any page.
 */
import Link from "next/link";
import styles from "./error.module.css";

export default function NotFound() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.iconCircle} style={{ background: "rgba(99, 102, 241, 0.1)", color: "var(--color-primary)" }}>
          <span style={{ fontSize: 28, lineHeight: 1 }}>404</span>
        </div>
        <h2 className={styles.title}>Page not found</h2>
        <p className={styles.message}>
          The page you&apos;re looking for doesn&apos;t exist in the control plane.
          It may have been moved or the URL is incorrect.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.homeLink} style={{ background: "var(--color-primary)", color: "#fff", border: "none" }}>
            Go to Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
