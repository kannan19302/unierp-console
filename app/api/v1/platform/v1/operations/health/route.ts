import { NextRequest } from "next/server";
import { proxyOperationsRead } from "@/lib/operations-proxy";

export async function GET(req: NextRequest) {
  return proxyOperationsRead(req, "health");
}
