import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EntityContextMenu, type ContextMenuItem } from "@/components/shared/EntityContextMenu";

describe("EntityContextMenu (WS8.3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockItems: ContextMenuItem[] = [
    { id: "view", label: "View Details", onClick: vi.fn(), shortcut: "⌘V" },
    { id: "edit", label: "Edit Record", onClick: vi.fn(), shortcut: "⌘E" },
    { id: "delete", label: "Delete", onClick: vi.fn(), destructive: true, permission: "admin.delete" },
    { id: "disabled-item", label: "Archive", onClick: vi.fn(), disabled: true },
  ];

  it("renders visible context menu items and header", () => {
    render(
      <EntityContextMenu
        title="Tenant Actions"
        items={mockItems}
        position={{ x: 100, y: 150 }}
        onClose={vi.fn()}
        userPermissions={["*"]}
      />
    );

    expect(screen.getByText("Tenant Actions")).toBeInTheDocument();
    expect(screen.getByText("View Details")).toBeInTheDocument();
    expect(screen.getByText("Edit Record")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
  });

  it("triggers item onClick and onClose when clicked", () => {
    const onClose = vi.fn();
    render(
      <EntityContextMenu
        items={mockItems}
        position={{ x: 100, y: 150 }}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText("View Details"));
    expect(mockItems[0].onClick).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("does not trigger onClick for disabled items", () => {
    const onClose = vi.fn();
    render(
      <EntityContextMenu
        items={mockItems}
        position={{ x: 100, y: 150 }}
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByText("Archive"));
    expect(mockItems[3].onClick).not.toHaveBeenCalled();
  });

  it("filters out items when user lacks RBAC permission", () => {
    render(
      <EntityContextMenu
        items={mockItems}
        position={{ x: 100, y: 150 }}
        onClose={vi.fn()}
        userPermissions={["tenant.view", "tenant.edit"]} // lacks admin.delete
      />
    );

    expect(screen.queryByText("Delete")).toBeNull();
    expect(screen.getByText("View Details")).toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    const onClose = vi.fn();
    render(
      <EntityContextMenu
        items={mockItems}
        position={{ x: 100, y: 150 }}
        onClose={onClose}
      />
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
