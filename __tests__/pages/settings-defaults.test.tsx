import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DefaultsSettingsPage from "../../app/(control-plane)/settings/defaults/page";

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

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/settings/defaults",
}));

const mockApi = {
  get: vi.fn(),
  patch: vi.fn(),
};

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    api: {
      get: (url: string, ...args: any[]) => mockApi.get(url, ...args),
      patch: (url: string, ...args: any[]) => mockApi.patch(url, ...args),
    },
  };
});

describe("DefaultsSettingsPage Component (PCC-13)", () => {
  const mockSettings = {
    tenant: {
      id: "tenant-acme",
      name: "Acme Enterprise Corp",
      settings: {
        locale: "en-US",
        currency: "USD",
        timezone: "America/New_York",
        defaultPlan: "ENTERPRISE",
      },
    },
    organization: {
      name: "Acme Global HQ",
      email: "ops@acme.com",
      taxId: "US-EIN-9928172",
      currency: "USD",
      timezone: "America/New_York",
      address: "100 Innovation Way, San Francisco, CA",
    },
  };

  const mockRules = [
    {
      id: "rule-1",
      locale: { code: "en-US", name: "English (US)" },
      dateFormat: "MM/DD/YYYY",
      timeFormat: "hh:mm A",
      numberFormat: "#,##0.00",
      currencyCode: "USD",
      currencySymbol: "$",
      firstDayOfWeek: 0,
      timezone: "America/New_York",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermission.mockReturnValue(true);
    mockApi.get.mockImplementation((url: string) => {
      if (url.includes("formatting-rules")) {
        return Promise.resolve({ data: mockRules, status: 200 });
      }
      return Promise.resolve({ data: mockSettings, status: 200 });
    });
  });

  it("renders organization profile and tenant defaults cards", async () => {
    render(<DefaultsSettingsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Defaults" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Acme Global HQ")).toBeInTheDocument();
      expect(screen.getByText("ops@acme.com")).toBeInTheDocument();
      expect(screen.getByText("US-EIN-9928172")).toBeInTheDocument();
      expect(screen.getByText("English (US)")).toBeInTheDocument();
    });
  });

  it("opens edit defaults drawer and submits updated organization profile", async () => {
    mockApi.patch.mockResolvedValue({ success: true });
    render(<DefaultsSettingsPage />);

    await waitFor(() => {
      expect(screen.getByText("Acme Global HQ")).toBeInTheDocument();
    });

    const editBtn = screen.getByText("Edit Defaults");
    fireEvent.click(editBtn);

    await waitFor(() => {
      expect(screen.getByText("Edit Global Organization & Tenant Defaults")).toBeInTheDocument();
    });

    const saveBtn = screen.getByText("Save Defaults");
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.patch).toHaveBeenCalledWith(
        "/admin/settings",
        expect.objectContaining({
          organization: expect.objectContaining({ name: "Acme Global HQ" }),
        })
      );
    });
  });
});
