import { prisma } from "@/lib/prisma";

export async function ensureAcademyCourses() {
  const defaults = [
    {
      code: "SAFEGUARDING-101",
      title: "Safeguarding essentials",
      description: "Incident reporting and escalation",
    },
    {
      code: "ACCESSIBILITY-101",
      title: "Accessible service delivery",
      description: "WCAG-aligned participant support",
    },
  ];
  for (const c of defaults) {
    await prisma.providerAcademyCourse.upsert({
      where: { code: c.code },
      create: { ...c, status: "published" },
      update: {},
    });
  }
}

export async function enrollInCourse(courseId: string, userId: string) {
  return prisma.providerAcademyEnrollment.upsert({
    where: { courseId_userId: { courseId, userId } },
    create: { courseId, userId, status: "enrolled" },
    update: {},
  });
}

export async function getAcademyCatalog() {
  await ensureAcademyCourses();
  return prisma.providerAcademyCourse.findMany({
    where: { status: "published" },
    include: { _count: { select: { enrollments: true } } },
  });
}

export async function listUserEnrollments(userId: string) {
  return prisma.providerAcademyEnrollment.findMany({
    where: { userId },
    include: { course: true },
  });
}
