import { describe, it, expect } from "vitest";
import { z } from "zod";
import { validateForm, schemaToFields } from "../../src/lib/form-validation";

describe("form-validation utility", () => {
  const schema = z.object({
    name: z.string().min(2, "Name too short"),
    email: z.string().email("Invalid email"),
    age: z.number().min(18).optional(),
    role: z.enum(["ADMIN", "STAFF"]),
  });

  it("validates data correctly with valid payload", () => {
    const data = {
      name: "Alice",
      email: "alice@example.com",
      role: "ADMIN",
    };

    const res = validateForm(schema, data);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual({});
    expect(res.data).toEqual(data);
  });

  it("returns mapped field errors for invalid payload", () => {
    const data = {
      name: "A",
      email: "bad-email",
      role: "INVALID",
    };

    const res = validateForm(schema, data);
    expect(res.valid).toBe(false);
    expect(res.errors.name).toBe("Name too short");
    expect(res.errors.email).toBe("Invalid email");
    expect(res.errors.role).toBeDefined();
  });

  it("converts Zod schema to FieldDef list", () => {
    const fields = schemaToFields(schema);
    expect(fields).toHaveLength(4);

    const nameField = fields.find((f) => f.name === "name");
    expect(nameField?.required).toBe(true);
    expect(nameField?.type).toBe("text");

    const emailField = fields.find((f) => f.name === "email");
    expect(emailField?.type).toBe("email");

    const ageField = fields.find((f) => f.name === "age");
    expect(ageField?.required).toBe(false);
    expect(ageField?.type).toBe("number");

    const roleField = fields.find((f) => f.name === "role");
    expect(roleField?.type).toBe("select");
    expect(roleField?.options).toEqual([
      { label: "ADMIN", value: "ADMIN" },
      { label: "STAFF", value: "STAFF" },
    ]);
  });
});
