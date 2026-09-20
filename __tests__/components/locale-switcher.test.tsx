import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { LocaleSwitcher } from "@/components/shell/LocaleSwitcher";
import { setGlobalLocale } from "@/lib/i18n/use-translations";

describe("LocaleSwitcher (WS9.6)", () => {
  beforeEach(() => {
    setGlobalLocale("en");
  });

  it("renders trigger button with current locale", () => {
    render(<LocaleSwitcher />);
    expect(screen.getByRole("button", { name: /Language: English/i })).toBeInTheDocument();
  });

  it("opens dropdown and lists supported languages when clicked", () => {
    render(<LocaleSwitcher />);
    const trigger = screen.getByRole("button", { name: /Language: English/i });

    fireEvent.click(trigger);

    expect(screen.getByRole("listbox", { name: "Select locale" })).toBeInTheDocument();
    expect(screen.getByText("Español")).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(screen.getByText("Deutsch")).toBeInTheDocument();
    expect(screen.getByText("日本語")).toBeInTheDocument();
  });

  it("selects a new locale when option clicked", () => {
    render(<LocaleSwitcher />);
    const trigger = screen.getByRole("button", { name: /Language: English/i });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByText("Español"));

    // Dropdown closes, trigger shows Español
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(screen.getByRole("button", { name: /Language: Español/i })).toBeInTheDocument();
  });

  it("closes on Escape key press", () => {
    render(<LocaleSwitcher />);
    const trigger = screen.getByRole("button", { name: /Language: English/i });

    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
