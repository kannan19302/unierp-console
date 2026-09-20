"use client";

/**
 * Global error boundary — catches any error that escapes all route-level boundaries.
 * Next.js requires this file at app/global-error.tsx to handle root-level failures.
 * Must render its own <html>/<body> since the root layout itself may have crashed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" data-theme="strata-dark">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
          backgroundColor: "var(--color-bg, #0a0a0c)",
          color: "var(--color-text, #e2e2e8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: "var(--dialog-width, 480px)",
            padding: "var(--space-8, 2rem)",
          }}
        >
          <div
            style={{
              width: "var(--icon-circle-size, 64px)",
              height: "var(--icon-circle-size, 64px)",
              borderRadius: "50%",
              backgroundColor: "rgba(239,68,68,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto var(--space-6, 1.5rem)",
              fontSize: "var(--text-3xl, 28px)",
            }}
          >
            ⚠️
          </div>
          <h1 style={{ margin: "0 0 var(--space-2, 0.5rem)", fontSize: "var(--text-2xl, 1.5rem)", fontWeight: 700 }}>
            Platform Error
          </h1>
          <p style={{ margin: "0 0 var(--space-6, 1.5rem)", opacity: 0.7, fontSize: "var(--text-sm, 0.875rem)", lineHeight: 1.6 }}>
            A critical error occurred in the UniERP Platform Console.
            This has been logged for investigation.
          </p>
          {process.env.NODE_ENV === "development" && error?.message && (
            <pre
              style={{
                margin: "0 0 var(--space-6, 1.5rem)",
                padding: "var(--space-3, 0.75rem) var(--space-4, 1rem)",
                borderRadius: "var(--radius-md, 8px)",
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: "var(--text-xs, 0.75rem)",
                textAlign: "left",
                overflow: "auto",
                maxHeight: "var(--code-max-height, 160px)",
                color: "var(--color-danger, #f87171)",
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              padding: "var(--space-2-5, 0.625rem) var(--space-6, 1.5rem)",
              borderRadius: "var(--radius-md, 8px)",
              border: "none",
              backgroundColor: "var(--color-primary, #6366f1)",
              color: "var(--color-white, #ffffff)",
              fontWeight: 600,
              fontSize: "var(--text-sm, 0.875rem)",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
