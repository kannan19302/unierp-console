import { DEFAULT_LOCALE } from "./config";

export function formatDate(
  date: string | number | Date,
  locale: string = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    return new Intl.DateTimeFormat(locale, options ?? {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(d);
  } catch {
    return String(date);
  }
}

export function formatDateTime(
  date: string | number | Date,
  locale: string = DEFAULT_LOCALE
): string {
  return formatDate(date, locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
