export const SUPPORTED_LOCALES = ["en", "es", "fr", "de", "ja"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = "en";

export const LOCALE_METADATA: Record<
  SupportedLocale,
  { name: string; nativeName: string; flag: string; dir: "ltr" | "rtl" }
> = {
  en: { name: "English", nativeName: "English", flag: "🇺🇸", dir: "ltr" },
  es: { name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  fr: { name: "French", nativeName: "Français", flag: "🇫🇷", dir: "ltr" },
  de: { name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  ja: { name: "Japanese", nativeName: "日本語", flag: "🇯🇵", dir: "ltr" },
};
