import type { ReactNode } from "react";

export default function OperationsLayout({ children }: { children: ReactNode }) {
  return <section aria-label="Platform Operations" data-density="compact">{children}</section>;
}
