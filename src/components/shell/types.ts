import type { ComponentType } from "react";

export interface FlattenedNavigationItem {
  id: string;
  name: string;
  href: string;
  icon: ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  parentApp?: string;
  description?: string;
  keywords?: string[];
}

export interface NavContextMenuState {
  href: string;
  label: string;
  position: { x: number; y: number };
}
