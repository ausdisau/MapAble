import { SafetyCentreNav } from "@/components/safety/SafetyCentreNav";

export const metadata = {
  title: "Safety & incident management centre | MapAble Core",
};

export default function SafetyCentreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <SafetyCentreNav />
      {children}
    </div>
  );
}
