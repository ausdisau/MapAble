import { prisma } from "@/lib/prisma";
import { getRoutingAdapter } from "@/lib/transport/routing/routing-provider-registry";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import type { RouteOptimisationInput } from "@/types/transport-routing";

export async function createOptimisationJob(params: {
  input: RouteOptimisationInput;
  organisationId?: string;
}) {
  const adapter = getRoutingAdapter();

  const job = await prisma.transportRouteOptimisationJob.create({
    data: {
      tripId: params.input.tripId,
      organisationId: params.organisationId ?? params.input.organisationId,
      provider: adapter.provider,
      status: "pending",
      requiresHumanReview: true,
      inputPayload: params.input as object,
    },
  });

  try {
    const suggestions = await adapter.optimise(params.input);
    await prisma.transportRouteOptimisationJob.update({
      where: { id: job.id },
      data: { status: "completed" },
    });
    await prisma.transportRouteOptimisationResult.createMany({
      data: suggestions.map((s) => ({
        jobId: job.id,
        summary: s.summary,
        score: s.score,
        suggestionPayload: s as object,
      })),
    });
    return getOptimisationJob(job.id);
  } catch (e) {
    const message =
      e instanceof TransportApiError
        ? e.message
        : "Optimisation failed";
    await prisma.transportRouteOptimisationJob.update({
      where: { id: job.id },
      data: { status: "failed", errorMessage: message },
    });
    if (e instanceof TransportApiError) throw e;
    throw new TransportApiError("TRANSPORT_OPTIMISATION_FAILED", message);
  }
}

export async function getOptimisationJob(jobId: string) {
  const job = await prisma.transportRouteOptimisationJob.findUnique({
    where: { id: jobId },
    include: { results: true },
  });
  if (!job) throw new TransportApiError("TRANSPORT_ROUTE_NOT_FOUND");
  return job;
}
