import { redirect } from "next/navigation";

export default async function SupportTicketRedirectPage({
  params,
}: {
  params: Promise<{ ticketId: string }>;
}) {
  const { ticketId } = await params;
  redirect(`/dashboard/safety/support/${ticketId}`);
}
