import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUrlState, useUrlTab, useUrlDrawer } from "@/lib/hooks/use-url-state";

// Mock next/navigation
const mockReplace = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => "/test-path",
  useSearchParams: () => mockSearchParams,
}));

describe("useUrlState Hooks (WS5.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  describe("useUrlState", () => {
    it("initializes with default values when no search params exist", () => {
      const { result } = renderHook(() =>
        useUrlState({
          page: 1,
          status: "active",
          archived: false,
        })
      );

      const [state] = result.current;
      expect(state.page).toBe(1);
      expect(state.status).toBe("active");
      expect(state.archived).toBe(false);
    });

    it("parses numbers, booleans, and strings from URL parameters", () => {
      mockSearchParams = new URLSearchParams("page=3&status=pending&archived=true");

      const { result } = renderHook(() =>
        useUrlState({
          page: 1,
          status: "all",
          archived: false,
        })
      );

      const [state] = result.current;
      expect(state.page).toBe(3);
      expect(state.status).toBe("pending");
      expect(state.archived).toBe(true);
    });

    it("updates URL parameters using router.replace without scrolling", () => {
      const { result } = renderHook(() =>
        useUrlState({
          page: 1,
          filter: "",
        })
      );

      const [, setUrlState] = result.current;

      act(() => {
        setUrlState({ page: 2, filter: "acme" });
      });

      expect(mockReplace).toHaveBeenCalledWith("/test-path?page=2&filter=acme", {
        scroll: false,
      });
    });

    it("deletes parameters when set to null, undefined, or empty string", () => {
      mockSearchParams = new URLSearchParams("page=2&filter=acme");

      const { result } = renderHook(() =>
        useUrlState({
          page: 1,
          filter: "",
        })
      );

      const [, setUrlState] = result.current;

      act(() => {
        setUrlState({ filter: "" });
      });

      expect(mockReplace).toHaveBeenCalledWith("/test-path?page=2", { scroll: false });
    });

    it("clears tracked parameters when clearUrlState is invoked", () => {
      mockSearchParams = new URLSearchParams("page=2&filter=acme&unrelated=keep");

      const { result } = renderHook(() =>
        useUrlState({
          page: 1,
          filter: "",
        })
      );

      const [, , clearUrlState] = result.current;

      act(() => {
        clearUrlState();
      });

      expect(mockReplace).toHaveBeenCalledWith("/test-path?unrelated=keep", {
        scroll: false,
      });
    });
  });

  describe("useUrlTab", () => {
    it("returns default tab when parameter is not present", () => {
      const { result } = renderHook(() => useUrlTab("overview"));
      const [tab] = result.current;
      expect(tab).toBe("overview");
    });

    it("returns current tab from URL when present", () => {
      mockSearchParams = new URLSearchParams("tab=settings");
      const { result } = renderHook(() => useUrlTab("overview"));
      const [tab] = result.current;
      expect(tab).toBe("settings");
    });

    it("updates URL with new tab selection", () => {
      const { result } = renderHook(() =>
        useUrlTab<"overview" | "audit" | "settings">("overview")
      );
      const [, setTab] = result.current;

      act(() => {
        setTab("audit");
      });

      expect(mockReplace).toHaveBeenCalledWith("/test-path?tab=audit", {
        scroll: false,
      });
    });

    it("removes parameter when switching back to default tab", () => {
      mockSearchParams = new URLSearchParams("tab=audit");
      const { result } = renderHook(() => useUrlTab("overview"));
      const [, setTab] = result.current;

      act(() => {
        setTab("overview");
      });

      expect(mockReplace).toHaveBeenCalledWith("/test-path", { scroll: false });
    });
  });

  describe("useUrlDrawer", () => {
    it("reflects closed state when no drawer param is in URL", () => {
      const { result } = renderHook(() => useUrlDrawer());
      expect(result.current.isOpen).toBe(false);
      expect(result.current.drawerMode).toBeNull();
      expect(result.current.selectedId).toBeNull();
    });

    it("opens drawer with mode and entity id", () => {
      const { result } = renderHook(() => useUrlDrawer());

      act(() => {
        result.current.openDrawer("edit", "tenant-123");
      });

      expect(mockReplace).toHaveBeenCalledWith(
        "/test-path?drawer=edit&id=tenant-123",
        { scroll: false }
      );
    });

    it("closes drawer by removing drawer and id params", () => {
      mockSearchParams = new URLSearchParams("drawer=edit&id=tenant-123");
      const { result } = renderHook(() => useUrlDrawer());

      act(() => {
        result.current.closeDrawer();
      });

      expect(mockReplace).toHaveBeenCalledWith("/test-path", { scroll: false });
    });
  });
});
