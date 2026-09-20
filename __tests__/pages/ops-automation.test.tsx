import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OpsAutomationPage from "../../app/(control-plane)/ops/automation/page";

const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};
vi.mock("@/lib/use-toast", () => ({
  useToast: () => mockToast,
}));

vi.mock("@/lib/use-domain-realtime", () => ({
  useDomainRealtime: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/ops/automation",
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
};
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: any[]) => mockApi.get(url, ...args),
      post: (url: string, ...args: any[]) => mockApi.post(url, ...args),
      patch: (url: string, ...args: any[]) => mockApi.patch(url, ...args),
      del: (url: string, ...args: any[]) => mockApi.del(url, ...args),
    },
  };
});

describe("OpsAutomationPage Component", () => {
  const mockRunbooks = [
    {
      id: "rb-drain-node",
      name: "Drain & Cordon Kubernetes Node",
      status: "PUBLISHED",
      version: 2,
      steps: [{ resourceId: "k8s-node-04", proposedState: { cordoned: true } }],
      createdAt: "2026-03-20T08:00:00.000Z",
    },
    {
      id: "rb-flush-cache",
      name: "Emergency Global Redis Eviction",
      status: "DRAFT",
      version: 1,
      steps: [{ resourceId: "cache-redis-01", proposedState: { flush: true } }],
      createdAt: "2026-03-20T09:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockResolvedValue({ data: mockRunbooks, status: 200 });
  });

  it("renders runbook automations table", async () => {
    render(<OpsAutomationPage />);
    expect(screen.getByText("Platform Operations — Runbook Automation")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Drain & Cordon Kubernetes Node")).toBeInTheDocument();
      expect(screen.getByText("Emergency Global Redis Eviction")).toBeInTheDocument();
    });
  });

  it("triggers dry-run with zero side effects", async () => {
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("dry-run")) return Promise.resolve({ data: [{ valid: true }], status: 200 });
      return Promise.resolve({ data: mockRunbooks, status: 200 });
    });

    render(<OpsAutomationPage />);
    await waitFor(() => {
      expect(screen.getByText("Drain & Cordon Kubernetes Node")).toBeInTheDocument();
    });

    const dryRunBtns = screen.getAllByText("Dry Run");
    fireEvent.click(dryRunBtns[0]);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith("/platform/v1/runbooks/rb-drain-node/dry-run");
    });
  });

  it("publishes draft runbook after policy gate modal submission", async () => {
    mockApi.post.mockResolvedValue({ id: "rb-flush-cache", status: "PUBLISHED" });
    render(<OpsAutomationPage />);

    await waitFor(() => {
      expect(screen.getByText("Emergency Global Redis Eviction")).toBeInTheDocument();
    });

    const publishBtn = screen.getByText("Publish");
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(screen.getByText("Publish Runbook — Policy Gate Verification")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Verify & Publish"));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/runbooks/rb-flush-cache/publish",
        expect.objectContaining({ policyName: "platform.standard_operational_safety" })
      );
    });
  });

  it("decommissions runbook via confirm dialog", async () => {
    mockApi.del.mockResolvedValue({ id: "rb-drain-node", deleted: true });
    render(<OpsAutomationPage />);

    await waitFor(() => {
      expect(screen.getByText("Drain & Cordon Kubernetes Node")).toBeInTheDocument();
    });

    const trashBtn = screen.getByLabelText("Decommission Drain & Cordon Kubernetes Node");
    fireEvent.click(trashBtn);

    await waitFor(() => {
      expect(screen.getByText("Decommission Runbook")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Delete Runbook"));
    await waitFor(() => {
      expect(mockApi.del).toHaveBeenCalledWith(
        expect.stringContaining("/platform/v1/runbooks/"),
        expect.any(Object)
      );
    });
  });
});
