"use client";

import { useToastContext, type ToastOptions, type ToastVariant } from "../components/ToastProvider";

export function useToast() {
  return useToastContext();
}

export type { ToastOptions, ToastVariant };
