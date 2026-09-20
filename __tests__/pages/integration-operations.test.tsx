import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import IntegrationsOverview from "../../app/(control-plane)/integrations/page";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/integrations",
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

describe("Integration & Connector Operations Console (PCC-20)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockResolvedValue({ data: {} });
    mockApi.post.mockResolvedValue({ data: {} });
    mockApi.put.mockResolvedValue({ data: {} });
    mockApi.del.mockResolvedValue({ data: {} });
  });

  it("renders the integrations command console with tabs and connector telemetry", () => {
    render(<IntegrationsOverview />);

    expect(screen.getByText("Integration & Connector Operations")).toBeDefined();
    expect(screen.getByText(/PCC-20: Visual data mapping designer/)).toBeDefined();

    expect(screen.getByRole("tab", { name: /Connectors & Health/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Visual Data Mapping/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Sync Scheduling/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Gateway Status/i })).toBeDefined();

    expect(screen.getByText("Salesforce CRM Enterprise Bridge")).toBeDefined();
    expect(screen.getByText("Shopify Plus B2B Storefront")).toBeDefined();
    expect(screen.getByText("Oracle NetSuite GL Master")).toBeDefined();
  });

  it("satisfies EC-20.3: triggers real-time connector health check and updates telemetry", async () => {
    render(<IntegrationsOverview />);

    const pingButtons = screen.getAllByRole("button", { name: /Ping Connector/i });
    expect(pingButtons.length).toBeGreaterThan(0);
    fireEvent.click(pingButtons[0]);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/platform/v1/integration-operations/connectors/conn-sfdc/ping"),
        {}
      );
    });
  });

  it("satisfies EC-20.1: visual data mapping designer, adding field rules, and evaluating live test playground", async () => {
    render(<IntegrationsOverview />);

    // Switch to Visual Data Mapping tab
    const mappingTab = screen.getByRole("tab", { name: /Visual Data Mapping/i });
    fireEvent.click(mappingTab);

    // Verify existing mapping and rules
    expect(screen.getByText("Salesforce Account → UniERP Customer")).toBeDefined();
    expect(screen.getByText("companyName")).toBeDefined();
    expect(screen.getByText("customerCode")).toBeDefined();

    // Evaluate live test transformation
    const evaluateBtn = screen.getByRole("button", { name: /Evaluate Transformation/i });
    fireEvent.click(evaluateBtn);

    await waitFor(() => {
      expect(screen.getByTestId("mapping-test-output").textContent).toContain("Acme Global Corp");
    });

    // Open New Entity Mapping modal
    const newMapBtn = screen.getByRole("button", { name: /New Entity Mapping/i });
    fireEvent.click(newMapBtn);

    expect(screen.getByText("Create Visual Entity Data Mapping (EC-20.1)")).toBeDefined();

    const nameInput = screen.getByPlaceholderText(/e.g. SFDC Lead → UniERP Opportunity/i);
    fireEvent.change(nameInput, { target: { value: "HubSpot Deals → UniERP Quotes" } });

    // Add field rule
    const addRuleBtn = screen.getByRole("button", { name: /Add Field Rule/i });
    fireEvent.click(addRuleBtn);

    const submitMapBtn = screen.getByRole("button", { name: /Save Entity Mapping/i });
    fireEvent.click(submitMapBtn);

    await waitFor(() => {
      expect(screen.queryByText("Create Visual Entity Data Mapping (EC-20.1)")).toBeNull();
    });
  });

  it("satisfies EC-20.2: recurring sync schedule configuration and pause/resume toggling", async () => {
    render(<IntegrationsOverview />);

    // Switch to Sync Scheduling tab
    const schedTab = screen.getByRole("tab", { name: /Sync Scheduling/i });
    fireEvent.click(schedTab);

    expect(screen.getByText("Hourly SFDC Account Reconciler")).toBeDefined();
    expect(screen.getByText("Continuous Shopify Order Ingestion")).toBeDefined();

    // Toggle pause/resume job
    const pauseButtons = screen.getAllByRole("button", { name: /Pause Job/i });
    expect(pauseButtons.length).toBeGreaterThan(0);
    fireEvent.click(pauseButtons[0]);

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith(
        expect.stringContaining("/platform/v1/integration-operations/jobs/job-sfdc-sync/toggle"),
        {}
      );
    });

    // Create New Sync Job
    const newJobBtn = screen.getByRole("button", { name: /New Sync Job/i });
    fireEvent.click(newJobBtn);

    expect(screen.getByText("Create Recurring Sync Schedule Job (EC-20.2)")).toBeDefined();

    const jobNameInput = screen.getByPlaceholderText(/e.g. Daily Inventory Level Sync/i);
    fireEvent.change(jobNameInput, { target: { value: "Midnight Oracle GL Ledger Sweep" } });

    const submitJobBtn = screen.getByRole("button", { name: /Schedule Recurring Job/i });
    fireEvent.click(submitJobBtn);

    await waitFor(() => {
      expect(screen.queryByText("Create Recurring Sync Schedule Job (EC-20.2)")).toBeNull();
    });
  });
});
