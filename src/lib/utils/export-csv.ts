/**
 * Universal CSV export utility for tabular data.
 */

export interface ExportColumn<T = any> {
  key: string;
  label: string;
  formatter?: (val: any, row: T) => string;
}

export function formatCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function generateCsvContent<T extends Record<string, any>>(
  columns: ExportColumn<T>[],
  rows: T[]
): string {
  const headers = columns.map((c) => formatCsvValue(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const raw = row[col.key];
          const formatted = col.formatter ? col.formatter(raw, row) : raw;
          return formatCsvValue(formatted);
        })
        .join(",")
    )
    .join("\n");

  return `${headers}\n${body}`;
}

export function exportToCsv<T extends Record<string, any>>(
  columns: ExportColumn<T>[],
  rows: T[],
  filename = "export.csv"
): void {
  const content = generateCsvContent(columns, rows);
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
