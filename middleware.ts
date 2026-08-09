import { NextRequest, NextResponse } from "next/server";
import { isControlPlaneSession } from "./src/lib/middleware";

function decodeJwtPayload(token: string): any {
  try {
    const [header, payload, signature] = token.split(".");
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const sessionPayload = decodeJwtPayload(
    req.cookies.get("__session")?.value ??
      req.cookies.get("auth_token")?.value ??
      "",
  );
  const isValidSession = sessionPayload && isControlPlaneSession(sessionPayload);
  const isProviderSession = sessionPayload && sessionPayload.realm === "provider";

  // If trying to access login page
  if (url.pathname === "/login") {
    if (isValidSession) {
      url.pathname = "/overview";
      return NextResponse.redirect(url);
    }
    if (isProviderSession && !isValidSession) {
      url.pathname = "/profile";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // If session is completely invalid or not a provider
  if (!isProviderSession) {
    url.pathname = "/login";
    url.searchParams.set("returnUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // If session is a provider but missing MFA
  if (!isValidSession && url.pathname !== "/profile") {
    url.pathname = "/profile";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};