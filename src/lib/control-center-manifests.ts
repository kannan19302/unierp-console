import pccManifests from "../manifests/pcc-apps.json";
import occManifests from "../manifests/occ-apps.json";

function assertManifestRuntimeShape(manifests: typeof pccManifests, expectedCenter: "PCC" | "OCC"): void {
  if (manifests.length !== 22) throw new Error(`${expectedCenter} shell requires 22 app manifests; found ${manifests.length}`);
  const ids = new Set(manifests.map((manifest) => manifest.appId));
  if (ids.size !== manifests.length) throw new Error(`${expectedCenter} shell contains duplicate app manifests`);
  if (manifests.some((manifest) => manifest.center !== expectedCenter)) throw new Error(`${expectedCenter} shell contains a non-${expectedCenter} manifest`);
}

assertManifestRuntimeShape(pccManifests, "PCC");
assertManifestRuntimeShape(occManifests as any, "OCC");

export const PCC_APP_MANIFESTS = pccManifests;
export const ACTIVE_PCC_APP_MANIFESTS = pccManifests.filter(
  (manifest) => manifest.availability === "ACTIVE" || manifest.availability === "PREVIEW",
);

export function pccManifestById(appId: string) {
  return PCC_APP_MANIFESTS.find((manifest) => manifest.appId === appId);
}

export const OCC_APP_MANIFESTS = occManifests;
export const ACTIVE_OCC_APP_MANIFESTS = occManifests.filter(
  (manifest) => manifest.availability === "ACTIVE" || manifest.availability === "PREVIEW",
);

export function occManifestById(appId: string) {
  return OCC_APP_MANIFESTS.find((manifest) => manifest.appId === appId);
}

