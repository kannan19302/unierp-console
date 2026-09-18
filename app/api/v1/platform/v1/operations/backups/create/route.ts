import { NextRequest } from "next/server";
import { proxyOperationsWrite } from "@/lib/operations-proxy";

export async function POST(req: NextRequest) {
  return proxyOperationsWrite(req, "backups/create", "POST");
}
