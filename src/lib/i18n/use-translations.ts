"use client";

import { useState, useEffect, useCallback } from "react";
import {
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_METADATA,
  type SupportedLocale,
} from "./config";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import fr from "../../../messages/fr.json";
import de from "../../../messages/de.json";
import ja from "../../../messages/ja.json";

const MESSAGES: Record<SupportedLocale, any> = {
  en,
  es,
  fr,
  de,
  ja,
};

const STORAGE_KEY = "unierp_locale";

// Global locale event listener for multi-component reactive sync
let globalLocale: SupportedLocale = DEFAULT_LOCALE;
const listeners = new Set<(locale: SupportedLocale) => void>();

export function setGlobalLocale(nextLocale: SupportedLocale): void {
  globalLocale = nextLocale;
  try {
    localStorage.setItem(STORAGE_KEY, nextLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLocale;
      document.documentElement.dir = LOCALE_METADATA[nextLocale]?.dir || "ltr";
    }
  } catch {}
  listeners.forEach((l) => l(nextLocale));
}

export function useTranslations(namespace?: string) {
  const [currentLocale, setCurrentLocale] = useState<SupportedLocale>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY) as SupportedLocale;
        if (stored && SUPPORTED_LOCALES.includes(stored)) {
          return stored;
        }
      } catch {}
    }
    return globalLocale;
  });

  useEffect(() => {
    const handleUpdate = (l: SupportedLocale) => setCurrentLocale(l);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const t = useCallback(
    (key: string, fallback?: string): string => {
      const fullPath = namespace ? `${namespace}.${key}` : key;
      const parts = fullPath.split(".");

      // Try current locale
      let currentObj: any = MESSAGES[currentLocale];
      for (const part of parts) {
        if (!currentObj || typeof currentObj !== "object") {
          currentObj = undefined;
          break;
        }
        currentObj = currentObj[part];
      }

      if (typeof currentObj === "string") {
        return currentObj;
      }

      // Fallback to English
      let fallbackObj: any = MESSAGES.en;
      for (const part of parts) {
        if (!fallbackObj || typeof fallbackObj !== "object") {
          fallbackObj = undefined;
          break;
        }
        fallbackObj = fallbackObj[part];
      }

      if (typeof fallbackObj === "string") {
        return fallbackObj;
      }

      return fallback ?? key;
    },
    [currentLocale, namespace]
  );

  return {
    t,
    locale: currentLocale,
    setLocale: setGlobalLocale,
    supportedLocales: SUPPORTED_LOCALES,
    metadata: LOCALE_METADATA,
  };
}
