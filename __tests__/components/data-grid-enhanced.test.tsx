import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DataGridEnhanced } from "@/components/data-display/DataGridEnhanced";

describe("DataGridEnhanced (WS11)", () => {
  const columns = [
    { key: "id", label: "ID" },
    { key: "name", label: "Name" },
    { key: "status", label: "Status" },
  ];

  it("renders table mode with column picker", () => {
    render(
      <DataGridEnhanced mode="table" columns={columns}>
        <div>Table Content</div>
      </DataGridEnhanced>
    );

    expect(screen.getByText("Columns")).toBeInTheDocument();
    expect(screen.getByText("Table Content")).toBeInTheDocument();
  });

  it("renders kanban board mode", () => {
    const kanbanColumns = [
      { key: "todo", title: "To Do" },
      { key: "done", title: "Completed" },
    ];
    const items = [
      { id: "1", columnKey: "todo", title: "Task Alpha" },
      { id: "2", columnKey: "done", title: "Task Beta" },
    ];

    render(
      <DataGridEnhanced
        mode="kanban"
        columns={columns}
        kanbanColumns={kanbanColumns}
        items={items}
        renderCard={(item) => <div>{item.title}</div>}
      />
    );

    expect(screen.getByText("To Do")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Task Alpha")).toBeInTheDocument();
  });
});
