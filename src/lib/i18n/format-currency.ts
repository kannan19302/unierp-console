import { DEFAULT_LOCALE } from "./config";

export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = DEFAULT_LOCALE
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
