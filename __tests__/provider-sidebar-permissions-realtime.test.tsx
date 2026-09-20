import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ControlPlaneShell from "../src/components/console-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/overview",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@kannan19302/shared/auth-client/react", () => ({
  useSession: () => ({
    claims: { email: "restricted@unierp.com" },
    signOut: vi.fn(),
  }),
}));

vi.mock("@/components/AuthShell", () => ({
  ControlPlaneGate: ({ children }: { children: React.ReactNode }) => children,
}));

let mockIsConnected = false;
vi.mock("@/lib/use-console-socket", () => ({
  useConsoleSocket: () => ({ socket: null, isConnected: mockIsConnected }),
}));

vi.mock("@/components/AdminAppSwitcher", () => ({
  default: () => <span>Applications</span>,
}));

let allowedPermissions: string[] = [];
vi.mock("@kannan19302/ui/components", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  usePermission: (perm: string) => {
    if (!perm) return true;
    return allowedPermissions.includes(perm);
  },
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
  allowedPermissions = [];
  mockIsConnected = false;
});

describe("EC-8.2 & EC-8.5: Provider Sidebar Permission Enforcement and Real-time Status", () => {
  it("enforces permissions on sidebar domain apps and tabs (EC-8.5)", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    // Allow only pcc.operations.access, deny pcc.security.access and others
    allowedPermissions = ["pcc.operations.access"];

    render(
      <ControlPlaneShell>
        <div>Restricted Content</div>
      </ControlPlaneShell>
    );

    // Platform Operations is permitted
    expect(screen.getByRole("link", { name: /Platform Operations/i })).toBeInTheDocument();

    // Platform Security requires pcc.security.access - should be hidden
    expect(screen.queryByRole("link", { name: /Platform Security/i })).not.toBeInTheDocument();
  });

  it("renders real-time indicator dot when console socket is connected (EC-8.2)", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    // Allow operations and security
    allowedPermissions = ["pcc.operations.access", "pcc.security.access"];
    mockIsConnected = true;

    render(
      <ControlPlaneShell>
        <div>Realtime Content</div>
      </ControlPlaneShell>
    );

    // When connected, real-time indicators should be present
    const realtimeDots = screen.getAllByLabelText(/real-time active/i);
    expect(realtimeDots.length).toBeGreaterThan(0);
  });
});
