import manifests from "../manifests/pcc-apps.json";

function assertPccManifestRuntimeShape(): void {
  if (manifests.length !== 22) throw new Error(`PCC shell requires 22 app manifests; found ${manifests.length}`);
  const ids = new Set(manifests.map((manifest) => manifest.appId));
  if (ids.size !== manifests.length) throw new Error("PCC shell contains duplicate app manifests");
  if (manifests.some((manifest) => manifest.center !== "PCC")) throw new Error("PCC shell contains a non-PCC manifest");
}

assertPccManifestRuntimeShape();

export const PCC_APP_MANIFESTS = manifests;
export const ACTIVE_PCC_APP_MANIFESTS = manifests.filter(
  (manifest) => manifest.availability === "ACTIVE" || manifest.availability === "PREVIEW",
);

export function pccManifestById(appId: string) {
  return PCC_APP_MANIFESTS.find((manifest) => manifest.appId === appId);
}
