import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCrud, type CrudAdapter } from "../../src/lib/use-crud";

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
  showToast: vi.fn(),
  dismissToast: vi.fn(),
};

vi.mock("../../src/lib/use-toast", () => ({
  useToast: () => mockToast,
}));

interface Item {
  id: string;
  name: string;
}

describe("useCrud hook", () => {
  let adapter: CrudAdapter<Item>;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = {
      list: vi.fn().mockResolvedValue({
        items: [{ id: "1", name: "Item One" }],
        total: 1,
      }),
      create: vi.fn().mockImplementation(async (data) => ({
        id: "2",
        name: data.name,
      })),
      update: vi.fn().mockImplementation(async (id, data) => ({
        id,
        name: data.name,
      })),
      delete: vi.fn().mockResolvedValue(undefined),
    };
  });

  it("loads items automatically on mount", async () => {
    const { result } = renderHook(() =>
      useCrud({
        entityName: "Item",
        adapter,
      })
    );

    // Initial load starts
    expect(result.current.loading).toBe(true);

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([{ id: "1", name: "Item One" }]);
    expect(result.current.total).toBe(1);
    expect(adapter.list).toHaveBeenCalled();
  });

  it("handles create mutation with optimistic update", async () => {
    const { result } = renderHook(() =>
      useCrud({
        entityName: "Item",
        adapter,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.drawerOpen).toBe(true);
    expect(result.current.drawerMode).toBe("create");

    await act(async () => {
      await result.current.handleSave({ name: "Item Two" });
    });

    expect(adapter.create).toHaveBeenCalledWith({ name: "Item Two" });
    expect(mockToast.success).toHaveBeenCalledWith("Item created successfully");
    expect(result.current.drawerOpen).toBe(false);
  });

  it("handles delete mutation with optimistic remove and toast", async () => {
    const { result } = renderHook(() =>
      useCrud({
        entityName: "Item",
        adapter,
      })
    );

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.handleDelete("1");
    });

    expect(adapter.delete).toHaveBeenCalledWith("1");
    expect(mockToast.success).toHaveBeenCalledWith("Item deleted successfully");
  });
});
