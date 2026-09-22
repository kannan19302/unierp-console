import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OpsAutomationPage from "../../app/(control-plane)/ops/automation/page";
import { clearDataCache } from "../../src/lib/data";
import { runbookAuthorSchema } from "../../src/lib/ops-schema";

const mockUsePermission = vi.fn();
const mockToast = { success: vi.fn(), error: vi.fn(), info: vi.fn() };

vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (permission: string) => mockUsePermission(permission),
    useToast: () => mockToast,
  };
});

vi.mock("@/lib/use-domain-realtime", () => ({ useDomainRealtime: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/ops/automation",
}));

const mockApi = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() };
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: unknown[]) => mockApi.get(url, ...args),
      post: (url: string, ...args: unknown[]) => mockApi.post(url, ...args),
      patch: (url: string, ...args: unknown[]) => mockApi.patch(url, ...args),
      del: (url: string, ...args: unknown[]) => mockApi.del(url, ...args),
    },
  };
});

describe("OpsAutomationPage", () => {
  const runbooks = [
    {
      id: "rb-drain-node",
      name: "Drain Kubernetes node",
      status: "PUBLISHED",
      version: 2,
      steps: [{ resourceId: "k8s-node-04", proposedState: { cordoned: true } }],
      createdAt: "2026-03-20T08:00:00.000Z",
    },
    {
      id: "rb-flush-cache",
      name: "Evict regional cache",
      status: "DRAFT",
      version: 1,
      steps: [{ resourceId: "cache-redis-01", proposedState: { flush: true } }],
      createdAt: "2026-03-20T09:00:00.000Z",
    },
  ];

  beforeEach(() => {
    clearDataCache();
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({ data: runbooks, status: 200 });
    mockApi.post.mockResolvedValue({ data: {}, status: 200 });
    mockApi.del.mockResolvedValue({ data: {}, status: 200 });
  });

  it("accepts only source-shaped runbook steps", () => {
    expect(runbookAuthorSchema.safeParse({ name: "Drain node", stepsJson: '[{"resourceId":"node-1","proposedState":{"cordoned":true}}]' }).success).toBe(true);
    expect(runbookAuthorSchema.safeParse({ name: "Drain node", stepsJson: '[{"resourceId":"node-1"}]' }).success).toBe(false);
    expect(runbookAuthorSchema.safeParse({ name: "Drain node", stepsJson: '[{"resourceId":"","proposedState":[]}]' }).success).toBe(false);
  });

  it("renders source-reported runbooks and measured summary values", async () => {
    render(<OpsAutomationPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Automation" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Drain Kubernetes node")).toBeInTheDocument());
    expect(screen.getByText("Evict regional cache")).toBeInTheDocument();
    expect(screen.getByText("Validated this session").nextElementSibling).toHaveTextContent("0");
    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("records dry-run evidence without sending a mutation payload", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("dry-run")) return Promise.resolve({ data: [{ id: "plan-1" }], status: 200 });
      return Promise.resolve({ data: runbooks, status: 200 });
    });
    render(<OpsAutomationPage />);
    await waitFor(() => expect(screen.getByText("Drain Kubernetes node")).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole("button", { name: "Dry run" })[0]!);

    await waitFor(() => expect(mockApi.get).toHaveBeenCalledWith("/platform/v1/runbooks/rb-drain-node/dry-run"));
    expect(await screen.findByText("1 PLAN")).toBeInTheDocument();
    expect(screen.getByText("Validated this session").nextElementSibling).toHaveTextContent("1");
  });

  it("requires a named policy and publishes without a hardcoded actor", async () => {
    render(<OpsAutomationPage />);
    await waitFor(() => expect(screen.getByText("Evict regional cache")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Publish" }));

    const dialog = await screen.findByRole("dialog", { name: "Publish runbook" });
    const publish = within(dialog).getByRole("button", { name: "Evaluate and publish" });
    expect(publish).toBeDisabled();
    fireEvent.change(within(dialog).getByPlaceholderText("Enter a registered platform policy"), { target: { value: "platform.change-safe" } });
    expect(publish).toBeEnabled();
    fireEvent.click(publish);

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith(
      "/platform/v1/runbooks/rb-flush-cache/publish",
      { policyName: "platform.change-safe" },
    ));
  });

  it("requires explicit acknowledgement before decommissioning", async () => {
    render(<OpsAutomationPage />);
    await waitFor(() => expect(screen.getByText("Drain Kubernetes node")).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Decommission Drain Kubernetes node" }));

    const dialog = await screen.findByRole("dialog", { name: "Decommission runbook" });
    const confirm = within(dialog).getByRole("button", { name: "Decommission runbook" });
    expect(confirm).toBeDisabled();
    fireEvent.click(within(dialog).getByLabelText("I understand this removes the runbook definition and cannot be undone here."));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() => expect(mockApi.del).toHaveBeenCalledWith("/platform/v1/runbooks/rb-drain-node"));
  });

  it("shows an explicit source failure instead of zero runbooks", async () => {
    clearDataCache();
    mockApi.get.mockRejectedValue(new Error("Runbook service unavailable"));
    render(<OpsAutomationPage />);

    expect(await screen.findByText("Runbook source unavailable")).toBeInTheDocument();
    expect(screen.getAllByText("Unknown").length).toBeGreaterThan(0);
    expect(screen.getByRole("alert")).toHaveTextContent("Runbook service unavailable");
  });
});
