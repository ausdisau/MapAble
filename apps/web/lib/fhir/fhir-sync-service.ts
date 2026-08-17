import { getFhirProvider } from "@/lib/fhir/fhir-adapter";
import { hapiFhirAdapter } from "@/lib/fhir/hapi-fhir-adapter";
import { medplumAdapter } from "@/lib/fhir/medplum-adapter";
import { prisma } from "@/lib/prisma";

export async function recordFhirSyncEvent(input: {
  eventType: string;
  status: string;
  message?: string;
  linkId?: string;
}) {
  await prisma.fhirSyncEvent.create({
    data: {
      linkId: input.linkId,
      eventType: input.eventType,
      status: input.status,
      message: input.message,
    },
  });
}

export function getActiveFhirAdapter() {
  const provider = getFhirProvider();
  if (provider === "medplum") return medplumAdapter;
  if (provider === "hapi") return hapiFhirAdapter;
  return null;
}
