import { CoreShell } from "@/components/core/CoreShell";

export default function AssessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
