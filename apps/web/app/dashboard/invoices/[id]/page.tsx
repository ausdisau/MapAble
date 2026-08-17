import { redirect } from "next/navigation";

export default async function LegacyInvoiceRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/billing/legacy/${id}`);
}
