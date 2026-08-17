import { CoreShell } from "@/components/core/CoreShell";

export default function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
