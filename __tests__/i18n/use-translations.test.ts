import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useTranslations, setGlobalLocale } from "@/lib/i18n/use-translations";

describe("useTranslations (WS9)", () => {
  beforeEach(() => {
    act(() => {
      setGlobalLocale("en");
    });
  });

  it("translates keys in English by default", () => {
    const { result } = renderHook(() => useTranslations());

    expect(result.current.t("common.save")).toBe("Save");
    expect(result.current.t("common.cancel")).toBe("Cancel");
    expect(result.current.t("shell.title")).toBe("Provider Admin Console");
    expect(result.current.t("pcc.ops")).toBe("Platform Operations & Reliability");
  });

  it("supports namespaced translations", () => {
    const { result } = renderHook(() => useTranslations("common"));

    expect(result.current.t("save")).toBe("Save");
    expect(result.current.t("delete")).toBe("Delete");
  });

  it("reactively updates strings when locale is switched", () => {
    const { result } = renderHook(() => useTranslations("common"));

    expect(result.current.t("save")).toBe("Save");

    act(() => {
      result.current.setLocale("es");
    });
    expect(result.current.t("save")).toBe("Guardar");

    act(() => {
      result.current.setLocale("fr");
    });
    expect(result.current.t("save")).toBe("Enregistrer");

    act(() => {
      result.current.setLocale("de");
    });
    expect(result.current.t("save")).toBe("Speichern");

    act(() => {
      result.current.setLocale("ja");
    });
    expect(result.current.t("save")).toBe("保存");
  });

  it("returns fallback or key when translation key is unknown", () => {
    const { result } = renderHook(() => useTranslations());

    expect(result.current.t("nonexistent.key", "Default Value")).toBe("Default Value");
    expect(result.current.t("nonexistent.key")).toBe("nonexistent.key");
  });
});
