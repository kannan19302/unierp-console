import { NextRequest, NextResponse } from "next/server";
import { isControlPlaneSession } from "./src/lib/middleware";

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = Buffer.from(parts[1], "base64").toString("utf8");
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const sessionCookie = req.cookies.get("__session")?.value;
  const payload = sessionCookie ? decodeJwtPayload(sessionCookie) : null;
  const isValidSession = payload && isControlPlaneSession(payload);

  if (url.pathname === "/login") {
    if (isValidSession) {
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (!isValidSession) {
    url.pathname = "/login";
    url.searchParams.set("returnUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
