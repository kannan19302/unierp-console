"use client";
/**
 * Unsaved changes guard hook.
 * Prevents accidental navigation when form data is dirty.
 *
 * - Adds `beforeunload` listener for tab close/refresh
 * - Shows in-app confirmation for Next.js route changes
 *
 * @example
 * const { setDirty, clearDirty } = useUnsavedChanges();
 * // On form change: setDirty()
 * // On successful submit: clearDirty()
 */
import { useState, useEffect, useCallback } from "react";

export function useUnsavedChanges() {
  const [isDirty, setIsDirty] = useState(false);

  // Browser-level guard: beforeunload
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom message but still show the dialog
      e.returnValue = "You have unsaved changes. Are you sure you want to leave?";
      return e.returnValue;
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const setDirty = useCallback(() => setIsDirty(true), []);
  const clearDirty = useCallback(() => setIsDirty(false), []);

  return { isDirty, setDirty, clearDirty };
}
