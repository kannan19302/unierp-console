import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../src/lib/api";
import OpsServices from "../app/(control-plane)/ops/services/page";
import OpsQueues from "../app/(control-plane)/ops/queues/page";
import OpsOverview from "../app/(control-plane)/ops/page";

vi.mock("next/navigation", () => ({ usePathname: () => "/ops/services" }));
vi.mock("@kannan19302/ui", async importOriginal => ({
  ...(await importOriginal<object>()), usePermission: () => true,
}));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("Strata operations workspaces", () => {
  it("never reports healthy telemetry or successful probing after failed reads", async () => {
    vi.spyOn(api, "get").mockRejectedValue(new Error("Telemetry denied"));
    render(<OpsOverview />);
    await screen.findByText("Dashboard unavailable: Telemetry denied");
    expect(screen.queryByText("All Subsystems Nominal")).not.toBeInTheDocument();
    expect(screen.queryByText("Active (3 Rules)")).not.toBeInTheDocument();
    expect(screen.queryByText("38% Mem")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Probe Health" }));
    expect(await screen.findByText("Some telemetry requests failed. Review the errors and retry.")).toBeInTheDocument();
    expect(screen.queryByText("Measured telemetry refreshed.")).not.toBeInTheDocument();
  });
  it("renders measured service rows, searches them and keeps only Services active", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ status: 200, data: [
      { service: "database", name: "Application database", status: "HEALTHY", latencyMs: 3 },
      { service: "worker", name: "Export worker", status: "UNKNOWN" },
    ] });
    const { container } = render(<OpsServices />);
    await screen.findByText("Application database");
    expect(container.querySelector('[data-floorplan="data-workspace"]')).toBeTruthy();
    expect(screen.getByText("3 ms")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Export" } });
    expect(screen.queryByText("Application database")).not.toBeInTheDocument();
    expect(screen.getByText("Export worker")).toBeInTheDocument();
    const current = container.querySelectorAll('nav[aria-label="Platform Operations sections"] a[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Services");
  });

  it("shows denied queue telemetry and allows a real request retry", async () => {
    const get = vi.spyOn(api, "get").mockRejectedValueOnce(new Error("Permission denied"))
      .mockResolvedValueOnce({ status: 200, data: [{ name: "email", status: "UNKNOWN" }] });
    render(<OpsQueues />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Permission denied");
    fireEvent.click(screen.getByRole("button", { name: "Refresh queues" }));
    await screen.findByText("email");
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(get).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText("Unknown")).toHaveLength(5);
  });
});
