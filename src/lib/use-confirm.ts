"use client";

import React, { useState, useCallback, useRef } from "react";
import { ConfirmDialog, type ConfirmDialogProps } from "../components/ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  message: string;
  entityName?: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  requireTyping?: boolean;
}

export function useConfirm() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: "Confirm Action",
    message: "Are you sure you want to proceed?",
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const handleCancel = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const ConfirmModal = useCallback(() => {
    return React.createElement(ConfirmDialog, {
      open: isOpen,
      title: options.title,
      message: options.message,
      entityName: options.entityName,
      confirmLabel: options.confirmLabel,
      variant: options.variant,
      requireTyping: options.requireTyping,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    });
  }, [isOpen, options, handleConfirm, handleCancel]);

  return {
    confirm,
    ConfirmModal,
  };
}
