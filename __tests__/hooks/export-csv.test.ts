import { describe, it, expect } from "vitest";
import { generateCsvContent, formatCsvValue } from "../../src/lib/export-csv";

describe("export-csv utility", () => {
  it("formats CSV values escaping quotes and commas", () => {
    expect(formatCsvValue("simple")).toBe('"simple"');
    expect(formatCsvValue("hello, world")).toBe('"hello, world"');
    expect(formatCsvValue('quote "here"')).toBe('"quote ""here"""');
    expect(formatCsvValue(null)).toBe('""');
  });

  it("generates CSV string from tabular rows and columns", () => {
    const columns = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
    ];
    const rows = [
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob, Jr." },
    ];

    const csv = generateCsvContent(columns, rows);
    expect(csv).toBe('"ID","Name"\n"1","Alice"\n"2","Bob, Jr."');
  });
});
