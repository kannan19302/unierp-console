"use client";

import React from "react";
import { StrataBar } from "@kannan19302/ui/shell";

interface BreadcrumbsProps {
  crumbs: Array<{ label: string; href?: string }>;
  scope?: React.ComponentProps<typeof StrataBar>["scope"];
}

export function Breadcrumbs({ crumbs, scope = "manage" }: BreadcrumbsProps) {
  return (
    <StrataBar
      segments={crumbs.map((crumb) => crumb.label)}
      scope={scope}
    />
  );
}
