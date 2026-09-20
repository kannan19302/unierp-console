import type { BreadcrumbItem, AppManifest } from "./types";
import { NAV_ITEMS } from "./registry";

export function findNavItem(predicate: (item: AppManifest) => boolean): AppManifest | undefined {
  return NAV_ITEMS.find(predicate);
}

export function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [
    { key: "console", label: "Admin OS", href: "/overview" },
  ];

  if (!pathname || pathname === "/" || pathname === "/overview") {
    crumbs.push({ key: "overview", label: "Overview", href: "/overview" });
    return crumbs;
  }

  if (pathname === "/apps") {
    crumbs.push({ key: "apps", label: "App Launchpad", href: "/apps" });
    return crumbs;
  }

  // Find active top-level nav item by base or canonicalPath
  const activeItem = NAV_ITEMS.find(
    (i) =>
      pathname === i.base ||
      pathname.startsWith(`${i.base}/`) ||
      Boolean(
        i.canonicalPath &&
          (pathname === i.canonicalPath || pathname.startsWith(`${i.canonicalPath}/`))
      ),
  );

  if (!activeItem) {
    // Dynamic fallback for unmapped routes
    const segments = pathname.split("/").filter(Boolean);
    let currentPath = "";
    for (const seg of segments) {
      currentPath += `/${seg}`;
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
      crumbs.push({ key: currentPath, label, href: currentPath });
    }
    return crumbs;
  }

  if (activeItem.clusterName) {
    crumbs.push({
      key: `cluster-${activeItem.clusterId}`,
      label: activeItem.clusterName,
      href: "/apps",
    });
  }

  crumbs.push({
    key: activeItem.id,
    label: activeItem.label,
    href: activeItem.base,
  });

  // Find matching tab within the active item
  const activeTab = activeItem.tabs.find(
    (t) =>
      pathname === t.path ||
      (t.path !== activeItem.base && pathname.startsWith(`${t.path}/`)),
  );

  if (activeTab) {
    if (activeTab.path !== activeItem.base || activeTab.label !== activeItem.label) {
      crumbs.push({
        key: activeTab.key,
        label: activeTab.label,
        href: activeTab.path,
      });
    }

    // Handle nested sub-routes beyond tab path (e.g. /tenants/directory/create)
    if (pathname.startsWith(activeTab.path) && pathname !== activeTab.path) {
      const remainder = pathname.slice(activeTab.path.length).replace(/^\//, "");
      if (remainder) {
        const parts = remainder.split("/").filter(Boolean);
        let accPath = activeTab.path;
        for (const part of parts) {
          accPath += `/${part}`;
          const label =
            part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
          crumbs.push({ key: accPath, label, href: accPath });
        }
      }
    }
  } else if (
    pathname !== activeItem.base &&
    (!activeItem.canonicalPath || pathname !== activeItem.canonicalPath)
  ) {
    // Handle sub-routes directly under item base
    const basePrefix = pathname.startsWith(activeItem.base)
      ? activeItem.base
      : activeItem.canonicalPath ?? activeItem.base;
    const remainder = pathname.slice(basePrefix.length).replace(/^\//, "");
    if (remainder) {
      const parts = remainder.split("/").filter(Boolean);
      let accPath = basePrefix;
      for (const part of parts) {
        accPath += `/${part}`;
        const label =
          part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " ");
        crumbs.push({ key: accPath, label, href: accPath });
      }
    }
  }

  return crumbs;
}
