"use client";

import { useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export type UrlStateValue = string | number | boolean | null | undefined;

/**
 * Generic hook for synchronizing state with URL search parameters.
 * Automatically handles batching, URL encoding, and history updates without full page reloads.
 */
export function useUrlState<T extends Record<string, UrlStateValue>>(
  defaults: T
): [T, (updates: Partial<T> | ((prev: T) => Partial<T>)) => void, () => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Compute current state from URL search parameters with fallback to defaults
  const state = useMemo(() => {
    const current: Record<string, any> = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const paramVal = searchParams.get(key);
      if (paramVal !== null) {
        const defaultVal = defaults[key];
        if (typeof defaultVal === "number") {
          const parsed = Number(paramVal);
          current[key] = isNaN(parsed) ? defaultVal : parsed;
        } else if (typeof defaultVal === "boolean") {
          current[key] = paramVal === "true";
        } else {
          current[key] = paramVal;
        }
      }
    }
    return current as T;
  }, [searchParams, defaults]);

  // Update URL search parameters
  const setUrlState = useCallback(
    (updates: Partial<T> | ((prev: T) => Partial<T>)) => {
      const nextUpdates = typeof updates === "function" ? updates(state) : updates;
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(nextUpdates)) {
        if (value === null || value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router, state]
  );

  // Clear all tracked parameters
  const clearUrlState = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of Object.keys(defaults)) {
      params.delete(key);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router, defaults]);

  return [state, setUrlState, clearUrlState];
}

/**
 * Dedicated hook for active tab synchronization with URL search params.
 */
export function useUrlTab<T extends string>(
  defaultTab: T,
  paramKey: string = "tab"
): [T, (tab: T) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const currentTab = (searchParams.get(paramKey) as T) || defaultTab;

  const setTab = useCallback(
    (tab: T) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === defaultTab) {
        params.delete(paramKey);
      } else {
        params.set(paramKey, tab);
      }
      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [searchParams, pathname, router, defaultTab, paramKey]
  );

  return [currentTab, setTab];
}

/**
 * Dedicated hook for CRUD drawer state synchronization with URL search params.
 */
export function useUrlDrawer(drawerParam = "drawer", idParam = "id") {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const drawerMode = searchParams.get(drawerParam);
  const selectedId = searchParams.get(idParam);
  const isOpen = Boolean(drawerMode);

  const openDrawer = useCallback(
    (mode: "create" | "edit" | "view" | string, id?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(drawerParam, mode);
      if (id) {
        params.set(idParam, id);
      } else {
        params.delete(idParam);
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pathname, router, drawerParam, idParam]
  );

  const closeDrawer = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(drawerParam);
    params.delete(idParam);
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(newUrl, { scroll: false });
  }, [searchParams, pathname, router, drawerParam, idParam]);

  return {
    isOpen,
    drawerMode,
    selectedId,
    openDrawer,
    closeDrawer,
  };
}

export default useUrlState;
