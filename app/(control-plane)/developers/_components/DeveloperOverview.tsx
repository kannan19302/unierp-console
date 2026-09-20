"use client";

import React from "react";
import { Card, Badge } from "@kannan19302/ui";

interface DeveloperOverviewProps {
  endpoints: { data: Record<string, unknown>[] };
  webhooks: { data: Record<string, unknown>[] };
  apiKeys: { data: Record<string, unknown>[] };
}

export function DeveloperOverview({ endpoints, webhooks, apiKeys }: DeveloperOverviewProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(20rem, 1fr))", gap: "var(--space-4)" }}>
      <Card padding="md">
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>API Endpoints Available</h3>
        <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
          {endpoints.data.slice(0, 6).map((e, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-2) 0",
                borderBottom: "0.0625rem solid var(--color-border)",
              }}
            >
              <span style={{ fontWeight: 500 }}>{String(e.path ?? e.name ?? "Endpoint")}</span>
              <Badge variant="info">{String(e.method ?? "GET")}</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="md">
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>Webhooks Registered</h3>
        <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
          {webhooks.data.slice(0, 6).map((w, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-2) 0",
                borderBottom: "0.0625rem solid var(--color-border)",
              }}
            >
              <span style={{ fontWeight: 500 }}>{String(w.name ?? w.url ?? "Webhook")}</span>
              <Badge variant="success">ACTIVE</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card padding="md">
        <h3 style={{ margin: 0, fontSize: "var(--text-base)", fontWeight: 600 }}>API Keys Issued</h3>
        <ul style={{ listStyle: "none", margin: "var(--space-3) 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
          {apiKeys.data.slice(0, 6).map((k, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "var(--space-2) 0",
                borderBottom: "0.0625rem solid var(--color-border)",
              }}
            >
              <span style={{ fontWeight: 500 }}>{String(k.label ?? k.name ?? "API Key")}</span>
              <Badge variant="default">VALID</Badge>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
