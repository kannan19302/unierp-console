import { DEFAULT_LOCALE } from "./config";

export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat(locale, options).format(value);
  } catch {
    return value.toLocaleString();
  }
}

export function formatCompactNumber(
  value: number,
  locale: string = DEFAULT_LOCALE
): string {
  try {
    return new Intl.NumberFormat(locale, {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}
