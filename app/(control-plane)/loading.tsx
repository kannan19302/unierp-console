/**
 * Route transition loading state for the control-plane.
 * Shows a consistent skeleton while page components resolve.
 */
import { Spinner } from "@kannan19302/ui";

export default function ControlPlaneLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "var(--space-3)",
        color: "var(--color-text-secondary)",
        fontSize: "var(--text-sm)",
      }}
    >
      <Spinner size="md" />
      <span>Loading…</span>
    </div>
  );
}
