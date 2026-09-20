import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ApiTrafficPage from "../../app/(control-plane)/api-traffic/page";

const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

const mockShowToast = vi.fn();
vi.mock("@/lib/use-toast", () => ({
  useToast: () => ({
    showToast: mockShowToast,
    toasts: [],
    dismissToast: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/api-traffic",
}));

const mockApi = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
};
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: any[]) => mockApi.get(url, ...args),
      post: (url: string, ...args: any[]) => mockApi.post(url, ...args),
      put: (url: string, ...args: any[]) => mockApi.put(url, ...args),
      del: (url: string, ...args: any[]) => mockApi.del(url, ...args),
    },
  };
});

describe("ApiTrafficPage Component (PCC-08)", () => {
  const mockRateLimits = [
    {
      id: "rl-1",
      name: "Global Default API Policy",
      endpointPath: "/api/v1/*",
      limitPerMinute: 600,
      burstLimit: 1200,
      clientTier: "STANDARD",
      tenantId: "GLOBAL",
      isActive: true,
    },
    {
      id: "rl-2",
      name: "High-Volume Auth Policy",
      endpointPath: "/api/v1/auth/*",
      limitPerMinute: 120,
      burstLimit: 240,
      clientTier: "STANDARD",
      tenantId: "GLOBAL",
      isActive: true,
    },
  ];

  const mockDeprecations = [
    {
      id: "dep-1",
      pathPrefix: "/api/v1/builder",
      deprecatedAt: "2026-08-20T00:00:00.000Z",
      sunsetAt: "2026-12-31T23:59:59.000Z",
      successor: "/api/v1/dev",
      link: "https://docs.unierp.dev/api/migrations",
      activeConsumers: 12,
      calls30d: 4800,
      status: "SUNSETTING",
      description: "Legacy builder routes retiring in favor of /api/v1/dev.",
    },
  ];

  const mockWafRules = [
    {
      id: "waf-1",
      name: "SQL Injection Detection & Shield",
      action: "BLOCK",
      pattern: "regex:(union|select|insert|drop)",
      priority: 1,
      enabled: true,
      matches24h: 142,
    },
  ];

  const mockClusters = [
    {
      id: "cluster-1",
      clusterName: "us-east-production-01",
      region: "us-east-1",
      provider: "AWS",
      status: "HEALTHY",
      maxTenants: 1000,
      activeTenants: 480,
      endpoint: "https://k8s-us-east-1.unierp.internal",
    },
  ];

  const mockTrafficStats = {
    gatewayRoutes: 28,
    p99LatencyMs: 48,
    wafFilterRate: "99.99%",
    rateLimitBreaches: 3,
    activeClusters: 2,
    requestsPerSec: 1420,
    blockedAttacks24h: 561,
    healthStatus: "HEALTHY",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("/rate-limits")) {
        return Promise.resolve({ data: mockRateLimits });
      }
      if (url.includes("/deprecations")) {
        return Promise.resolve({ data: mockDeprecations });
      }
      if (url.includes("/waf-rules")) {
        return Promise.resolve({ data: mockWafRules });
      }
      if (url.includes("/clusters")) {
        return Promise.resolve({ data: mockClusters });
      }
      if (url.includes("/traffic-stats")) {
        return Promise.resolve({ data: mockTrafficStats });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("renders rate limit rules, gateway KPIs, and navigation tabs", async () => {
    render(<ApiTrafficPage />);

    // Assert KPIs
    await waitFor(() => {
      expect(screen.getByText("Global P99 Latency")).toBeInTheDocument();
      expect(screen.getByText("WAF Filter Rate")).toBeInTheDocument();
      expect(screen.getByText("Rate Limit Breaches")).toBeInTheDocument();
    });

    // Assert Rule Rows
    await waitFor(() => {
      expect(screen.getByText("Global Default API Policy")).toBeInTheDocument();
      expect(screen.getByText("/api/v1/*")).toBeInTheDocument();
      expect(screen.getByText("High-Volume Auth Policy")).toBeInTheDocument();
    });
  });

  it("opens create rate limit drawer and posts new rule", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        id: "rl-new",
        name: "Enterprise Bulk Export Limits",
        endpointPath: "/api/v1/exports/*",
        limitPerMinute: 30,
        burstLimit: 60,
        clientTier: "ENTERPRISE",
        tenantId: "GLOBAL",
      },
    });

    render(<ApiTrafficPage />);

    await waitFor(() => {
      expect(screen.getByText("Global Default API Policy")).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", { name: /Create Rate Limit Rule/i });
    fireEvent.click(createBtn);

    // Assert Drawer opens with heading
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Create Rate Limit Rule" })).toBeInTheDocument();
    });

    // Fill rule name
    const nameInput = screen.getByPlaceholderText("e.g. Public API Rate Limit");
    fireEvent.change(nameInput, { target: { value: "Enterprise Bulk Export Limits" } });

    // Fill endpoint
    const endpointInput = screen.getByPlaceholderText("e.g. /api/v1/sales/*");
    fireEvent.change(endpointInput, { target: { value: "/api/v1/exports/*" } });

    // Submit drawer
    const submitBtns = screen.getAllByRole("button", { name: "Create" });
    fireEvent.click(submitBtns[0]);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/cluster-routing-deep/rate-limits",
        expect.objectContaining({
          name: "Enterprise Bulk Export Limits",
          endpointPath: "/api/v1/exports/*",
        })
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Rate Limit Rule Created",
          variant: "success",
        })
      );
    });
  });

  it("deactivates rate limit policy via confirmation dialog", async () => {
    mockApi.del.mockResolvedValueOnce({ data: { success: true } });

    render(<ApiTrafficPage />);

    await waitFor(() => {
      expect(screen.getByText("Global Default API Policy")).toBeInTheDocument();
    });

    const deleteBtns = screen.getAllByRole("button", { name: /Delete/i });
    fireEvent.click(deleteBtns[0]);

    // Confirm dialog opens
    await waitFor(() => {
      expect(screen.getByText("Deactivate Rate Limit Policy?")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByRole("button", { name: "Deactivate Rule" });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.del).toHaveBeenCalledWith(
        "/platform/v1/cluster-routing-deep/rate-limits/rl-1"
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Rule Removed",
          variant: "success",
        })
      );
    });
  });

  it("switches to API Deprecation Timeline and dispatches sunset warning", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: { message: "Sunset timeline broadcast to 12 active callers.", recipientsCount: 12 },
    });

    render(<ApiTrafficPage />);

    await waitFor(() => {
      expect(screen.getByText("Rate Limit Rules")).toBeInTheDocument();
    });

    // Switch to deprecations tab
    const depTab = screen.getByRole("tab", { name: /API Deprecation Timeline/i });
    fireEvent.click(depTab);

    await waitFor(() => {
      expect(screen.getByText("/api/v1/builder")).toBeInTheDocument();
      expect(screen.getByText("SUNSETTING")).toBeInTheDocument();
    });

    const notifyBtn = screen.getByRole("button", { name: /Notify Consumers/i });
    fireEvent.click(notifyBtn);

    // Confirm modal opens
    await waitFor(() => {
      expect(screen.getByText("Dispatch Sunset Notification?")).toBeInTheDocument();
    });

    const sendBtn = screen.getByRole("button", { name: "Send Sunset Warning" });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/cluster-routing-deep/deprecations/dep-1/notify",
        {}
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sunset Notice Dispatched",
          variant: "success",
        })
      );
    });
  });

  it("switches to WAF & Security tab and verifies WAF rules", async () => {
    render(<ApiTrafficPage />);

    await waitFor(() => {
      expect(screen.getByText("Rate Limit Rules")).toBeInTheDocument();
    });

    const wafTab = screen.getByRole("tab", { name: /WAF & Security/i });
    fireEvent.click(wafTab);

    await waitFor(() => {
      expect(screen.getByText("SQL Injection Detection & Shield")).toBeInTheDocument();
      expect(screen.getByText("ACTION: BLOCK")).toBeInTheDocument();
    });
  });

  it("switches to Clusters & Routing tab and verifies multi-tenant capacity", async () => {
    render(<ApiTrafficPage />);

    await waitFor(() => {
      expect(screen.getByText("Rate Limit Rules")).toBeInTheDocument();
    });

    const clusterTab = screen.getByRole("tab", { name: /Clusters & Routing/i });
    fireEvent.click(clusterTab);

    await waitFor(() => {
      expect(screen.getByText("us-east-production-01")).toBeInTheDocument();
      expect(screen.getByText("480 / 1000 tenants (48%)")).toBeInTheDocument();
    });
  });
});
