"use client";

import React from "react";
import { SchemaForm, type FormSectionSchema } from "@kannan19302/ui/form-engine";

export interface SchemaFormEngineProps {
  sections: FormSectionSchema[];
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  onReset?: () => void;
  submitLabel?: string;
  resetLabel?: string;
  loading?: boolean;
}

export function SchemaFormEngine({
  sections,
  initialValues,
  onSubmit,
  onReset,
  submitLabel = "Save Configuration",
  resetLabel = "Cancel",
  loading = false,
}: SchemaFormEngineProps) {
  return (
    <SchemaForm
      sections={sections}
      initialValues={initialValues}
      onSubmit={onSubmit}
      onReset={onReset}
      submitLabel={submitLabel}
      resetLabel={resetLabel}
      loading={loading}
    />
  );
}
