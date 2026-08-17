import { redirect } from "next/navigation";

export default async function FundingDetailRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/billing/funding/${id}`);
}
