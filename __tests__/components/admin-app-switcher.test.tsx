import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminAppSwitcher from "../../src/components/navigation/AdminAppSwitcher";
import { NAV_ITEMS } from "../../src/lib/navigation";

vi.mock("next/navigation", () => ({
  usePathname: () => "/ops",
  useRouter: () => ({ push: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe("AdminAppSwitcher component", () => {
  it("renders waffle trigger button with accessible attributes", () => {
    render(<AdminAppSwitcher />);
    const waffleBtn = screen.getByRole("button", { name: /Admin OS App Switcher/i });
    expect(waffleBtn).toBeInTheDocument();
    expect(waffleBtn).toHaveAttribute("aria-expanded", "false");
    expect(waffleBtn).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("opens flyout dialog upon clicking waffle button and renders header, search, and apps", () => {
    render(<AdminAppSwitcher />);
    const waffleBtn = screen.getByRole("button", { name: /Admin OS App Switcher/i });
    fireEvent.click(waffleBtn);
    expect(waffleBtn).toHaveAttribute("aria-expanded", "true");

    const dialog = screen.getByRole("dialog", { name: /UniERP Admin OS Applications Suite/i });
    expect(dialog).toBeInTheDocument();

    expect(screen.getByText("Switch workspace")).toBeInTheDocument();
    expect(screen.getByText(`${NAV_ITEMS.length} available`)).toBeInTheDocument();

    const searchInput = screen.getByRole("textbox", { name: "Search provider workspaces" });
    expect(searchInput).toBeInTheDocument();

    // Default renders all apps
    const appCards = screen.getAllByRole("button").filter((b) => b.className.includes("appCard"));
    expect(appCards.length).toBe(NAV_ITEMS.length);
  });

  it("filters applications when search query is entered", () => {
    render(<AdminAppSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /Admin OS App Switcher/i }));

    const searchInput = screen.getByRole("textbox", { name: "Search provider workspaces" });
    fireEvent.change(searchInput, { target: { value: "threat" } });

    // Should match Platform Security or Security Intelligence SOC
    expect(screen.getByText("Security Intelligence (SOC)")).toBeInTheDocument();
    const filteredCards = screen.getAllByRole("button").filter((b) => b.className.includes("appCard"));
    expect(filteredCards.length).toBeLessThan(NAV_ITEMS.length);
  });

  it("closes flyout when close button is clicked", () => {
    render(<AdminAppSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /Admin OS App Switcher/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", { name: /Close switcher/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes flyout when Escape key is pressed", () => {
    render(<AdminAppSwitcher />);
    fireEvent.click(screen.getByRole("button", { name: /Admin OS App Switcher/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
