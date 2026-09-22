import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OpsReleasesPage from "../../app/(control-plane)/ops/releases/page";
import { clearDataCache } from "../../src/lib/data";

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
  usePathname: () => "/ops/releases",
}));

const mockApi = { get: vi.fn(), post: vi.fn(), patch: vi.fn(), del: vi.fn() };
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    api: {
      get: (url: string, params?: unknown) => mockApi.get(url, params),
      post: (url: string, body?: unknown) => mockApi.post(url, body),
      patch: (url: string, body?: unknown) => mockApi.patch(url, body),
      del: (url: string, params?: unknown) => mockApi.del(url, params),
    },
  };
});

describe("OpsReleasesPage", () => {
  const manifest = {
    releaseTrain: "2026.08",
    version: "2026.08.0",
    deployedAt: "2026-03-20T08:00:00.000Z",
    services: { api: "v2.4.0", web: "v2.4.0" },
    migrations: ["20260801_init"],
    previousManifestVersion: "2026.07.4",
  };
  const pipeline = {
    stages: [
      { stage: "dev", label: "Development", version: "2026.08.2-next", status: "HEALTHY", lastDeployedAt: "2026-03-20T10:00:00Z" },
      { stage: "canary", label: "Global Edge Canary Ring", version: "2026.08.0", status: "ROLLING_OUT", trafficWeightPercent: 10, lastDeployedAt: "2026-03-20T08:00:00Z" },
    ],
    activeCanaryPercent: 10,
  };

  beforeEach(() => {
    clearDataCache();
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.post.mockResolvedValue({ data: {}, status: 200 });
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("pipeline")) return Promise.resolve({ data: pipeline, status: 200 });
      if (url.includes("manifest")) return Promise.resolve({ data: manifest, status: 200 });
      return Promise.resolve({ data: {}, status: 200 });
    });
  });

  it("renders the reported release evidence without invented records", async () => {
    render(<OpsReleasesPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Releases" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Development")).toBeInTheDocument());
    expect(screen.getByText("Global Edge Canary Ring")).toBeInTheDocument();
    expect(screen.getAllByText("v2.4.0").length).toBeGreaterThan(0);
    expect(screen.getByText("2", { selector: "strong" })).toBeInTheDocument();
  });

  it("reviews a canary change before dispatching only the requested percentage", async () => {
    render(<OpsReleasesPage />);
    await waitFor(() => expect(screen.getByRole("slider")).toHaveValue("10"));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Review change" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Confirm canary allocation")).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Apply allocation" }));
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith(
      "/platform/v1/releases/pipeline/canary-traffic", { percentage: 20 },
    ));
  });

  it("requires an audit reason before dispatching a rollback", async () => {
    render(<OpsReleasesPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Rollback platform" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Rollback platform" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Rollback platform" });
    expect(confirm).toBeDisabled();
    fireEvent.change(within(dialog).getByPlaceholderText("Describe the measured failure requiring rollback"), {
      target: { value: "Ingress connection regression" },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith(
      "/platform/v1/releases/rollback",
      { targetManifestVersion: "2026.07.4", reason: "Ingress connection regression" },
    ));
  });

  it("requires explicit external health evidence before promotion", async () => {
    render(<OpsReleasesPage />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Promote release" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Promote release" }));
    const dialog = await screen.findByRole("dialog");
    const confirm = within(dialog).getByRole("button", { name: "Promote release" });
    expect(confirm).toBeDisabled();
    fireEvent.click(within(dialog).getByLabelText("I verified the external health gate for this manifest and target."));
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith(
      "/platform/v1/releases/promote",
      { environmentName: "canary", targetManifestVersion: "2026.08.0", healthy: true },
    ));
  });

  it("shows truthful empty states when the sources return no evidence", async () => {
    clearDataCache();
    mockApi.get.mockResolvedValue({ data: {}, status: 200 });
    render(<OpsReleasesPage />);
    await waitFor(() => expect(screen.getByText("No pipeline stages reported")).toBeInTheDocument());
    expect(screen.getAllByText("Not reported").length).toBeGreaterThan(0);
    expect(screen.queryByText("2026.07.4")).not.toBeInTheDocument();
    expect(screen.queryByText("10%")).not.toBeInTheDocument();
  });
});
