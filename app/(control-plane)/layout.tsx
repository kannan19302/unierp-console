import ControlPlaneShell from "@/components/console-shell";

export default function ControlPlaneLayout({ children }: { children: React.ReactNode }) {
  return <ControlPlaneShell>{children}</ControlPlaneShell>;
}