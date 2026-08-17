import { CoreShell } from "@/components/core/CoreShell";

export default function EnterpriseProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
