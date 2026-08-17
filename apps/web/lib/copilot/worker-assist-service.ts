import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  WORKER_ASSIST_DISCLAIMER,
  y3NationalTrustConfig,
} from "@/lib/config/y3-national-trust";
import { prisma } from "@/lib/prisma";

const MONITORING_BLOCKLIST =
  /\b(monitor|surveillance|track|watch|spy|record without consent)\b/i;

export function isWorkerAssistCopilotEnabled() {
  return y3NationalTrustConfig.workerAssistCopilotEnabled;
}

export async function getActiveShiftForWorker(params: {
  workerProfileId: string;
  shiftId: string;
}) {
  return prisma.careShift.findFirst({
    where: {
      id: params.shiftId,
      workerProfileId: params.workerProfileId,
      status: { in: ["scheduled", "in_progress"] },
    },
    select: {
      id: true,
      startAt: true,
      endAt: true,
      status: true,
      location: true,
      tasks: true,
      participantId: true,
    },
  });
}

export function validateWorkerAssistPrompt(prompt: string) {
  if (MONITORING_BLOCKLIST.test(prompt)) {
    throw new Error("WORKER_ASSIST_MONITORING_BLOCKED");
  }
}

export async function handleWorkerAssistRequest(params: {
  workerProfileId: string;
  shiftId: string;
  actorUserId: string;
  prompt: string;
}) {
  if (!isWorkerAssistCopilotEnabled()) {
    throw new Error("WORKER_ASSIST_COPILOT_DISABLED");
  }

  validateWorkerAssistPrompt(params.prompt);

  const shift = await getActiveShiftForWorker({
    workerProfileId: params.workerProfileId,
    shiftId: params.shiftId,
  });
  if (!shift) throw new Error("SHIFT_NOT_ACTIVE");

  const lower = params.prompt.toLowerCase();
  let response = `${WORKER_ASSIST_DISCLAIMER} `;

  if (/incident|unsafe|emergency/.test(lower)) {
    response +=
      "For incidents, use the incident report flow. Call 000 if anyone is in immediate danger.";
  } else if (/timesheet|check.?out|hours/.test(lower)) {
    response +=
      "Remember to check out when your shift ends so your timesheet is accurate.";
  } else if (/routine|task|what do i/.test(lower)) {
    response += `Your shift tasks are listed in your brief. Location: ${shift.location ?? "see shift details"}.`;
  } else {
    response +=
      "I can help with shift tasks, timesheet reminders, and incident templates — not participant monitoring.";
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "worker_assist.query",
    entityType: "CareShift",
    entityId: shift.id,
    participantId: shift.participantId,
    metadata: { promptLength: params.prompt.length },
  });

  return { response, shiftId: shift.id, disclaimer: WORKER_ASSIST_DISCLAIMER };
}
