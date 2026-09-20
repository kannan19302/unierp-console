import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DevelopersWebhooksPage from "../../app/(control-plane)/developers/webhooks/page";

const mockUsePermission = vi.fn();
vi.mock("@kannan19302/ui", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    usePermission: (perm: string) => mockUsePermission(perm),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/developers/webhooks",
}));

const mockApi = {
  get: vi.fn(),
};
vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: any[]) => mockApi.get(url, ...args),
    },
  };
});

describe("DevelopersWebhooksPage Component", () => {
  const mockWebhooks = [
    {
      id: "wh-1",
      name: "Acme Billing Event Forwarder",
      url: "https://api.acme.com/webhooks/billing",
      events: "invoice.created, invoice.paid",
      lastDeliveryAt: "2026-09-20 14:00",
      lastStatus: "DELIVERED",
      status: "ACTIVE",
    },
    {
      id: "wh-2",
      name: "Salesforce CRM Lead Sync",
      url: "https://integrations.crm.io/leads",
      events: "lead.converted",
      lastDeliveryAt: "2026-09-20 13:45",
      lastStatus: "FAILED",
      status: "ACTIVE",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url === "/saas/webhooks") {
        return Promise.resolve({ data: mockWebhooks });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it("renders webhook subscriptions, status badges, and delivery metrics", async () => {
    render(<DevelopersWebhooksPage />);

    await waitFor(() => {
      expect(screen.getByText("Acme Billing Event Forwarder")).toBeInTheDocument();
      expect(screen.getByText("Salesforce CRM Lead Sync")).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getAllByText("Webhooks").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Failing deliveries")).toBeInTheDocument();

    // Check statuses
    expect(screen.getByText("DELIVERED")).toBeInTheDocument();
    expect(screen.getByText("FAILED")).toBeInTheDocument();
  });

  it("renders empty state when no webhooks are registered", async () => {
    mockApi.get.mockResolvedValueOnce({ data: [] });

    render(<DevelopersWebhooksPage />);

    await waitFor(() => {
      expect(screen.getByText("No webhooks registered")).toBeInTheDocument();
    });
  });
});
