import { ProviderCareActions } from "@/components/phase3/ProviderCareActions";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderCareDetailPage({
  params,
}: {
  params: Promise<{ careRequestId: string }>;
}) {
  await requireAuth();
  const { careRequestId } = await params;
  const request = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!request) return <p>Not found</p>;
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">{request.title}</h1>
      <p>{request.description}</p>
      <ProviderCareActions careRequestId={request.id} />
    </div>
  );
}
