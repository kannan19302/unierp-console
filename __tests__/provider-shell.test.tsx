import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ControlPlaneShell from "../src/components/shell";

vi.mock("next/navigation", () => ({ usePathname: () => "/ops/services", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@kannan19302/shared/auth-client/react", () => ({ useSession: () => ({ claims: null, signOut: vi.fn() }) }));
vi.mock("@/components/AuthShell", () => ({ ControlPlaneGate: ({ children }: { children: React.ReactNode }) => children }));
vi.mock("@/lib/use-console-socket", () => ({ useConsoleSocket: () => ({ socket: null, isConnected: false }) }));
vi.mock("@/components/AdminAppSwitcher", () => ({ default: () => <span>Applications</span> }));
vi.mock("@kannan19302/ui/components", async importOriginal => ({ ...(await importOriginal<object>()), usePermission: () => true }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("provider Strata shell interaction", () => {
  it("provides a single context bar, actual navigation links and a working collapse control", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const { container } = render(<ControlPlaneShell><h1>Services workspace</h1></ControlPlaneShell>);
    expect(screen.getAllByRole("banner", { name: "Operational Context Bar" })).toHaveLength(1);
    expect(screen.getByRole("link", { name: "Platform Operations" })).toHaveAttribute("href", "/ops");
    expect(screen.getByRole("link", { name: "Review operational incidents" })).toHaveAttribute("href", "/ops/incidents");
    const toggle = screen.getByRole("button", { name: "Toggle sidebar" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector("#provider-navigation")).toHaveAttribute("inert");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(screen.getByRole("navigation", { name: "Admin OS navigation" }), { key: "Escape" });
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "Skip to workspace" })).toHaveAttribute("href", "#provider-main");
  });
});
