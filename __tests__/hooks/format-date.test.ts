import { describe, it, expect } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatRelative,
  formatDuration,
} from "../../src/lib/format-date";

describe("format-date utility", () => {
  it("formats date strings and instances", () => {
    const d = new Date(2026, 8, 20); // Sep 20, 2026
    const res = formatDate(d);
    expect(res).toContain("2026");
    expect(res).toContain("Sep");
  });

  it("formats date and time", () => {
    const d = new Date(2026, 8, 20, 14, 30);
    const res = formatDateTime(d);
    expect(res).toContain("2026");
  });

  it("formats relative time correctly", () => {
    const now = Date.now();
    expect(formatRelative(new Date(now - 10000))).toBe("just now");
    expect(formatRelative(new Date(now - 120000))).toContain("minutes ago");
    expect(formatRelative(new Date(now - 7200000))).toContain("hours ago");
  });

  it("formats durations in human-readable strings", () => {
    expect(formatDuration(45)).toBe("45s");
    expect(formatDuration(120)).toBe("2m");
    expect(formatDuration(3660)).toBe("1h 1m");
    expect(formatDuration(90000)).toBe("1d 1h");
  });
});
