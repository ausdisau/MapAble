import { prisma } from "@/lib/prisma";

async function main() {
  const count = await prisma.user.count();
  const sample = await prisma.user.findMany({
    take: 10,
    select: { email: true, primaryRole: true },
    orderBy: { createdAt: "desc" },
  });
  console.log(JSON.stringify({ count, sample }, null, 2));
}

main()
  .finally(() => prisma.$disconnect());
