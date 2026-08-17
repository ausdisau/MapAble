import { redirect } from "next/navigation";

export default async function DashboardCareShiftDetailRedirect({
  params,
}: {
  params: Promise<{ shiftId: string }>;
}) {
  const { shiftId } = await params;
  redirect(`/care/shifts/${shiftId}`);
}
