import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PresenceIndicator, type PresenceUser } from "@/components/shared/PresenceIndicator";

describe("PresenceIndicator (WS8.4)", () => {
  const mockUsers: PresenceUser[] = [
    { id: "1", name: "Jane Doe", status: "active" },
    { id: "2", name: "John Smith", status: "active" },
    { id: "3", name: "Alex Turing", status: "idle" },
    { id: "4", name: "Grace Hopper", status: "active" },
    { id: "5", name: "Ada Lovelace", status: "idle" },
  ];

  it("returns null when no users provided", () => {
    const { container } = render(<PresenceIndicator users={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders avatar stack and handles overflow counter", () => {
    render(<PresenceIndicator users={mockUsers} maxVisible={3} />);

    expect(screen.getByLabelText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByLabelText("John Smith")).toBeInTheDocument();
    expect(screen.getByLabelText("Alex Turing")).toBeInTheDocument();

    // 5 users with maxVisible=3 -> overflow +2
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("renders locked editing alert when an operator is editing", () => {
    const usersWithEditing: PresenceUser[] = [
      { id: "1", name: "Jane Doe", status: "active", isEditing: true },
      { id: "2", name: "John Smith", status: "active" },
    ];

    render(<PresenceIndicator users={usersWithEditing} lockedEntityName="tenant" />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/Jane Doe/)).toBeInTheDocument();
    expect(screen.getByText(/is editing this tenant/)).toBeInTheDocument();
  });
});
