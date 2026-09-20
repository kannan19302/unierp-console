import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { z } from "zod";
import { useCrudForm } from "@/lib/hooks/use-crud-form";

// Mock useToast
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/lib/hooks/use-toast", () => ({
  useToast: () => ({
    success: mockToastSuccess,
    error: mockToastError,
    showToast: vi.fn(),
    dismissToast: vi.fn(),
  }),
}));

const TestSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email"),
  active: z.boolean().default(true),
});

type TestFormData = z.infer<typeof TestSchema>;

describe("useCrudForm (WS8.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes with default values", () => {
    const { result } = renderHook(() =>
      useCrudForm<TestFormData>({
        schema: TestSchema,
        defaultValues: { name: "Acme", email: "info@acme.com", active: true },
        onSubmit: vi.fn(),
      })
    );

    expect(result.current.getValues("name")).toBe("Acme");
    expect(result.current.getValues("email")).toBe("info@acme.com");
    expect(result.current.getValues("active")).toBe(true);
  });

  it("validates form values and calls onSubmit on valid submission", async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    const onSuccessMock = vi.fn();

    const { result } = renderHook(() =>
      useCrudForm<TestFormData>({
        schema: TestSchema,
        defaultValues: { name: "", email: "" },
        onSubmit: onSubmitMock,
        onSuccess: onSuccessMock,
        successMessage: "Created successfully!",
      })
    );

    act(() => {
      result.current.setValue("name", "Valid Name");
      result.current.setValue("email", "test@unierp.com");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmitMock).toHaveBeenCalledWith({
      name: "Valid Name",
      email: "test@unierp.com",
      active: true,
    });
    expect(mockToastSuccess).toHaveBeenCalledWith("Created successfully!");
    expect(onSuccessMock).toHaveBeenCalled();
  });

  it("handles submission errors by displaying error toast", async () => {
    const onSubmitMock = vi.fn().mockRejectedValue(new Error("Server mutation failed"));

    const { result } = renderHook(() =>
      useCrudForm<TestFormData>({
        schema: TestSchema,
        defaultValues: { name: "Alpha", email: "alpha@unierp.com", active: true },
        onSubmit: onSubmitMock,
      })
    );

    await act(async () => {
      try {
        await result.current.handleSubmit();
      } catch {}
    });

    expect(mockToastError).toHaveBeenCalledWith("Server mutation failed");
  });

  it("resets form values when initialData changes", () => {
    let initialData: Partial<TestFormData> | null = { name: "Tenant A", email: "a@a.com" };

    const { result, rerender } = renderHook(() =>
      useCrudForm<TestFormData>({
        schema: TestSchema,
        defaultValues: { name: "", email: "" },
        initialData,
        onSubmit: vi.fn(),
      })
    );

    expect(result.current.getValues("name")).toBe("Tenant A");

    // Update initialData
    initialData = { name: "Tenant B", email: "b@b.com" };
    act(() => {
      rerender();
    });

    expect(result.current.getValues("name")).toBe("Tenant B");
  });
});
