import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import FeaturesSettingsPage from "../../app/(control-plane)/settings/features/page";

const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
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
  usePathname: () => "/settings/features",
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

describe("FeaturesSettingsPage Component (PCC-13)", () => {
  const mockFlags = [
    {
      id: "ff-copilot",
      flagKey: "AI_COPILOT",
      name: "AI Copilot Assistant",
      description: "Generative AI assistant",
      percentageRollout: 50,
      userSegments: ["BETA_TESTERS", "ENTERPRISE_TIER"],
      environments: ["dev", "staging", "production"],
      active: true,
      enabled: true,
      createdAt: "2026-03-10T10:00:00.000Z",
    },
    {
      id: "ff-multi-currency",
      flagKey: "GLOBAL_MULTI_CURRENCY_V2",
      name: "Multi-Currency Engine",
      description: "FX settlement engine",
      percentageRollout: 100,
      userSegments: ["FINANCE_PRO"],
      environments: ["dev", "staging", "production"],
      active: true,
      enabled: true,
      createdAt: "2026-03-12T11:00:00.000Z",
    },
  ];

  const mockEnvs = [
    {
      id: "env-dev",
      name: "dev",
      label: "Development (Sandbox)",
      version: "v2.4.1-rc1",
      configKeysCount: 12,
      driftDetected: false,
      lastSyncAt: "2026-03-20T10:00:00.000Z",
      settings: {},
    },
    {
      id: "env-staging",
      name: "staging",
      label: "Staging (Pre-production)",
      version: "v2.4.0",
      configKeysCount: 12,
      driftDetected: false,
      lastSyncAt: "2026-03-20T08:30:00.000Z",
      settings: {},
    },
    {
      id: "env-prod",
      name: "production",
      label: "Production (Global Edge)",
      version: "v2.3.9",
      configKeysCount: 12,
      driftDetected: true,
      lastSyncAt: "2026-03-19T14:15:00.000Z",
      settings: {},
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("config/environments")) {
        return Promise.resolve({ data: mockEnvs, status: 200 });
      }
      if (url.includes("config/diff")) {
        return Promise.resolve({
          data: {
            source: "staging",
            target: "production",
            diffs: [
              {
                key: "auth.session_timeout_minutes",
                sourceValue: 60,
                targetValue: 30,
                changeType: "MODIFIED",
              },
            ],
            totalChanges: 1,
          },
          status: 200,
        });
      }
      return Promise.resolve({ data: mockFlags, status: 200 });
    });
  });

  it("renders feature flags list and rollout metrics", async () => {
    render(<FeaturesSettingsPage />);
    expect(screen.getByText("Global Configuration & Feature Flags")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("AI Copilot Assistant")).toBeInTheDocument();
      expect(screen.getByText("Multi-Currency Engine")).toBeInTheDocument();
      expect(screen.getByText("50%")).toBeInTheDocument();
      expect(screen.getByText("BETA_TESTERS")).toBeInTheDocument();
    });
  });

  it("triggers quick toggle to deactivate/activate a feature flag", async () => {
    mockApi.patch.mockResolvedValue({ id: "ff-copilot", active: false });
    render(<FeaturesSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("AI Copilot Assistant")).toBeInTheDocument();
    });

    const toggleBtn = screen.getByLabelText("Toggle AI Copilot Assistant");
    fireEvent.click(toggleBtn);

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/platform/v1/flags-metering/feature-flags/rules/ff-copilot",
        expect.objectContaining({ active: false, enabled: false })
      );
    });
  });

  it("switches to environment promotion tab and triggers configuration promotion", async () => {
    mockApi.post.mockResolvedValue({ success: true, promotedVersion: "v2.4.0" });
    render(<FeaturesSettingsPage />);

    // Click promotion tab
    const promoTab = screen.getByText(/Environment Config Promotion/);
    fireEvent.click(promoTab);

    await waitFor(() => {
      expect(screen.getByText("Staging (Pre-production)")).toBeInTheDocument();
      expect(screen.getByText("Production (Global Edge)")).toBeInTheDocument();
      expect(screen.getByText("Configuration Environment Diff")).toBeInTheDocument();
    });

    // Open promotion modal
    const promoteBtn = screen.getByText("Promote Configuration");
    fireEvent.click(promoteBtn);

    await waitFor(() => {
      expect(screen.getByText("Promote Configuration: STAGING → PRODUCTION")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByText("Confirm & Promote");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/flags-metering/config/promote",
        expect.objectContaining({ source: "staging", target: "production" })
      );
    });
  });

  it("decommissions a feature flag with confirm dialog", async () => {
    mockApi.del.mockResolvedValue({ success: true });
    render(<FeaturesSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("AI Copilot Assistant")).toBeInTheDocument();
    });

    const deleteBtn = screen.getByLabelText("Decommission AI Copilot Assistant");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.getByText("Decommission Feature Flag")).toBeInTheDocument();
    });

    const confirmDeleteBtn = screen.getByText("Delete Flag");
    fireEvent.click(confirmDeleteBtn);

    await waitFor(() => {
      expect(mockApi.del).toHaveBeenCalledWith(
        "/platform/v1/flags-metering/feature-flags/rules/ff-copilot"
      );
    });
  });
});
