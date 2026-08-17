import { CoreShell } from "@/components/core/CoreShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function CorePublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CoreShell>{children}</CoreShell>;
}
