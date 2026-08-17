import { ProviderPublicShell } from "@/components/provider/ProviderPublicShell";

export default function ProviderPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProviderPublicShell>{children}</ProviderPublicShell>;
}
