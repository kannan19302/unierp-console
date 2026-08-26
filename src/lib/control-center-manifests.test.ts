import { describe, expect, it } from "vitest";
import {
  ACTIVE_PCC_APP_MANIFESTS,
  PCC_APP_MANIFESTS,
  pccManifestById,
  ACTIVE_OCC_APP_MANIFESTS,
  OCC_APP_MANIFESTS,
  occManifestById,
} from "./control-center-manifests";

describe("PCC canonical app manifests", () => {
  it("declares every PCC app exactly once", () => {
    expect(PCC_APP_MANIFESTS).toHaveLength(22);
    expect(new Set(PCC_APP_MANIFESTS.map((manifest) => manifest.appId)).size).toBe(22);
    expect(PCC_APP_MANIFESTS.every((manifest) => manifest.center === "PCC")).toBe(true);
  });

  it("activates all 22 PCC operations applications including mobile and desktop", () => {
    expect(ACTIVE_PCC_APP_MANIFESTS).toHaveLength(22);
    expect(pccManifestById("PCC-11")?.availability).toBe("ACTIVE");
    expect(pccManifestById("PCC-11")?.entryPath).toBe("/mobile-operations");
    expect(pccManifestById("PCC-12")?.availability).toBe("ACTIVE");
    expect(pccManifestById("PCC-12")?.entryPath).toBe("/desktop-operations");
  });

  it("routes tenant lifecycle to the provider tenant surface", () => {
    expect(pccManifestById("PCC-18")?.entryPath).toBe("/tenants");
    expect(pccManifestById("PCC-18")?.requiredPermission).toBe("pcc.organizations.access");
  });
});

describe("OCC canonical app manifests", () => {
  it("declares every OCC app exactly once", () => {
    expect(OCC_APP_MANIFESTS).toHaveLength(22);
    expect(new Set(OCC_APP_MANIFESTS.map((manifest) => manifest.appId)).size).toBe(22);
    expect(OCC_APP_MANIFESTS.every((manifest) => manifest.center === "OCC")).toBe(true);
  });

  it("activates all 22 OCC operations applications", () => {
    expect(ACTIVE_OCC_APP_MANIFESTS).toHaveLength(22);
    expect(occManifestById("OCC-01")?.availability).toBe("ACTIVE");
    expect(occManifestById("OCC-01")?.entryPath).toBe("/occ");
    expect(occManifestById("OCC-13")?.availability).toBe("ACTIVE");
    expect(occManifestById("OCC-13")?.entryPath).toBe("/occ/war-room");
  });
});

