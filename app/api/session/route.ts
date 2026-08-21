import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Server-side session persistence for unierp-provider-admin-os.
 *
 * The refresh token never reaches browser JavaScript — held only in an
 * httpOnly cookie, exchanged server-side. This is the same pattern proven
 * live in the Global Platform Wizard (W4); every platform in W6 reuses it
 * verbatim rather than reinventing its own session storage, which is exactly
 * what let tenant-apps' previous implementation drift into storing its
 * access token in localStorage.
 */

const REFRESH_COOKIE = "session_rt";
const ISSUER = process.env.OIDC_ISSUER || "http://localhost:3005";
const CLIENT_ID = "unierp-provider-admin-os";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = (await req.json()) as { refreshToken?: string };
  if (!body.refreshToken) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  setRefreshCookie(res, body.refreshToken);
  return res;
}

export async function GET(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: "no_session" }, { status: 401 });
  }

  const tokenRes = await fetch(new URL("/oidc/token", ISSUER), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    }),
  });
  const body = await tokenRes.json();

  if (body.error) {
    const res = NextResponse.json({ error: body.error }, { status: 401 });
    clearRefreshCookie(res);
    return res;
  }

  const res = NextResponse.json({
    accessToken: body.access_token,
    idToken: body.id_token,
    expiresAt: Date.now() + body.expires_in * 1000,
    scope: body.scope,
  });
  if (body.refresh_token) setRefreshCookie(res, body.refresh_token);
  return res;
}

export async function DELETE(): Promise<NextResponse> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    await fetch(new URL("/oidc/revoke", ISSUER), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: refreshToken }),
    }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true });
  clearRefreshCookie(res);
  return res;
}

function setRefreshCookie(res: NextResponse, token: string): void {
  res.cookies.set(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/session",
    maxAge: 30 * 24 * 60 * 60,
  });
}

function clearRefreshCookie(res: NextResponse): void {
  res.cookies.set(REFRESH_COOKIE, "", { path: "/api/session", maxAge: 0 });
}
