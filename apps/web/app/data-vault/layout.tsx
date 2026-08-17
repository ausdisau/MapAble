import { CoreShell } from "@/components/core/CoreShell";

export default function DataVaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
