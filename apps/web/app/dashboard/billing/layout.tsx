import { BillingCentreNav } from "@/components/billing/BillingCentreNav";

export const metadata = {
  title: "Invoice & billing centre | MapAble Core",
};

export default function BillingCentreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <BillingCentreNav />
      {children}
    </div>
  );
}
