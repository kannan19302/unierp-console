import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DevelopersOverview from "../../app/(control-plane)/developers/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/developers",
}));

const mockApi = {
  get: vi.fn().mockResolvedValue({ data: {} }),
  post: vi.fn().mockResolvedValue({ data: {} }),
  put: vi.fn().mockResolvedValue({ data: {} }),
  del: vi.fn().mockResolvedValue({ data: {} }),
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

describe("Developer & Ecosystem Console (PCC-14)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockResolvedValue({ data: {} });
    mockApi.post.mockResolvedValue({ data: {} });
    mockApi.put.mockResolvedValue({ data: {} });
    mockApi.del.mockResolvedValue({ data: {} });
  });

  it("renders the developer platform console with tabs and stats", () => {
    render(<DevelopersOverview />);

    // Header and description
    expect(screen.getByText("Developer & Ecosystem Operations")).toBeDefined();
    expect(screen.getByText(/PCC-14: OAuth application lifecycle/)).toBeDefined();

    // Tabs
    expect(screen.getByRole("tab", { name: /OAuth Applications/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Developer Sandboxes/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /SDK Packages/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Platform Telemetry/i })).toBeDefined();

    // Default active tab is OAuth Applications
    expect(screen.getByText("Acme Retail POS Connector")).toBeDefined();
  });

  it("satisfies EC-14.1: registers a new OAuth application with client ID & secret generation", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          id: "app-test-new",
          clientId: "client_live_9988776655",
          clientSecret: "sec_live_abcdef123456",
          name: "OmniChannel B2B Portal",
          clientType: "CONFIDENTIAL",
          ownerTenantId: "tenant-acme-corp",
          ownerTenantName: "Acme Corporation",
          redirectUris: ["https://portal.b2b.io/callback"],
          allowedScopes: ["api.read", "api.write"],
          status: "ACTIVE",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    render(<DevelopersOverview />);

    // Open App Registration wizard
    const registerBtn = screen.getByRole("button", { name: /Register Application/i });
    fireEvent.click(registerBtn);

    expect(screen.getByText("Register Developer Application")).toBeDefined();

    // Fill form
    const nameInput = screen.getByPlaceholderText(/e.g. Acme Inventory Sync/i);
    fireEvent.change(nameInput, { target: { value: "OmniChannel B2B Portal" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /Generate Credentials & Register/i });
    fireEvent.click(submitBtn);

    // Modal with credentials displayed
    await waitFor(() => {
      expect(screen.getByText("OAuth Credentials Generated")).toBeDefined();
    });

    // Close credentials modal
    const closeCredsBtn = screen.getByRole("button", { name: /I Have Secured the Secret/i });
    fireEvent.click(closeCredsBtn);

    // App should be visible in table
    expect(screen.getByText("OmniChannel B2B Portal")).toBeDefined();
  });

  it("satisfies EC-14.1: rotates client secret and revokes client application", async () => {
    mockApi.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { clientSecret: "sec_rotated_99998888" },
      },
    });

    render(<DevelopersOverview />);

    // Find rotate buttons
    const rotateButtons = screen.getAllByTitle("Rotate OAuth Client Secret");
    expect(rotateButtons.length).toBeGreaterThan(0);
    fireEvent.click(rotateButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("OAuth Credentials Generated")).toBeDefined();
    });

    const closeCredsBtn = screen.getByRole("button", { name: /I Have Secured the Secret/i });
    fireEvent.click(closeCredsBtn);

    // Revoke app
    const revokeButtons = screen.getAllByTitle("Revoke OAuth Client");
    expect(revokeButtons.length).toBeGreaterThan(0);
    fireEvent.click(revokeButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText("REVOKED").length).toBeGreaterThan(0);
    });
  });

  it("satisfies EC-14.2: developer sandboxes lifecycle, TTL extension, and destruction", async () => {
    render(<DevelopersOverview />);

    // Switch to Sandboxes tab
    const sandboxesTab = screen.getByRole("tab", { name: /Developer Sandboxes/i });
    fireEvent.click(sandboxesTab);

    // Verify existing sandboxes
    expect(screen.getByText("Acme ERP Full Staging")).toBeDefined();
    expect(screen.getByText("Ledger Sandbox #4")).toBeDefined();

    // Extend TTL (+14 days)
    const extendButtons = screen.getAllByRole("button", { name: /\+14 Days TTL/i });
    expect(extendButtons.length).toBeGreaterThan(0);
    fireEvent.click(extendButtons[0]);

    // Open Provision Sandbox modal
    const provisionBtn = screen.getByRole("button", { name: /Provision Sandbox/i });
    fireEvent.click(provisionBtn);
    expect(screen.getByText("Provision Isolated Developer Sandbox")).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/e.g. Staging Integration Env #2/i);
    fireEvent.change(nameInput, { target: { value: "Inventory Stress Test Sandbox" } });

    const submitProvisionBtn = screen.getByRole("button", { name: /Confirm Provisioning/i });
    fireEvent.click(submitProvisionBtn);

    await waitFor(() => {
      expect(screen.getByText("Inventory Stress Test Sandbox")).toBeDefined();
    });

    // Destroy sandbox
    const destroyButtons = screen.getAllByRole("button", { name: /Destroy/i });
    fireEvent.click(destroyButtons[0]);

    expect(screen.getByText("Confirm Sandbox Destruction")).toBeDefined();
    const confirmDestroyBtn = screen.getByRole("button", { name: /Confirm Permanent Destruction/i });
    fireEvent.click(confirmDestroyBtn);

    await waitFor(() => {
      expect(screen.queryByText("Confirm Sandbox Destruction")).toBeNull();
    });
  });

  it("satisfies EC-14.3: multi-language SDK registry, publication, and deprecation", async () => {
    render(<DevelopersOverview />);

    // Switch to SDKs tab
    const sdksTab = screen.getByRole("tab", { name: /SDK Packages/i });
    fireEvent.click(sdksTab);

    // Verify existing packages
    expect(screen.getByText("@unierp/sdk-typescript")).toBeDefined();
    expect(screen.getByText("unierp-sdk-python")).toBeDefined();
    expect(screen.getByText("github.com/unierp/unierp-go")).toBeDefined();

    // Open publish modal
    const publishBtn = screen.getByRole("button", { name: /Publish SDK Release/i });
    fireEvent.click(publishBtn);
    expect(screen.getByText("Publish SDK Package Release")).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/e.g. @unierp\/sdk-csharp/i);
    fireEvent.change(nameInput, { target: { value: "@unierp/sdk-csharp" } });

    const versionInput = screen.getByPlaceholderText(/e.g. 1.0.0/i);
    fireEvent.change(versionInput, { target: { value: "1.0.0" } });

    const notesInput = screen.getByPlaceholderText(/Describe notable changes/i);
    fireEvent.change(notesInput, { target: { value: "Initial GA release of .NET 8 SDK with strong typing." } });

    const submitPublishBtn = screen.getByRole("button", { name: /Publish to Registry/i });
    fireEvent.click(submitPublishBtn);

    await waitFor(() => {
      expect(screen.getByText("@unierp/sdk-csharp")).toBeDefined();
    });

    // Deprecate version
    const deprecateButtons = screen.getAllByRole("button", { name: /Deprecate Version/i });
    expect(deprecateButtons.length).toBeGreaterThan(0);
    fireEvent.click(deprecateButtons[0]);

    await waitFor(() => {
      expect(screen.getAllByText("DEPRECATED").length).toBeGreaterThan(0);
    });
  });
});
