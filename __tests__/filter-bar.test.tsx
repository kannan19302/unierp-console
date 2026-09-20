import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { FilterBar } from "../src/components/FilterBar";

describe("FilterBar Component", () => {
  const filters = [
    {
      key: "status",
      label: "Status",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "Suspended", value: "SUSPENDED" },
      ],
    },
  ];

  it("renders search input and dropdown filter", () => {
    render(
      <FilterBar
        filters={filters}
        searchPlaceholder="Search tenants..."
        onSearchChange={vi.fn()}
      />
    );

    expect(screen.getByPlaceholderText("Search tenants...")).toBeInTheDocument();
    expect(screen.getByLabelText("Filter by Status")).toBeInTheDocument();
  });

  it("triggers search change after debounce", () => {
    vi.useFakeTimers();
    const handleSearch = vi.fn();

    render(
      <FilterBar
        filters={filters}
        onSearchChange={handleSearch}
        debounceMs={200}
      />
    );

    const input = screen.getByPlaceholderText("Search...");
    fireEvent.change(input, { target: { value: "acme" } });

    expect(handleSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(handleSearch).toHaveBeenCalledWith("acme");
    vi.useRealTimers();
  });

  it("renders active filter chips and handles remove", () => {
    const handleClearFilter = vi.fn();
    const handleClearAll = vi.fn();

    render(
      <FilterBar
        filters={filters}
        activeFilters={{ status: "ACTIVE" }}
        onClearFilter={handleClearFilter}
        onClearAll={handleClearAll}
      />
    );

    expect(screen.getByText("Status:")).toBeInTheDocument();
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(1);

    const removeBtn = screen.getByLabelText("Remove Status filter");
    fireEvent.click(removeBtn);
    expect(handleClearFilter).toHaveBeenCalledWith("status");

    const clearAllBtn = screen.getByText("Clear all");
    fireEvent.click(clearAllBtn);
    expect(handleClearAll).toHaveBeenCalled();
  });
});
