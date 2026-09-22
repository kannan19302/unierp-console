import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../../src/lib/api";
import { clearDataCache } from "../../src/lib/data";
import OpsDeployments from "../../app/(control-plane)/ops/deployments/page";
import OpsEnvironments from "../../app/(control-plane)/ops/environments/page";
import OpsJobs from "../../app/(control-plane)/ops/jobs/page";
import OpsMaintenance from "../../app/(control-plane)/ops/maintenance/page";
import OpsWorkflows from "../../app/(control-plane)/ops/workflows/page";

const toast = { success: vi.fn(), error: vi.fn() };

vi.mock("next/navigation", () => ({ usePathname: () => "/ops/jobs" }));
vi.mock("@kannan19302/ui", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  usePermission: () => true,
  useToast: () => toast,
}));

beforeEach(() => {
  clearDataCache();
  toast.success.mockReset();
  toast.error.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("operations record workspaces", () => {
  it("does not invent environment targets when the release manifest is empty", async () => {
    vi.spyOn(api, "get").mockImplementation(async (path: string) => {
      if (path.endsWith("/manifest")) return { status: 200, data: { version: "2026.09" } };
      return { status: 200, data: [] };
    });

    render(<OpsEnvironments />);

    expect(await screen.findByText("No environment targets declared")).toBeInTheDocument();
    expect(screen.queryByText("staging")).not.toBeInTheDocument();
    expect(screen.queryByText("production")).not.toBeInTheDocument();
    expect(screen.getByText("Manifest 2026.09")).toBeInTheDocument();
  });

  it("keeps unmeasured queue counts unknown", async () => {
    vi.spyOn(api, "get").mockImplementation(async (path: string) => {
      if (path.endsWith("/jobs")) return { status: 200, data: [{ name: "outbox-delivery" }] };
      return { status: 200, data: [] };
    });

    render(<OpsJobs />);

    expect(await screen.findByText("outbox-delivery")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown").length).toBeGreaterThanOrEqual(4);
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
    expect(screen.queryByText("CLEAR")).not.toBeInTheDocument();
  });

  it("derives running workflow state from lastStatus instead of lastRun", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ status: 200, data: [{
      id: "workflow-1",
      name: "Invoice export",
      enabled: true,
      lastRun: "2026-09-21T10:00:00.000Z",
      lastStatus: "RUNNING",
      runs: { total: 7 },
    }] });

    render(<OpsWorkflows />);

    expect(await screen.findByText("Invoice export")).toBeInTheDocument();
    expect(screen.getByText("Running").nextElementSibling).toHaveTextContent("1");
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
    expect(screen.queryByText("2026-09-21T10:00:00.000Z")).not.toBeInTheDocument();
  });

  it("renders deployment policy only from declared manifest targets", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ status: 200, data: {
      version: "2026.09.1",
      deployment: { production: { gate: "change-control", auto_deploy: false, requires_human_approval: true } },
    } });

    render(<OpsDeployments />);

    expect(await screen.findByText("production")).toBeInTheDocument();
    expect(screen.getByText("change-control")).toBeInTheDocument();
    expect(screen.getByText("MANUAL")).toBeInTheDocument();
    expect(screen.getByText("REQUIRED")).toBeInTheDocument();
  });

  it("labels malformed maintenance timestamps instead of presenting them as valid", async () => {
    vi.spyOn(api, "get").mockResolvedValue({ status: 200, data: [{
      id: "maintenance-1",
      title: "Database patch",
      status: "SCHEDULED",
      scheduledStart: "not-a-date",
    }] });

    render(<OpsMaintenance />);

    expect(await screen.findByText("Database patch")).toBeInTheDocument();
    expect(screen.getByText("Invalid timestamp")).toBeInTheDocument();
    expect(screen.getByText("SCHEDULED")).toBeInTheDocument();
  });
});
