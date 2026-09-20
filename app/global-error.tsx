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
          fontFamily: "system-ui, -apple-system, sans-serif",
          backgroundColor: "#0a0a0c",
          color: "#e2e2e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <div
          style={{
            textAlign: "center",
            maxWidth: 480,
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: "rgba(239,68,68,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: 28,
            }}
          >
            ⚠️
          </div>
          <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem", fontWeight: 700 }}>
            Platform Error
          </h1>
          <p style={{ margin: "0 0 1.5rem", opacity: 0.7, fontSize: "0.875rem", lineHeight: 1.6 }}>
            A critical error occurred in the UniERP Platform Console.
            This has been logged for investigation.
          </p>
          {process.env.NODE_ENV === "development" && error?.message && (
            <pre
              style={{
                margin: "0 0 1.5rem",
                padding: "0.75rem 1rem",
                borderRadius: 8,
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                fontSize: "0.75rem",
                textAlign: "left",
                overflow: "auto",
                maxHeight: 160,
                color: "#f87171",
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.625rem 1.5rem",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.875rem",
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
