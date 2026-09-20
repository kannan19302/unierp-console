"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, ChevronUp, Check } from "lucide-react";
import { useTranslations } from "@/lib/i18n/use-translations";
import { SUPPORTED_LOCALES, LOCALE_METADATA, type SupportedLocale } from "@/lib/i18n/config";
import styles from "./LocaleSwitcher.module.css";

export function LocaleSwitcher() {
  const { locale, setLocale } = useTranslations();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click or escape
  useEffect(() => {
    if (!open) return;
    const handleDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const currentMeta = LOCALE_METADATA[locale] || LOCALE_METADATA.en;

  return (
    <div className={styles.switcherWrap} ref={containerRef}>
      {open && (
        <div className={styles.menuDropdown} role="listbox" aria-label="Select locale">
          {SUPPORTED_LOCALES.map((loc) => {
            const meta = LOCALE_METADATA[loc];
            const isActive = loc === locale;
            return (
              <button
                key={loc}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`${styles.menuOption} ${isActive ? styles.menuOptionActive : ""}`}
                onClick={() => {
                  setLocale(loc);
                  setOpen(false);
                }}
              >
                <div className={styles.optionLeft}>
                  <span className={styles.flag}>{meta.flag}</span>
                  <span>{meta.nativeName}</span>
                </div>
                {isActive && <Check size={12} />}
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={styles.triggerBtn}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={`Language: ${currentMeta.nativeName}. Click to change.`}
      >
        <div className={styles.triggerLeft}>
          <Globe size={14} />
          <span>{currentMeta.nativeName}</span>
        </div>
        <ChevronUp size={12} />
      </button>
    </div>
  );
}
