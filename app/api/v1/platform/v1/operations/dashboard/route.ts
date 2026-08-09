import { NextRequest, NextResponse } from "next/server";

/**
 * Console-side shim for /api/v1/platform/v1/operations/dashboard.
 *
 * The running API docker image pre-dates the backend dashboard endpoint.
 * This route aggregates data from endpoints that do exist and returns
 * a compatible shape so every console page that calls operations/dashboard
 * gets real data rather than a 404.
 *
 * Once the API image is rebuilt with the native endpoint this shim can be
 * removed — the Next.js rewrite rules give priority to real API responses.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("Authorization") ?? "";
  const base = process.env.API_URL ?? "http://localhost:3001";
  const headers: Record<string, string> = {
    Authorization: auth,
    "Content-Type": "application/json",
  };

  async function safeFetch<T>(path: string): Promise<T | null> {
    try {
      const res = await fetch(`${base}/api/v1${path}`, { headers });
      if (!res.ok) return null;
      return (await res.json()) as T;
    } catch {
      return null;
    }
  }

  // Fetch from endpoints that exist in the current docker API
  const [health, tenants] = await Promise.all([
    safeFetch<Record<string, unknown>>("/platform/v1/operations/health"),
    safeFetch<{ data?: unknown[]; total?: number } | unknown[]>(
      "/platform/v1/super-admin/tenants",
    ),
  ]);

  // Normalise tenant data
  const tenantList = Array.isArray(tenants)
    ? tenants
    : (tenants as { data?: unknown[] } | null)?.data ?? [];
  const totalTenants = tenantList.length;
  const activeTenants = (tenantList as Array<{ status?: string }>).filter(
    (t) => t.status === "ACTIVE",
  ).length;
  const suspendedTenants = (
    tenantList as Array<{ status?: string }>
  ).filter((t) => t.status === "SUSPENDED").length;

  const h = health ?? {};

  return NextResponse.json({
    // Fields the backend endpoint will eventually return
    totalTenants,
    activeTenants,
    suspendedTenants,
    offboardingTenants: (tenantList as Array<{ status?: string }>).filter(
      (t) => t.status === "OFFBOARDING",
    ).length,
    // Health data forwarded from the health endpoint
    clustersHealthy: (h as { healthyClusters?: number }).healthyClusters ?? 0,
    clustersTotal: (h as { totalClusters?: number }).totalClusters ?? 0,
    availability: (h as { availability?: number }).availability ?? null,
    queueDepth: (h as { queueDepth?: number }).queueDepth ?? 0,
    outboxLag: (h as { outboxLag?: number }).outboxLag ?? 0,
    degradedTenants: (h as { degradedTenants?: number }).degradedTenants ?? 0,
    // Financial aggregates — not available without a dedicated endpoint
    mrr: null,
    arr: null,
    openIncidents: (h as { openIncidents?: number }).openIncidents ?? 0,
    criticalIncidents:
      (h as { criticalIncidents?: number }).criticalIncidents ?? 0,
    recentIncidents: (h as { recentIncidents?: number }).recentIncidents ?? 0,
  });
}
