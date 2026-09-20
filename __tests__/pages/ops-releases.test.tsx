import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OpsReleasesPage from "../../app/(control-plane)/ops/releases/page";

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
  usePathname: () => "/ops/releases",
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
      get: (url: string, params?: any) => mockApi.get(url, params),
      post: (url: string, body?: any) => mockApi.post(url, body),
      patch: (url: string, body?: any) => mockApi.patch(url, body),
      del: (url: string, params?: any) => mockApi.del(url, params),
    },
  };
});

describe("OpsReleasesPage Component", () => {
  const mockManifest = {
    releaseTrain: "2026.08",
    version: "2026.08.0",
    deployedAt: "2026-03-20T08:00:00.000Z",
    services: {
      api: "v2.4.0",
      web: "v2.4.0",
    },
    migrations: ["20260801_init"],
    previousManifestVersion: "2026.07.4",
  };

  const mockPipeline = {
    stages: [
      { stage: "dev", label: "Development", version: "2026.08.2-next", status: "HEALTHY", lastDeployedAt: "2026-03-20T10:00:00Z" },
      { stage: "staging", label: "Pre-Production Staging", version: "2026.08.1-rc3", status: "HEALTHY", lastDeployedAt: "2026-03-20T09:00:00Z" },
      { stage: "canary", label: "Global Edge Canary Ring", version: "2026.08.0", status: "ROLLING_OUT", trafficWeightPercent: 10, lastDeployedAt: "2026-03-20T08:00:00Z" },
      { stage: "production", label: "Primary Production Fleet", version: "2026.07.4", status: "HEALTHY", trafficWeightPercent: 90, lastDeployedAt: "2026-03-15T08:00:00Z" },
    ],
    activeCanaryPercent: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("pipeline")) return Promise.resolve({ data: mockPipeline, status: 200 });
      if (url.includes("manifest")) return Promise.resolve({ data: mockManifest, status: 200 });
      return Promise.resolve({ data: {}, status: 200 });
    });
  });

  it("renders pipeline stages and manifest components", async () => {
    render(<OpsReleasesPage />);
    expect(screen.getByText("Platform Operations — Release Pipeline")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Development")).toBeInTheDocument();
      expect(screen.getByText("Global Edge Canary Ring")).toBeInTheDocument();
      expect(screen.getAllByText("v2.4.0").length).toBeGreaterThan(0);
    });
  });

  it("updates canary traffic split on button click", async () => {
    mockApi.post.mockResolvedValue({ activeCanaryPercent: 20 });
    render(<OpsReleasesPage />);

    await waitFor(() => {
      expect(screen.getByText("Global Edge Canary Ring")).toBeInTheDocument();
    });

    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "20" } });

    const applyBtn = screen.getByText("Apply Canary Split");
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/releases/pipeline/canary-traffic",
        expect.objectContaining({ percentage: 20 })
      );
    });
  });

  it("opens rollback modal and confirms rollback dispatch", async () => {
    mockApi.post.mockResolvedValue({ status: "ROLLED_BACK" });
    render(<OpsReleasesPage />);

    const rollbackBtn = screen.getByText("Rollback Platform");
    fireEvent.click(rollbackBtn);

    await waitFor(() => {
      expect(screen.getByText("Rollback Entire Platform Fleet")).toBeInTheDocument();
    });

    const reasonInput = screen.getByPlaceholderText("e.g., P99 latency SLA degradation in EU region post v2.4.0 rollout");
    fireEvent.change(reasonInput, { target: { value: "Ingress connection regression" } });

    fireEvent.click(screen.getByText("Confirm Rollback"));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        "/platform/v1/releases/rollback",
        expect.objectContaining({
          targetManifestVersion: "2026.07.4",
          reason: "Ingress connection regression",
        })
      );
    });
  });
});
