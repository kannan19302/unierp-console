"use client";

import { useForm, type UseFormProps, type FieldValues, type DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { useCallback, useEffect, useRef } from "react";
import { useToast } from "./use-toast";

export interface UseCrudFormOptions<T extends FieldValues> {
  schema: ZodType<T, any, any>;
  defaultValues?: DefaultValues<T>;
  initialData?: Partial<T> | null;
  onSubmit: (values: T) => Promise<void> | void;
  onSuccess?: () => void;
  successMessage?: string;
  errorMessage?: string;
  mode?: UseFormProps<T>["mode"];
}

export function useCrudForm<T extends FieldValues>({
  schema,
  defaultValues,
  initialData,
  onSubmit,
  onSuccess,
  successMessage = "Record saved successfully.",
  errorMessage = "Failed to save record.",
  mode = "onBlur",
}: UseCrudFormOptions<T>) {
  const toast = useToast();

  const form = useForm<T>({
    resolver: zodResolver(schema as any),
    defaultValues: (initialData ? { ...defaultValues, ...initialData } : defaultValues) as DefaultValues<T>,
    mode,
  });

  const { reset } = form;
  const initialDataStr = JSON.stringify(initialData ?? null);
  const prevInitialData = useRef(initialDataStr);

  // Reset form only when initialData actually changes
  useEffect(() => {
    if (initialDataStr !== prevInitialData.current) {
      prevInitialData.current = initialDataStr;
      if (initialData) {
        reset({ ...defaultValues, ...initialData } as any);
      }
    }
  }, [initialDataStr, initialData, defaultValues, reset]);

  const handleSubmit = useCallback(
    (e?: React.BaseSyntheticEvent) => {
      return form.handleSubmit(async (values) => {
        try {
          await onSubmit(values);
          if (successMessage) {
            toast.success(successMessage);
          }
          if (onSuccess) {
            onSuccess();
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : errorMessage;
          toast.error(msg);
          throw err;
        }
      })(e);
    },
    [form, onSubmit, successMessage, onSuccess, errorMessage, toast]
  );

  return {
    ...form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    isDirty: form.formState.isDirty,
    isValid: form.formState.isValid,
    errors: form.formState.errors,
  };
}

export default useCrudForm;
