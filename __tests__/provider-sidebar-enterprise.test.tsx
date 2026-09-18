import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ControlPlaneShell from "../src/components/console-shell";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ops/services",
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("@kannan19302/shared/auth-client/react", () => ({
  useSession: () => ({
    claims: { email: "admin@unierp.com" },
    signOut: vi.fn(),
  }),
}));
vi.mock("@/components/AuthShell", () => ({
  ControlPlaneGate: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/lib/use-console-socket", () => ({
  useConsoleSocket: () => ({ socket: null, isConnected: false }),
}));
vi.mock("@/components/AdminAppSwitcher", () => ({
  default: () => <span>Applications</span>,
}));
vi.mock("@kannan19302/ui/components", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  usePermission: () => true,
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("Enterprise Searchable, Collapsible Provider Sidebar", () => {
  it("removes all PCC/OCC badge pills from sidebar items", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    const { container } = render(
      <ControlPlaneShell>
        <div>Content</div>
      </ControlPlaneShell>
    );

    // Verify PCC-01, PCC-02, OCC-01, PCC-13 are not rendered in the sidebar
    expect(screen.queryByText("PCC-01")).not.toBeInTheDocument();
    expect(screen.queryByText("OCC-01")).not.toBeInTheDocument();
    expect(screen.queryByText("PCC-02")).not.toBeInTheDocument();
    expect(screen.queryByText("PCC-13")).not.toBeInTheDocument();
    expect(container.querySelector("._itemBadge_4bf8f6")).toBeNull();
  });

  it("renders searchable input, filters across apps and sub-tabs, and handles clearing", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(
      <ControlPlaneShell>
        <div>Content</div>
      </ControlPlaneShell>
    );

    const searchInput = screen.getByRole("textbox", {
      name: "Search platform applications and tabs",
    });
    expect(searchInput).toBeInTheDocument();

    // Type query matching Incidents tab
    fireEvent.change(searchInput, { target: { value: "Incidents" } });
    expect(screen.getByText(/Matching Results/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Incidents (Platform Operations)" })
    ).toHaveAttribute("href", "/ops/incidents");

    // Type non-existent query
    fireEvent.change(searchInput, { target: { value: "xyznonexistent123" } });
    expect(screen.getByText(/No pages found matching/)).toBeInTheDocument();

    // Clear search
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(searchInput).toHaveValue("");
    expect(screen.queryByText(/No pages found matching/)).not.toBeInTheDocument();
  });

  it("renders collapsible domain sections and allows toggling section expansion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(
      <ControlPlaneShell>
        <div>Content</div>
      </ControlPlaneShell>
    );

    const toggleSecurityBtn = screen.getByRole("button", {
      name: "Toggle Platform Security section",
    });
    expect(toggleSecurityBtn).toBeInTheDocument();
    expect(toggleSecurityBtn).toHaveAttribute("aria-expanded", "true");

    // Toggle section closed
    fireEvent.click(toggleSecurityBtn);
    expect(toggleSecurityBtn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Threats" })).not.toBeInTheDocument();

    // Toggle section back open
    fireEvent.click(toggleSecurityBtn);
    expect(toggleSecurityBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Threats" })).toBeInTheDocument();
  });

  it("renders sub-tabs tree for active app and highlights current sub-page", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(
      <ControlPlaneShell>
        <div>Content</div>
      </ControlPlaneShell>
    );

    // Because pathname is /ops/services, Platform Operations tabs should be expanded
    const servicesLink = screen.getByRole("link", { name: "Services" });
    expect(servicesLink).toBeInTheDocument();
    expect(servicesLink).toHaveAttribute("href", "/ops/services");
    expect(servicesLink).toHaveAttribute("aria-current", "page");
  });

  it("supports Starred favorites and mini icon-rail collapse", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(
      <ControlPlaneShell>
        <div>Content</div>
      </ControlPlaneShell>
    );

    // Open more options for Platform Operations and star it
    const moreBtn = screen.getByRole("button", { name: "More options for Platform Operations" });
    fireEvent.click(moreBtn);

    const starBtn = screen.getByRole("menuitem", { name: "Star Platform Operations" });
    fireEvent.click(starBtn);

    // Starred section should appear
    expect(screen.getByText("Starred")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Starred: Platform Operations" })).toHaveAttribute(
      "href",
      "/ops"
    );

    // Test mini icon rail collapse
    const railToggle = screen.getByRole("button", { name: "Collapse sidebar ([)" });
    fireEvent.click(railToggle);
    expect(screen.getByRole("button", { name: "Expand sidebar ([)" })).toBeInTheDocument();
  });
});
