import { CoreShell } from "@/components/core/CoreShell";

export default function CoreHubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
