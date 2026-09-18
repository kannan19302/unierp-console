"use client";

import { useEffect } from "react";
import { useOptionalTheme } from "@kannan19302/ui/theme";

/** Keep persisted appearance preferences within the provider's Strata family. */
export function ProviderThemeBoundary() {
  const theme = useOptionalTheme();
  const setting = theme?.setting;
  const setTheme = theme?.setTheme;
  useEffect(() => {
    if (!setting || !setTheme || setting === "system" || setting.startsWith("strata")) return;
    setTheme(setting.includes("contrast") ? "strata-high-contrast" : setting.includes("dark") ? "strata-dark" : "strata");
  }, [setting, setTheme]);
  return null;
}

export function ProviderThemeControl({ className }: { className?: string }) {
  const theme = useOptionalTheme();
  return (
    <select aria-label="Appearance" className={className} value={theme?.setting ?? "strata-dark"}
      onChange={event => {
        const value = event.target.value;
        if (value === "strata" || value === "strata-dark" || value === "strata-high-contrast" || value === "system") theme?.setTheme(value);
      }}>
      <option value="strata">Light</option>
      <option value="strata-dark">Dark</option>
      <option value="strata-high-contrast">High contrast</option>
      <option value="system">System</option>
    </select>
  );
}
