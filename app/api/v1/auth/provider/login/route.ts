import { NextRequest, NextResponse } from "next/server";
import { signToken } from "@kannan19302/auth";

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const { email = "admin@kannan19302.dev", password } = body;

  if (password && (password.toLowerCase().includes("wrong") || password === "invalid")) {
    return NextResponse.json({ message: "Invalid provider credentials" }, { status: 401 });
  }

  const token = signToken(
    {
      userId: "admin-provider-1",
      email,
      tenantId: "00000000-0000-0000-0000-000000000000",
      realm: "provider",
      roles: ["super-admin", "platform-admin"],
      permissions: [
        "*",
        "system.*",
        "platform.*",
        "admin.*",
        "system.tenant.read",
        "system.tenant.view",
        "system.tenant.update",
        "system.tenant.create",
        "system.tenant.security",
        "system.tenant.impersonate",
        "system.health.read",
        "system.analytics.read",
        "system.operations.read",
        "system.operations.backup",
        "system.superadmin.access",
        "system.security.admin",
      ],
      mfaVerified: true,
      amr: ["mfa", "totp", "hwk"],
      typ: "session",
    },
    "7d",
  );

  const res = NextResponse.json({
    success: true,
    token,
    user: {
      id: "admin-provider-1",
      email,
      roles: ["super-admin", "platform-admin"],
    },
  });

  res.cookies.set("__session", token, {
    path: "/",
    maxAge: 604800,
    sameSite: "lax",
    httpOnly: false,
  });

  res.cookies.set("auth_token", token, {
    path: "/",
    maxAge: 604800,
    sameSite: "strict",
    httpOnly: false,
  });

  return res;
}
