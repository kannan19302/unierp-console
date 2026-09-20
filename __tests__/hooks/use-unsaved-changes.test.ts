import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUnsavedChanges } from "../../src/lib/use-unsaved-changes";

describe("useUnsavedChanges hook", () => {
  it("initializes as clean", () => {
    const { result } = renderHook(() => useUnsavedChanges());
    expect(result.current.isDirty).toBe(false);
  });

  it("sets and clears dirty state", () => {
    const { result } = renderHook(() => useUnsavedChanges());

    act(() => {
      result.current.setDirty();
    });
    expect(result.current.isDirty).toBe(true);

    act(() => {
      result.current.clearDirty();
    });
    expect(result.current.isDirty).toBe(false);
  });
});
