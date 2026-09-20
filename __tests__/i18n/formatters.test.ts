import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatCompactNumber,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/i18n";

describe("i18n Formatters (WS9)", () => {
  it("formats numbers per locale", () => {
    expect(formatNumber(1234567.89, "en")).toBe("1,234,567.89");
    expect(formatNumber(1234567.89, "de")).toBe("1.234.567,89");
  });

  it("formats compact numbers", () => {
    expect(formatCompactNumber(1500, "en")).toBe("1.5K");
    expect(formatCompactNumber(2500000, "en")).toBe("2.5M");
  });

  it("formats currency per locale and currency code", () => {
    const usResult = formatCurrency(1499.99, "USD", "en");
    expect(usResult).toContain("$");
    expect(usResult).toContain("1,499.99");

    const eurResult = formatCurrency(1499.99, "EUR", "de");
    expect(eurResult).toContain("€");
    expect(eurResult).toContain("1.499,99");
  });

  it("formats dates and datetimes across locales", () => {
    const testDate = new Date("2026-09-20T12:00:00Z");
    const enDate = formatDate(testDate, "en");
    expect(enDate).toContain("2026");

    const jaDate = formatDate(testDate, "ja");
    expect(jaDate).toContain("2026");

    const enDateTime = formatDateTime(testDate, "en");
    expect(enDateTime).toContain("2026");
  });
});
