import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaginatedTable } from "../src/components/PaginatedTable";

interface TestRow {
  id: string;
  name: string;
  status: string;
}

describe("PaginatedTable Component", () => {
  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "status", label: "Status" },
  ];

  const data: TestRow[] = [
    { id: "1", name: "Alpha", status: "Active" },
    { id: "2", name: "Beta", status: "Inactive" },
    { id: "3", name: "Gamma", status: "Active" },
  ];

  it("renders table headers and rows", () => {
    render(<PaginatedTable columns={columns} data={data} total={3} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getByText("Gamma")).toBeInTheDocument();
  });

  it("handles sorting when header is clicked", () => {
    const handleSort = vi.fn();
    render(
      <PaginatedTable
        columns={columns}
        data={data}
        sortColumn="name"
        sortDirection="asc"
        onSortChange={handleSort}
      />
    );

    fireEvent.click(screen.getByText("Name"));
    expect(handleSort).toHaveBeenCalledWith("name", "desc");
  });

  it("handles row selection and select all", () => {
    const handleSelection = vi.fn();
    render(
      <PaginatedTable
        columns={columns}
        data={data}
        selectable={true}
        selectedKeys={["1"]}
        onSelectionChange={handleSelection}
      />
    );

    const selectAllCheckbox = screen.getByLabelText("Select all rows on page");
    fireEvent.click(selectAllCheckbox);
    expect(handleSelection).toHaveBeenCalledWith(["1", "2", "3"]);

    const rowCheckbox = screen.getByLabelText("Select row 2");
    fireEvent.click(rowCheckbox);
    expect(handleSelection).toHaveBeenCalledWith(["1", "2"]);
  });

  it("triggers pagination callbacks", () => {
    const handlePageChange = vi.fn();
    const handlePageSizeChange = vi.fn();

    render(
      <PaginatedTable
        columns={columns}
        data={data}
        page={1}
        pageSize={10}
        total={30}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    );

    expect(screen.getByText("Showing 1 to 10 of 30 results")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Next page"));
    expect(handlePageChange).toHaveBeenCalledWith(2);

    const pageSizeSelect = screen.getByLabelText("Rows per page");
    fireEvent.change(pageSizeSelect, { target: { value: "25" } });
    expect(handlePageSizeChange).toHaveBeenCalledWith(25);
  });
});
