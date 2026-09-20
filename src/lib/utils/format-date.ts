/**
 * Date/time formatting utilities using `Intl.DateTimeFormat`.
 * Zero external dependencies. Respects browser timezone by default.
 *
 * @example
 * formatDate("2026-09-20T15:38:20+05:30")    // "Sep 20, 2026"
 * formatDateTime("2026-09-20T15:38:20+05:30") // "Sep 20, 2026, 3:38 PM"
 * formatRelative("2026-09-20T13:00:00Z")      // "2 hours ago"
 * formatDuration(8100)                         // "2h 15m"
 */

const dateFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

const dateTimeSecFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

function toDate(input: string | number | Date): Date {
  if (input instanceof Date) return input;
  return new Date(input);
}

/** "Sep 20, 2026" */
export function formatDate(input: string | number | Date): string {
  try {
    return dateFmt.format(toDate(input));
  } catch {
    return String(input);
  }
}

/** "Sep 20, 2026, 3:38 PM" */
export function formatDateTime(input: string | number | Date): string {
  try {
    return dateTimeFmt.format(toDate(input));
  } catch {
    return String(input);
  }
}

/** "Sep 20, 2026, 3:38:20 PM" */
export function formatDateTimeSec(input: string | number | Date): string {
  try {
    return dateTimeSecFmt.format(toDate(input));
  } catch {
    return String(input);
  }
}

/** "2 hours ago", "3 days ago", "just now" */
export function formatRelative(input: string | number | Date): string {
  try {
    const date = toDate(input);
    const now = Date.now();
    const diffMs = now - date.getTime();

    if (diffMs < 0) return "just now";

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return "just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return days === 1 ? "1 day ago" : `${days} days ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 5) return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;

    const years = Math.floor(days / 365);
    return years === 1 ? "1 year ago" : `${years} years ago`;
  } catch {
    return String(input);
  }
}

/** "2h 15m", "45s", "3d 2h" */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) return "0s";
  if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0s";
}
