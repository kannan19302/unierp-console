import { NextRequest, NextResponse } from "next/server";

/** Preserve the API's provider authorization and measured state without fallback records. */
export async function proxyOperationsRead(req: NextRequest, resource: string) {
  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }
  const base = process.env.API_URL ?? "http://localhost:3001";
  try {
    const response = await fetch(`${base}/api/v1/platform/v1/operations/${resource}`, {
      headers: { Authorization: authorization, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Operations telemetry is unavailable. Retry when the service recovers." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}

/** Forward mutation operations to API with authorization and body. */
export async function proxyOperationsWrite(req: NextRequest, resource: string, method = "POST") {
  const authorization = req.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ message: "Authentication required." }, { status: 401 });
  }
  const base = process.env.API_URL ?? "http://localhost:3001";
  try {
    const body = req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined;
    const response = await fetch(`${base}/api/v1/platform/v1/operations/${resource}`, {
      method,
      headers: {
        Authorization: authorization,
        "Content-Type": req.headers.get("content-type") ?? "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
      redirect: "error",
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { message: "Operations service is unavailable. Retry when the service recovers." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
