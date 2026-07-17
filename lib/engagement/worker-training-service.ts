import { prisma } from "@/lib/prisma";

const DEFAULT_MODULE_CONTENT = `
# Complaints handling for disability support workers

As a support worker, you play an important role in helping participants feel safe to raise concerns.

## Your responsibilities
1. Listen without judgement when a participant or carer raises a concern.
2. Do not discourage or delay complaints — participants have the right to complain.
3. Report concerns to your supervisor or provider complaints officer promptly.
4. Never retaliate against someone who makes a complaint.
5. Follow your organisation's complaints procedure and document what you observed.

## NDIS Practice Standards
Registered providers must maintain a complaints system that is fair, timely, and accessible.
Workers must be trained in complaints handling (NDIS Practice Standard 1.5(4)).

## External pathways
Participants can also complain to the NDIS Quality and Safeguards Commission.
MapAble facilitates provider complaints processes — resolution remains with the support provider unless escalated externally.
`.trim();

const DEFAULT_QUIZ = [
  {
    question: "What should you do if a participant wants to make a complaint?",
    options: [
      "Discourage them to avoid trouble",
      "Listen and refer to the complaints procedure",
      "Handle it yourself without telling anyone",
      "Ignore informal concerns",
    ],
    correctIndex: 1,
  },
  {
    question: "Can participants complain to the NDIS Commission?",
    options: [
      "No, only to the provider",
      "Yes, as an external avenue",
      "Only with provider permission",
      "Only for criminal matters",
    ],
    correctIndex: 1,
  },
  {
    question: "Retaliation against someone who complains is:",
    options: [
      "Acceptable if the complaint is unfounded",
      "Only a problem for managers",
      "Never acceptable",
      "Allowed after a warning",
    ],
    correctIndex: 2,
  },
];

export async function ensureDefaultTrainingModule() {
  const existing = await prisma.workerTrainingModule.findFirst({
    where: { isPlatformDefault: true },
  });
  if (existing) return existing;

  return prisma.workerTrainingModule.create({
    data: {
      title: "Complaints handling — NDIS aligned",
      description:
        "Platform default module covering worker obligations under NDIS Practice Standard 1.5(4).",
      content: DEFAULT_MODULE_CONTENT,
      quizQuestions: DEFAULT_QUIZ,
      passingScore: 80,
      expiryMonths: 12,
      isPlatformDefault: true,
    },
  });
}

export async function listTrainingModules(organisationId?: string) {
  await ensureDefaultTrainingModule();

  return prisma.workerTrainingModule.findMany({
    where: {
      OR: [
        { isPlatformDefault: true },
        ...(organisationId ? [{ organisationId }] : []),
      ],
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getTrainingModule(moduleId: string) {
  return prisma.workerTrainingModule.findUnique({
    where: { id: moduleId },
  });
}

export function scoreQuiz(
  quizQuestions: Array<{ correctIndex: number }>,
  answers: number[]
): number {
  if (quizQuestions.length === 0) return 100;
  let correct = 0;
  quizQuestions.forEach((q, i) => {
    if (answers[i] === q.correctIndex) correct += 1;
  });
  return Math.round((correct / quizQuestions.length) * 100);
}

export async function completeTrainingModule(
  moduleId: string,
  userId: string,
  answers: number[]
) {
  const trainingModule = await prisma.workerTrainingModule.findUnique({
    where: { id: moduleId },
  });
  if (!trainingModule) throw new Error("Module not found");

  const quiz = trainingModule.quizQuestions as Array<{ correctIndex: number }>;
  const score = scoreQuiz(quiz, answers);

  if (score < trainingModule.passingScore) {
    throw new Error(
      `Score ${score}% below passing threshold of ${trainingModule.passingScore}%`
    );
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + trainingModule.expiryMonths);

  return prisma.workerTrainingCompletion.upsert({
    where: { moduleId_userId: { moduleId, userId } },
    create: { moduleId, userId, score, expiresAt },
    update: { score, completedAt: new Date(), expiresAt },
  });
}

export async function getWorkerComplianceStatus(organisationId: string) {
  const [workers, modules, completions] = await Promise.all([
    prisma.workerProfile.findMany({
      where: { organisationId },
      select: { userId: true, user: { select: { name: true, email: true } } },
    }),
    listTrainingModules(organisationId),
    prisma.workerTrainingCompletion.findMany({
      where: {
        module: {
          OR: [{ isPlatformDefault: true }, { organisationId }],
        },
      },
      include: { module: { select: { id: true, title: true } } },
    }),
  ]);

  const requiredModuleIds = modules.map((m) => m.id);
  const now = new Date();

  return workers
    .filter((w): w is typeof w & { userId: string; user: { name: string | null; email: string } } =>
      Boolean(w.userId && w.user)
    )
    .map((w) => {
      const workerCompletions = completions.filter((c) => c.userId === w.userId);
      const completedModuleIds = workerCompletions
        .filter((c) => !c.expiresAt || c.expiresAt > now)
        .map((c) => c.moduleId);

      const missing = requiredModuleIds.filter(
        (id) => !completedModuleIds.includes(id)
      );

      return {
        userId: w.userId,
        name: w.user.name ?? "Unknown",
        email: w.user.email,
        compliant: missing.length === 0,
        missingModuleIds: missing,
        completions: workerCompletions,
      };
    });
}
