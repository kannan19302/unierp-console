import { z } from "zod";
import type { FormFieldType, OptionItem } from "@/components/FormField";

export interface FieldDef {
  name: string;
  label: string;
  type?: FormFieldType;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: OptionItem[];
  defaultValue?: any;
  readOnly?: boolean;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors: Record<string, string>;
}

export function validateForm<T>(schema: z.ZodType<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return {
      valid: true,
      data: result.data,
      errors: {},
    };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (path && !errors[path]) {
      errors[path] = issue.message;
    } else if (!path && !errors["_root"]) {
      errors["_root"] = issue.message;
    }
  }

  return {
    valid: false,
    errors,
  };
}

export function schemaToFields(schema: z.ZodObject<z.ZodRawShape>): FieldDef[] {
  const shape = schema.shape;
  const fields: FieldDef[] = [];

  for (const [key, value] of Object.entries(shape)) {
    let unwrapped: any = value;
    let isOptional = false;

    if (unwrapped instanceof z.ZodOptional || unwrapped instanceof z.ZodNullable) {
      isOptional = true;
      unwrapped = unwrapped.unwrap();
    }

    let type: FormFieldType = "text";
    let options: OptionItem[] | undefined = undefined;

    if (unwrapped instanceof z.ZodString) {
      // Check for email or url or password
      if (key.toLowerCase().includes("email")) {
        type = "email";
      } else if (key.toLowerCase().includes("password")) {
        type = "password";
      } else if (key.toLowerCase().includes("description") || key.toLowerCase().includes("notes")) {
        type = "textarea";
      } else {
        type = "text";
      }
    } else if (unwrapped instanceof z.ZodNumber) {
      type = "number";
    } else if (unwrapped instanceof z.ZodBoolean) {
      type = "checkbox";
    } else if (unwrapped instanceof z.ZodEnum) {
      type = "select";
      options = (unwrapped.options as string[]).map((val) => ({
        label: val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        value: val,
      }));
    } else if (unwrapped instanceof z.ZodDate) {
      type = "date";
    }

    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    fields.push({
      name: key,
      label,
      type,
      required: !isOptional,
      options,
    });
  }

  return fields;
}
