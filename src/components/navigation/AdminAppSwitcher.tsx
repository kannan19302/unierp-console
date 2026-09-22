"use client";

import { useRouter, usePathname } from "next/navigation";
import { NAV_ITEMS, ADMIN_OS_CLUSTERS, type AppManifest } from "@/lib/navigation";
import {
  AdminAppSwitcher as AdminAppSwitcherUI,
} from "@kannan19302/ui/platforms/provider-admin";

export interface AdminAppSwitcherProps {
  className?: string;
}

export default function AdminAppSwitcher({ className }: AdminAppSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <AdminAppSwitcherUI
      className={className}
      items={NAV_ITEMS}
      clusters={ADMIN_OS_CLUSTERS}
      activePath={pathname}
      onLaunchApp={(app: { base: string }) => router.push(app.base)}
    />
  );
}

export { AdminAppSwitcher };
