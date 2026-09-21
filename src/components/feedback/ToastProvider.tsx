"use client";

import React, { createContext, useCallback, useContext, useState, useRef, useMemo, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";
import styles from "./ToastProvider.module.css";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number; // ms; default 5000; 0 = persistent
}

interface ToastItem extends Required<Pick<ToastOptions, "variant" | "message">> {
  id: string;
  title?: string;
  duration: number;
  leaving?: boolean;
}

export interface ToastContextValue {
  showToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_ICONS: Record<ToastVariant, React.ComponentType<{ className?: string; size?: number }>> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))
    );
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);

    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showToast = useCallback(
    ({ title, message, variant = "info", duration = 5000 }: ToastOptions) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        title,
        message,
        variant,
        duration,
      };

      setToasts((prev) => {
        // Keep maximum 3 active toasts
        const next = [item, ...prev];
        return next.slice(0, 3);
      });

      if (duration > 0) {
        timers.current[id] = setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ message, title, variant: "success" }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) => showToast({ message, title, variant: "error" }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast({ message, title, variant: "warning" }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast({ message, title, variant: "info" }),
    [showToast]
  );

  const value = useMemo(
    () => ({ showToast, dismissToast, success, error, warning, info }),
    [showToast, dismissToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.toastContainer} aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => {
          const Icon = VARIANT_ICONS[toast.variant];
          return (
            <div
              key={toast.id}
              role="alert"
              className={`${styles.toast} ${styles[toast.variant]} ${toast.leaving ? styles.leaving : ""}`}
            >
              <div className={styles.icon}>
                <Icon size={18} />
              </div>
              <div className={styles.content}>
                {toast.title && <div className={styles.title}>{toast.title}</div>}
                <div className={styles.message}>{toast.message}</div>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
