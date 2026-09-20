import ControlPlaneShell from "@/components/shell";

export default function ControlPlaneLayout({ children }: { children: React.ReactNode }) {
  return <ControlPlaneShell>{children}</ControlPlaneShell>;
}