import { cleanup, render, screen } from "@testing-library/react";
import type { PropsWithChildren, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OverviewDashboard from "../../app/(control-plane)/overview/page";

const mocks = vi.hoisted(() => ({
  reload: vi.fn(),
  useItem: vi.fn(),
  useList: vi.fn(),
}));

vi.mock("next/navigation", () => ({ usePathname: () => "/overview" }));
vi.mock("@kannan19302/ui", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  usePermission: () => true,
}));
vi.mock("@/components/domain-shell", () => ({
  default: ({ title, description, actions, children }: PropsWithChildren<{ title: string; description?: string; actions?: ReactNode }>) => (
    <main>
      <h1>{title}</h1>
      <p>{description}</p>
      <div>{actions}</div>
      {children}
    </main>
  ),
}));
vi.mock("@/lib/data", () => ({
  useItem: mocks.useItem,
  useList: mocks.useList,
}));

afterEach(cleanup);

describe("provider overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.useItem.mockReturnValue({
      data: { totalTenants: 2, activeTenants: 1 },
      loading: false,
      error: null,
      reload: mocks.reload,
    });
    mocks.useList.mockImplementation(({ path }: { path: string }) => ({
      data: path.endsWith("/incidents")
        ? [{ id: "inc-1", title: "Database failover", severity: "HIGH", status: "INVESTIGATING" }]
        : [
            { id: "tenant-1", name: "Northwind", status: "ACTIVE", plan: "Enterprise", region: "eu-west" },
            { id: "tenant-2", name: "Contoso", status: "SUSPENDED", plan: "Growth", region: "us-east" },
          ],
      total: 2,
      loading: false,
      error: null,
      reload: mocks.reload,
    }));
  });

  it("renders unknown telemetry honestly and shows returned incidents", () => {
    render(<OverviewDashboard />);

    expect(screen.getByRole("heading", { name: "Provider overview" })).toBeInTheDocument();
    expect(screen.queryByText("99.98%")).not.toBeInTheDocument();
    expect(screen.getAllByText("Telemetry unavailable").length).toBeGreaterThan(0);
    expect(screen.getByText("Database failover")).toBeInTheDocument();
    expect(screen.queryByText("All systems operational")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  it("queries the incident contract rather than treating health as an incident list", () => {
    render(<OverviewDashboard />);

    expect(mocks.useList).toHaveBeenCalledWith({
      path: "/platform/v1/operations/incidents",
      disabled: false,
    });
  });
});
